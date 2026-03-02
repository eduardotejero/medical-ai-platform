from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from pydantic import BaseModel
from typing import Optional
import pickle, os, json, csv, threading
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
import mlflow
import mlflow.sklearn

router = APIRouter()

_training_running = False
_train_error: str = None

DIAGNOSES = [
    "Melanocytic Nevi", "Melanoma", "Benign Keratosis",
    "Basal Cell Carcinoma", "Actinic Keratosis", "Vascular Lesion", "Dermatofibroma"
]
CSV_PATH     = "/app/data/GroundTruth.csv"
LABEL_MAP    = {
    "MEL": "Melanoma", "NV": "Melanocytic Nevi", "BCC": "Basal Cell Carcinoma",
    "AKIEC": "Actinic Keratosis", "BKL": "Benign Keratosis",
    "DF": "Dermatofibroma", "VASC": "Vascular Lesion",
}
SEVERITY_MAP = {
    "Melanoma": 5, "Actinic Keratosis": 3, "Basal Cell Carcinoma": 3,
    "Vascular Lesion": 2, "Melanocytic Nevi": 1, "Benign Keratosis": 1, "Dermatofibroma": 1,
}
MODEL_PATH   = "/app/skin_model.pkl"
ENCODER_PATH = "/app/skin_encoder.pkl"
RESULTS_PATH = "/app/train_results.json"
FEATURES = ["age", "gender", "fitzpatrick_type", "lesion_diameter", "uv_exposure", "abcde_score"]


class PredictInput(BaseModel):
    age: float
    gender: str
    fitzpatrick_type: int
    lesion_diameter: float
    uv_exposure: float
    abcde_score: float
    model_name: Optional[str] = None  # "logistic-regression" | "random-forest" | "gradient-boosting" | None = best


@router.get("/status")
def model_status():
    return {"trained": os.path.exists(MODEL_PATH)}


@router.get("/training-status")
def get_training_status():
    return {"running": _training_running, "error": _train_error}


@router.get("/results")
def get_results():
    if not os.path.exists(RESULTS_PATH):
        return {"trained": False}
    with open(RESULTS_PATH) as f:
        data = json.load(f)
    data["trained"] = True
    return data


def _run_training_bg():
    global _training_running, _train_error
    from database import SessionLocal
    db = SessionLocal()
    try:
        result = _do_train(db)
        _train_error = result.get("error") if isinstance(result, dict) else None
    except Exception as e:
        _train_error = str(e)
    finally:
        db.close()
        _training_running = False


@router.post("/train")
def train_model():
    global _training_running, _train_error
    if _training_running:
        return {"started": False, "message": "Training already in progress"}
    _training_running = True
    _train_error = None
    threading.Thread(target=_run_training_bg, daemon=True).start()
    return {"started": True}


