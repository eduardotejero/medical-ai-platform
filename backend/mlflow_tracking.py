import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, f1_score
from sklearn.pipeline import Pipeline
import mlflow
import mlflow.sklearn
import psycopg2
import os
from dotenv import load_dotenv
import re

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medicalai:medicalai123@localhost:5432/medicalai")
match = re.match(r'postgresql://(\w+):(\w+)@([\w.]+):(\d+)/(\w+)', DATABASE_URL)
user, password, host, port, dbname = match.groups()

conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
df_patients = pd.read_sql("SELECT * FROM patients", conn)
df_diagnoses = pd.read_sql("SELECT * FROM diagnoses", conn)
df = pd.merge(df_patients, df_diagnoses, left_on='id', right_on='patient_id')
conn.close()

min_samples = 10
counts = df['diagnosis'].value_counts()
valid_dx = counts[counts >= min_samples].index
df = df[df['diagnosis'].isin(valid_dx)]

X = df[['severity', 'confidence']].values
le = LabelEncoder()
y = le.fit_transform(df['diagnosis'].values)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

mlflow.set_experiment("dermatology-classification")

models = {
    'logistic_regression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, random_state=42))
    ]),
    'random_forest': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ]),
    'gradient_boosting': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', GradientBoostingClassifier(n_estimators=100, random_state=42))
    ])
}

for name, model in models.items():
    with mlflow.start_run(run_name=name):
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

        mlflow.log_param("model", name)
        mlflow.log_param("n_features", X.shape[1])
        mlflow.log_param("train_size", len(X_train))
        mlflow.log_param("test_size", len(X_test))
        mlflow.log_param("n_classes", len(le.classes_))

        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("f1_weighted", f1)
        mlflow.log_metric("cv_mean", cv_scores.mean())
        mlflow.log_metric("cv_std", cv_scores.std())

        mlflow.sklearn.log_model(model, name)

        print(f"{name}: accuracy={acc:.4f}, f1={f1:.4f}, cv={cv_scores.mean():.4f}")

print("\nMLflow tracking complete. Run: mlflow ui")