import sys
import json
import os
import boto3
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("REGION", "il-central-1")
LAMBDA_FUNCTION_NAME = os.getenv(
    "CONFIRM_CONSOLE_CREATED_ADMIN_FUNCTION_NAME", "charging-stations-confirm-console-created-admin"
)

lambda_client = boto3.client("lambda", region_name=REGION)


def invoke_confirm_console_created_admin(account_id: str, username: str, password: str, new_password: str) -> bytes:
    payload = {
        "username": username,
        "password": password,
        "new_password": new_password,
        "trigger": "script_run",
    }
    response = lambda_client.invoke(
        FunctionName=f"arn:aws:lambda:{REGION}:{account_id}:function:{LAMBDA_FUNCTION_NAME}",
        InvocationType="RequestResponse",
        Payload=json.dumps(payload).encode("utf-8"),
    )
    return response["Payload"].read()

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(
            "Usage: python -m run_confirm_console_created_admin <aws_account_id> <email> <password> <new_password>",
            file=sys.stderr,
        )
        sys.exit(1)
    account_id = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    new_password = sys.argv[4]
    payload_bytes = invoke_confirm_console_created_admin(account_id, username, password, new_password)
    payload = json.loads(payload_bytes.decode("utf-8"))
    if "errorMessage" in payload:
        print(f"Lambda reported error: {payload['errorMessage']}", file=sys.stderr)
        sys.exit(1)
    else:
        print("Console created admin confirmed successfully")
        sys.exit(0)
