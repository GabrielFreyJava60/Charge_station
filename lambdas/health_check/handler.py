"""
Health Check Lambda — вызывается бэкендом для проверки работоспособности
всей цепочки: Frontend → Backend → Lambda → DynamoDB.
"""

import os
import json
import time
from datetime import datetime, timezone

import boto3

STATIONS_TABLE = os.environ.get("STATIONS_TABLE", "Stations")
SESSIONS_TABLE = os.environ.get("SESSIONS_TABLE", "Sessions")
REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")


def lambda_handler(event, context):
    """Проверяет доступность Lambda и DynamoDB."""
    start = time.time()
    checks = {}

    checks["lambda"] = {
        "status": "ok",
        "functionName": context.function_name if context else "local",
        "memoryMB": context.memory_limit_in_mb if context else "N/A",
        "region": REGION,
    }

    try:
        dynamodb = boto3.resource("dynamodb", region_name=REGION)
        table = dynamodb.Table(STATIONS_TABLE)
        table.table_status
        checks["dynamodb"] = {
            "status": "ok",
            "stationsTable": STATIONS_TABLE,
            "tableStatus": table.table_status,
        }
    except Exception as e:
        checks["dynamodb"] = {
            "status": "error",
            "message": str(e),
        }

    try:
        dynamodb = boto3.resource("dynamodb", region_name=REGION)
        table = dynamodb.Table(STATIONS_TABLE)
        response = table.scan(
            FilterExpression="SK = :sk",
            ExpressionAttributeValues={":sk": "METADATA"},
            Select="COUNT",
        )
        checks["data"] = {
            "stationCount": response.get("Count", 0),
        }
    except Exception:
        checks["data"] = {"stationCount": "N/A"}

    elapsed_ms = round((time.time() - start) * 1000, 2)

    all_ok = all(
        c.get("status") == "ok"
        for c in checks.values()
        if isinstance(c, dict) and "status" in c
    )

    body = {
        "service": "health_check_lambda",
        "status": "ok" if all_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "responseTimeMs": elapsed_ms,
        "checks": checks,
    }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
