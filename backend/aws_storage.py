import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = "medicalai-platform-edu"
s3 = boto3.client('s3', region_name='eu-west-1')

def upload_file(local_path: str, s3_key: str):
    s3.upload_file(local_path, BUCKET_NAME, s3_key)
    print(f"Uploaded: {s3_key}")

def download_file(s3_key: str, local_path: str):
    s3.download_file(BUCKET_NAME, s3_key, local_path)
    print(f"Downloaded: {s3_key}")

def list_files(prefix: str = ""):
    response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
    files = [obj['Key'] for obj in response.get('Contents', [])]
    return files

if __name__ == "__main__":
    # Upload analysis results
    import pandas as pd
    from sqlalchemy import create_engine

    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medicalai:medicalai123@localhost:5432/medicalai")
    engine = create_engine(DATABASE_URL)

    df_diagnoses = pd.read_sql("SELECT * FROM diagnoses", engine)
    summary = df_diagnoses.groupby('diagnosis').agg(
        count=('id', 'count'),
        mean_severity=('severity', 'mean'),
        mean_confidence=('confidence', 'mean')
    ).reset_index()

    # Save locally then upload
    summary.to_csv("diagnosis_summary.csv", index=False)
    upload_file("diagnosis_summary.csv", "analysis/diagnosis_summary.csv")

    # Upload MLflow db
    upload_file("backend/mlflow.db", "mlflow/mlflow.db")

    print("\nFiles in S3:")
    for f in list_files():
        print(f" - {f}")