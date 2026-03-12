import os
import json
import boto3
import psycopg2
from utils.logger import logger
from datetime import datetime
from data_types.db_instance_types import UserInstance
from utils.logger import log_audit


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

def extract_user_instance_from_event(event):
    logger.info(f"Extracting user instance")
    attrs = event['request']['userAttributes']
    email = attrs['email']
    status = attrs['cognito:user_status']
    user_instance: UserInstance = {
        'user_id': attrs['sub'],
        'username': event['userName'],
        'email': email,
        'phone': attrs.get('phone_number'),
        'role': attrs.get('custom:role') or "USER",
        'status': "ACTIVE" if status == "CONFIRMED" else None,
        'created_at': datetime.now().isoformat(),
    }
    return user_instance

def validate_user_instance(user):
    try:
        user_instance: UserInstance = extract_user_instance_from_event(user)
        logger.info(f"User instance: {user_instance}")
        return user_instance
    except Exception as e:
        logger.error(f"Error validating user instance: {e}")
        raise e

def insert_user(user: UserInstance):
    conn = get_connection()
    status = user.get("status") or "ACTIVE"
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (user_id, username, email, phone, role, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (
                user["user_id"],
                user["username"],
                user["email"],
                user.get("phone"),
                user["role"],
                status,
                user["created_at"],
            ),
        )
    conn.commit()

def write_user_to_rds(event):
    user_instance = validate_user_instance(event)
    insert_user(user_instance)
    logger.info("User written to RDS")

def handler(event, context):
    logger.info(f"Handler called with event: {event}")
    try:
        write_user_to_rds(event)
        log_audit(
            "INFO",
            message="user written to RDS successfully",
            userId=event.get("user_id"),
            service=context.function_name,
            event="WRITE_USER_TO_RDS",
            status="SUCCESS",
            requestId=context.aws_request_id,
            trigger=event.get("triggerSource"),
        )
    except Exception as e:
        log_audit(
            "ERROR",
            message="error writing user to RDS",
            userId=event.get("user_id"),
            service=context.function_name,
            event="WRITE_USER_TO_RDS",
            status="ERROR",
            errorMessage=str(e),
            requestId=context.aws_request_id,
            trigger=event.get("triggerSource"),
        )
        raise Exception(f"Error writing user to RDS: {e}")
    return event