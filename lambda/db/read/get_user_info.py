import os
import json
import boto3
import psycopg2
from utils.logger import logger, log_audit
from typing import Any

_conn = None

def get_db_config() -> dict:
    return {
        "host": os.environ["DB_HOST"],
        "port": int(os.environ.get("DB_PORT", "5432")),
        "dbname": os.environ["DB_NAME"],
        "user": os.environ["DB_USER"],
        "region": os.environ.get("AWS_REGION", "il-central-1"),
    }
def get_connection() -> psycopg2.extensions.connection:
    global _conn
    if _conn is None or _conn.closed:
        cfg = get_db_config()
        rds = boto3.client("rds", region_name=cfg["region"])
        token = rds.generate_db_auth_token(
            DBHostname=cfg["host"],
            Port=cfg["port"],
            DBUsername=cfg["user"],
            Region=cfg["region"],
        )
        _conn = psycopg2.connect(
            host=cfg["host"],
            port=cfg["port"],
            dbname=cfg["dbname"],
            user=cfg["user"],
            password=token,
            sslmode="require",
        )
    return _conn

def extract_user_id_from_event(event: dict) -> str:
    logger.info(f"Extracting user id")
    user_id = event.get("user_id")
    if not user_id:
        raise ValueError("missing user_id")
    return user_id

def get_user_info(user_id: str) -> tuple | None:
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        return cur.fetchone()

def build_json(user_info: tuple) -> dict:
    return {
                "user_id": user_info[0],
                "full_name": user_info[1],
                "email": user_info[2],
                "phone": user_info[3],
                "role": user_info[4],
                "status": user_info[5],
                "created_at": user_info[6].isoformat() if user_info[6] else None,
                "updated_at": user_info[7].isoformat() if user_info[7] else None,
    }

def handler(event: dict, context: Any) -> dict:
    logger.info(f"Handler called with event: {event}")
    caller_id = event.get("caller_id")
    if not caller_id:
        raise PermissionError("caller_id is required")
    audit_base = {
        "userId": event.get("XXXXX"),
        "service": context.function_name,
        "event": "FETCH_USER_INFO",
        "requestId": context.aws_request_id,
    }
    try:
        user_id = extract_user_id_from_event(event)
        user_info = get_user_info(user_id)
        if not user_info:
            log_audit(
                "ERROR",
                message="user not found",
                status="ERROR",
                errorMessage="user not found in Database",
                **audit_base,
            )
            return {"error": "user not found", "statusCode": 404}
        log_audit(
            "INFO",
            message="user info fetched successfully",
            status="SUCCESS",
            **audit_base,
        )
        return build_json(user_info)
    except ValueError as e:
        log_audit(
            "ERROR",
            message=str(e),
            status="ERROR",
            errorMessage="user_id is required in the request",
            **audit_base,
        )
        return {"error": str(e), "statusCode": 400}
    except PermissionError as e:
        log_audit(
            "ERROR",
            message=str(e),
            status="ERROR",
            errorMessage="caller_id is required in the request",
            **audit_base,
        )
        return {"error": str(e), "statusCode": 401}
    except Exception as e:
        log_audit(
            "ERROR",
            message="unhandled error getting user info",
            status="ERROR",
            errorMessage=f"unhandled error {e}",
            **audit_base,
        )
        return {"error": str(e), "statusCode": 500}