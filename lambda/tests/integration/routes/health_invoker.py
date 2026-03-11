import boto3
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv('REGION', 'il-central-1')
HEALTH_FUNCTION_NAME = os.getenv('HEALTH_FUNCTION_NAME', 'charging-stations-health')
lambda_client = boto3.client('lambda', region_name=REGION)

def invoke_health_function(account_id):
    response = lambda_client.invoke(
        FunctionName=f"arn:aws:lambda:{REGION}:{account_id}:function:{HEALTH_FUNCTION_NAME}",
        InvocationType='RequestResponse',
        Payload=json.dumps({})
    )
    return response['Payload'].read()

def test_health_function(account_id):
    responseBytes = invoke_health_function(account_id)
    response = json.loads(responseBytes)
    assert response['code'] == 200
    assert response['status'] == 'running'

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python -m tests.integration.routes.health_invoker <account_id>")
        sys.exit(1)
    account_id = sys.argv[1]
    test_health_function(account_id)