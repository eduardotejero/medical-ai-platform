import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medicalai:medicalai123@localhost:5432/medicalai")

# Parse connection string
import re
match = re.match(r'postgresql://(\w+):(\w+)@([\w.]+):(\d+)/(\w+)', DATABASE_URL)
user, password, host, port, dbname = match.groups()

conn = psycopg2.connect(
    dbname=dbname, user=user, password=password, host=host, port=port
)
cursor = conn.cursor()

# Load HAM10000 metadata
df = pd.read_csv("data/GroundTruth.csv")
print(f"Dataset loaded: {len(df)} records")
print(df.head())
print(df.columns.tolist())

# Map dataset to our schema
diagnosis_map = {
    'MEL': 'Melanoma',
    'NV': 'Melanocytic Nevi',
    'BCC': 'Basal Cell Carcinoma',
    'AKIEC': 'Actinic Keratosis',
    'BKL': 'Benign Keratosis',
    'DF': 'Dermatofibroma',
    'VASC': 'Vascular Lesion'
}

severity_map = {
    'MEL': 5,
    'BCC': 3,
    'AKIEC': 3,
    'VASC': 2,
    'NV': 1,
    'BKL': 1,
    'DF': 1
}

diagnosis_cols = ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC']

inserted = 0
for _, row in df.iterrows():
    dx = row[diagnosis_cols].idxmax()

    cursor.execute("""
        INSERT INTO patients (patient_code, age, gender)
        VALUES (%s, %s, %s)
        ON CONFLICT (patient_code) DO NOTHING
        RETURNING id
    """, (row['image'], None, None))

    result = cursor.fetchone()
    if result:
        patient_id = result[0]

        cursor.execute("""
            INSERT INTO diagnoses (patient_id, diagnosis, severity, confidence)
            VALUES (%s, %s, %s, %s)
        """, (
            patient_id,
            diagnosis_map.get(dx, dx),
            severity_map.get(dx, 1),
            float(row[dx])
        ))
        inserted += 1

conn.commit()
cursor.close()
conn.close()
print(f"Inserted {inserted} patients with diagnoses")