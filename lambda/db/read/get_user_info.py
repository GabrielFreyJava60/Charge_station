import os
import json
import boto3
import psycopg2
from utils.logger import logger, log_audit

_conn = None

def get_db_config():
    return {
        "host": os.environ["DB_HOST"],
        "port": int(os.environ.get("DB_PORT", "5432")),
        "dbname": os.environ["DB_NAME"],
        "user": os.environ["DB_USER"],
        "region": os.environ.get("AWS_REGION", "il-central-1"),
    }
def get_connection():
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

def extract_user_id_from_event(event):
    logger.info(f"Extracting user id")
    user_id = event.get("user_id")
    if not user_id:
        raise ValueError("user_id is required")
    return user_id

def get_user_info(user_id):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        return cur.fetchone()

def build_json(user_info):
    return {
                "userId": user_info[0],
                "username": user_info[1],
                "email": user_info[2],
                "phone": user_info[3],
                "role": user_info[4],
                "status": user_info[5],
                "createdAt": user_info[6].isoformat() if user_info[6] else None,
                "updatedAt": user_info[7].isoformat() if user_info[7] else None,
            }

def handler(event, context):
    logger.info(f"Handler called with event: {event}")
    try:
        user_id = extract_user_id_from_event(event)
        user_info = get_user_info(user_id)
        log_audit(
            "INFO",
            message="user info fetched successfully",
            userId=event.get("user_id"),
            service=context.function_name,
            event="FETCH_USER_INFO",
            status="SUCCESS",
            requestId=context.aws_request_id,
        )
        return build_json(user_info)
    except Exception as e:
        log_audit(
            "ERROR",
            message="error getting user info",
            userId=event.get("user_id"),
            service=context.function_name,
            event="FETCH_USER_INFO",
            status="ERROR",
            errorMessage=str(e),
            requestId=context.aws_request_id,
        )
        raise Exception(f"Error getting user info: {e}")