import boto3
import io
import os
from datetime import datetime

BUCKET_NAME = "medicalai-platform-edu"
s3 = boto3.client('s3', region_name='eu-west-1')

def upload_image(file_bytes: bytes, filename: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    s3_key = f"cv-images/{timestamp}_{filename}"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType="image/jpeg"
    )
    return s3_key

def upload_result(result: dict, filename: str) -> str:
    import json
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    s3_key = f"cv-results/{timestamp}_{filename}.json"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=json.dumps(result),
        ContentType="application/json"
    )
    return s3_key

def list_images() -> list:
    response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="cv-images/")
    return [obj['Key'] for obj in response.get('Contents', [])]