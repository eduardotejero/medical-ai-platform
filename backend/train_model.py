import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
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

print(f"Dataset: {len(df)} records")

# Filter diagnoses with insufficient samples
min_samples = 10
counts = df['diagnosis'].value_counts()
valid_dx = counts[counts >= min_samples].index
df = df[df['diagnosis'].isin(valid_dx)]
print(f"After filtering: {len(df)} records, {len(valid_dx)} diagnoses")

X = df[['severity', 'confidence']].values
le = LabelEncoder()
y = le.fit_transform(df['diagnosis'].values)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTrain: {len(X_train)}, Test: {len(X_test)}")

models = {
    'Logistic Regression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, random_state=42))
    ]),
    'Random Forest': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ]),
    'Gradient Boosting': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', GradientBoostingClassifier(n_estimators=100, random_state=42))
    ])
}

results = {}
for name, model in models.items():
    print(f"\n=== {name} ===")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    results[name] = {
        'accuracy': acc,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std()
    }
    print(f"Accuracy: {acc:.4f}")
    print(f"Cross-validation: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

best_model_name = max(results, key=lambda x: results[x]['cv_mean'])
print(f"\n=== BEST MODEL: {best_model_name} ===")
print(f"CV Accuracy: {results[best_model_name]['cv_mean']:.4f}")