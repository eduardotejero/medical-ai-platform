import pandas as pd
import numpy as np
from scipy import stats
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medicalai:medicalai123@localhost:5432/medicalai")

import re
match = re.match(r'postgresql://(\w+):(\w+)@([\w.]+):(\d+)/(\w+)', DATABASE_URL)
user, password, host, port, dbname = match.groups()

conn = psycopg2.connect(
    dbname=dbname, user=user, password=password, host=host, port=port
)

# Load data
df_patients = pd.read_sql("SELECT * FROM patients", conn)
df_diagnoses = pd.read_sql("SELECT * FROM diagnoses", conn)
df = pd.merge(df_patients, df_diagnoses, left_on='id', right_on='patient_id')

print("=== DATASET OVERVIEW ===")
print(f"Total patients: {len(df_patients)}")
print(f"Total diagnoses: {len(df_diagnoses)}")
print(f"\nDiagnosis distribution:")
print(df['diagnosis'].value_counts())

print("\n=== DESCRIPTIVE STATISTICS ===")
print(f"\nSeverity stats:")
print(df['severity'].describe())

print(f"\nConfidence stats:")
print(df['confidence'].describe())

print("\n=== SEVERITY BY DIAGNOSIS ===")
severity_by_dx = df.groupby('diagnosis')['severity'].agg(['mean', 'std', 'count'])
print(severity_by_dx)

print("\n=== STATISTICAL TESTS ===")

# ANOVA — severity differences between diagnoses
groups = [group['severity'].values for name, group in df.groupby('diagnosis')]
f_stat, p_value = stats.f_oneway(*groups)
print(f"\nANOVA — severity across diagnoses:")
print(f"F-statistic: {f_stat:.4f}")
print(f"P-value: {p_value:.6f}")
if p_value < 0.05:
    print("Result: Significant differences between diagnoses (p < 0.05)")

# Chi-square — diagnosis distribution
dx_counts = df['diagnosis'].value_counts()
chi2, p_chi2 = stats.chisquare(dx_counts.values)
print(f"\nChi-square — diagnosis distribution:")
print(f"Chi2: {chi2:.4f}")
print(f"P-value: {p_chi2:.6f}")

# Confidence intervals 95% per diagnosis
print("\n=== CONFIDENCE INTERVALS 95% ===")
for dx, group in df.groupby('diagnosis'):
    n = len(group)
    mean = group['severity'].mean()
    se = stats.sem(group['severity'].values)
    ci = stats.t.interval(0.95, df=n-1, loc=mean, scale=se)
    print(f"{dx}: mean={mean:.2f}, 95% CI=[{ci[0]:.2f}, {ci[1]:.2f}], n={n}")

# Correlation confidence vs severity
corr, p_corr = stats.pearsonr(df['confidence'], df['severity'])
print(f"\nPearson correlation — confidence vs severity:")
print(f"r={corr:.4f}, p={p_corr:.6f}")

conn.close()
print("\n=== ANALYSIS COMPLETE ===")