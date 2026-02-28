from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Patient, Diagnosis
import httpx

router = APIRouter()

@router.get("/statistics")
def get_statistics(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()
    
    diagnosis_dist = db.query(
        Diagnosis.diagnosis,
        func.count(Diagnosis.id).label("count")
    ).group_by(Diagnosis.diagnosis).all()

    severity_dist = db.query(
        Diagnosis.severity,
        func.count(Diagnosis.id).label("count")
    ).group_by(Diagnosis.severity).all()

    return {
        "total_patients": total_patients,
        "diagnosis_distribution": {d: c for d, c in diagnosis_dist if d},
        "severity_distribution": {str(s): c for s, c in severity_dist if s is not None},
    }

@router.get("/mlflow/experiments")
async def get_mlflow_experiments():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "http://mlflow:5000/api/2.0/mlflow/experiments/search",
                params={"max_results": 10},
                timeout=5
            )
            return r.json()
    except Exception as e:
        return {"experiments": [], "error": str(e)}

@router.get("/mlflow/runs")
async def get_mlflow_runs():
    try:
        async with httpx.AsyncClient() as client:
            exp_r = await client.get(
                "http://mlflow:5000/api/2.0/mlflow/experiments/search",
                params={"max_results": 10},
                timeout=5
            )
            experiments = exp_r.json().get("experiments", [])
            
            all_runs = []
            for exp in experiments:
                runs_r = await client.post(
                    "http://mlflow:5000/api/2.0/mlflow/runs/search",
                    json={"experiment_ids": [exp["experiment_id"]], "max_results": 10},
                    timeout=5
                )
                runs = runs_r.json().get("runs", [])
                all_runs.extend(runs)
            return {"runs": all_runs}
    except Exception as e:
        return {"runs": [], "error": str(e)}
