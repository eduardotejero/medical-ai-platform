import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_DEFAULT_REGION", "eu-west-1")
FUNCTION_NAME = "medicalai-hl7-processor"

lambda_client = boto3.client('lambda', region_name=REGION)

def create_lambda_function():
    """Create Lambda function for HL7 processing"""
    lambda_code = '''
import json

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    raw_message = body.get('raw_message', '')
    
    segments = raw_message.split('\\r')
    message_type = 'UNKNOWN'
    
    for seg in segments:
        if seg.startswith('MSH'):
            fields = seg.split('|')
            if len(fields) > 9:
                message_type = fields[8]
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': True,
            'message_type': message_type,
            'segments': len(segments),
            'source': 'AWS Lambda'
        })
    }
'''

    zip_buffer = create_zip(lambda_code)

    try:
        response = lambda_client.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime='python3.11',
            Role=os.getenv("AWS_LAMBDA_ROLE_ARN", "arn:aws:iam::000000000000:role/lambda-role"),
            Handler='handler.lambda_handler',
            Code={'ZipFile': zip_buffer},
            Description='HL7 message processor for Medical AI Platform',
            Timeout=30,
        )
        return {"created": True, "arn": response['FunctionArn']}
    except lambda_client.exceptions.ResourceConflictException:
        return {"created": False, "message": "Function already exists"}

def invoke_lambda(raw_message: str) -> dict:
    try:
        response = lambda_client.invoke(
            FunctionName=FUNCTION_NAME,
            InvocationType='RequestResponse',
            Payload=json.dumps({"body": json.dumps({"raw_message": raw_message})})
        )
        result = json.loads(response['Payload'].read())
        return json.loads(result.get('body', '{}'))
    except Exception as e:
        return {"error": str(e), "source": "Lambda invocation failed"}

def create_zip(code: str) -> bytes:
    import io
    import zipfile
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as zf:
        zf.writestr('handler.py', code)
    return buffer.getvalue()