def _do_train(db: Session):
    query = text("""
        SELECT
            COALESCE(p.age, 45)                                    AS age,
            CASE WHEN p.gender = 'M' THEN 1 ELSE 0 END            AS gender,
            COALESCE(p.fitzpatrick_type, 3)                        AS fitzpatrick_type,
            COALESCE(cd.lesion_diameter, 8.0)                      AS lesion_diameter,
            COALESCE(cd.uv_exposure, 5.0)                          AS uv_exposure,
            COALESCE(cd.abcde_score, 5.0)                          AS abcde_score,
            d.diagnosis
        FROM patients p
        JOIN diagnoses d ON d.patient_id = p.id
        LEFT JOIN LATERAL (
            SELECT lesion_diameter, uv_exposure, abcde_score
            FROM clinical_data
            WHERE patient_id = p.id
            ORDER BY recorded_at DESC
            LIMIT 1
        ) cd ON true
        WHERE d.diagnosis IN (
            'Melanocytic Nevi', 'Melanoma', 'Benign Keratosis',
            'Basal Cell Carcinoma', 'Actinic Keratosis', 'Vascular Lesion', 'Dermatofibroma'
        )
    """)

    rows = db.execute(query).fetchall()
    if len(rows) < 50:
        return {"error": "Not enough data to train"}

    X = np.array([[r.age, r.gender, r.fitzpatrick_type,
                   r.lesion_diameter, r.uv_exposure, r.abcde_score] for r in rows])
    y_raw = [r.diagnosis for r in rows]

    le = LabelEncoder()
    le.fit(DIAGNOSES)
    y = le.transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    try:
        mlflow.set_tracking_uri("http://mlflow:5000")
        mlflow.set_experiment("dermatology-skin-lesion")
    except Exception:
        pass

    candidates = [
        ("logistic-regression", Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, random_state=42))
        ])),
        ("random-forest",    RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)),
        ("gradient-boosting", GradientBoostingClassifier(n_estimators=50, random_state=42)),
    ]

    runs = []
    best_model = None
    best_acc = 0

    for name, clf in candidates:
        try:
            with mlflow.start_run(run_name=name):
                clf.fit(X_train, y_train)
                acc = float(accuracy_score(y_test, clf.predict(X_test)))
                cv  = float(cross_val_score(clf, X, y, cv=3, n_jobs=-1).mean())
                mlflow.log_param("model", name)
                mlflow.log_metric("accuracy", acc)
                mlflow.log_metric("cv_mean", cv)
                mlflow.sklearn.log_model(clf, name)
        except Exception:
            clf.fit(X_train, y_train)
            acc = float(accuracy_score(y_test, clf.predict(X_test)))
            cv  = float(cross_val_score(clf, X, y, cv=3, n_jobs=-1).mean())

        runs.append({"name": name, "accuracy": round(acc, 4), "cv_mean": round(cv, 4)})
        if acc > best_acc:
            best_acc = acc
            best_model = clf
        # Save per-model pickle (trained on X_train; usable for per-model selection)
        with open(f"/app/model_{name}.pkl", "wb") as f:
            pickle.dump(clf, f)

    # Retrain best model on full dataset and persist
    best_model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(le, f)

    # Feature importance: tree models have feature_importances_; LR uses coef_ magnitude
    try:
        fi_values = best_model.feature_importances_
    except AttributeError:
        # Pipeline with LogisticRegression
        coef = best_model.named_steps["clf"].coef_
        fi_values = np.abs(coef).mean(axis=0)
        fi_values = fi_values / fi_values.sum()

    importance = {FEATURES[i]: round(float(fi_values[i]), 4) for i in range(len(FEATURES))}
    best_name = max(runs, key=lambda r: r["accuracy"])["name"]

    result = {
        "samples": len(rows),
        "runs": runs,
        "best_model": best_name,
        "feature_importance": importance,
    }

    with open(RESULTS_PATH, "w") as f:
        json.dump(result, f)

    return {"status": "trained", **result}


@router.post("/seed-diagnoses")
def seed_diagnoses(db: Session = Depends(get_db)):
    """Re-seed diagnoses table from HAM10000 GroundTruth.csv."""
    from models import Patient, Diagnosis
    if not os.path.exists(CSV_PATH):
        return {"error": "GroundTruth.csv not found at " + CSV_PATH}

    # Clear existing ground-truth diagnoses (confidence == 1.0) to avoid duplicates
    db.query(Diagnosis).filter(Diagnosis.confidence == 1.0).delete()
    db.commit()

    inserted = skipped = 0
    batch = []
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            image_id = row["image"]
            label_col = max(LABEL_MAP.keys(), key=lambda k: float(row.get(k, 0) or 0))
            diagnosis_name = LABEL_MAP[label_col]
            patient = db.query(Patient).filter(Patient.patient_code == image_id).first()
            if not patient:
                skipped += 1
                continue
            batch.append(Diagnosis(
                patient_id=patient.id,
                diagnosis=diagnosis_name,
                severity=SEVERITY_MAP[diagnosis_name],
                confidence=1.0,
            ))
            inserted += 1
            if len(batch) >= 500:
                db.bulk_save_objects(batch)
                db.commit()
                batch = []
    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    return {"inserted": inserted, "skipped": skipped}


@router.post("/predict")
def predict(data: PredictInput):
    if data.model_name:
        path = f"/app/model_{data.model_name}.pkl"
        if not os.path.exists(path):
            return {"error": f"Model '{data.model_name}' not found. Train first."}
    else:
        path = MODEL_PATH
        if not os.path.exists(path):
            return {"error": "Model not trained yet. Go to ML Models page and click TRAIN."}

    with open(path, "rb") as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, "rb") as f:
        le = pickle.load(f)

    gender_val = 1 if data.gender == "M" else 0
    X = np.array([[data.age, gender_val, data.fitzpatrick_type,
                   data.lesion_diameter, data.uv_exposure, data.abcde_score]])

    proba = model.predict_proba(X)[0]
    probabilities = [
        {"diagnosis": le.classes_[i], "probability": float(proba[i])}
        for i in range(len(le.classes_))
    ]
    probabilities.sort(key=lambda x: x["probability"], reverse=True)

    return {
        "prediction": probabilities[0]["diagnosis"],
        "confidence": probabilities[0]["probability"],
        "probabilities": probabilities,
    }
