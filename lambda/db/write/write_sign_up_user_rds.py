import os
import boto3
import psycopg2
from utils.logger import logger
from datetime import datetime
from data_types.db_instance_types import UserInstance
from utils.logger import log_audit
from typing import Literal, Any

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

def is_admin_console_created(event: dict) -> bool:
    res = False
    trigger_source = event.get("triggerSource", "")
    if trigger_source.startswith("PostAuthentication_"):
        res = True
    return res

def extract_user_instance_from_event(event: dict) -> UserInstance:
    logger.info(f"Extracting user instance")
    attrs = event['request']['userAttributes']
    email = attrs['email']
    status = attrs['cognito:user_status']
    user_instance: UserInstance = {
        'user_id': attrs['sub'],
        'full_name': attrs.get('name') if not attrs.get('name').startswith("cognito:") else "Console User",
        'email': email,
        'phone': attrs.get('phone_number'),
        'role': "USER",
        'status': "ACTIVE" if status == "CONFIRMED" else None,
        'created_at': datetime.now(),
        'updated_at': None,
    }
    return user_instance


def add_user_to_group(user_pool_id: str, email: str, role: Literal["USER", "ADMIN", "TECH_SUPPORT"]) -> None:
    try:
        client = boto3.client("cognito-idp")
        client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=email,
            GroupName=role,
            )
    except Exception as e:
        logger.error(f"Error adding user to group: {e}")
        raise e

def validate_user_instance(event: dict) -> UserInstance:
    try:
        user_instance: UserInstance = extract_user_instance_from_event(event)
        logger.info(f"User instance: {user_instance}")
        if is_admin_console_created(event):
            user_instance["role"] = "ADMIN"
        return user_instance
    except Exception:
        logger.exception("Error adding user to group")
        raise

def insert_user(user: UserInstance) -> None:
    conn = get_connection()
    status = user.get("status") or "ACTIVE"
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (user_id, full_name, email, phone, role, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO NOTHING
                """,
                (
                    user["user_id"],
                    user["full_name"],
                    user["email"],
                    user.get("phone"),
                    user["role"],
                    status,
                    user["created_at"],
                ),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise

def write_user_to_rds(event: dict) -> UserInstance:
    user_instance = validate_user_instance(event)
    insert_user(user_instance)
    logger.info("User written to RDS")
    return user_instance

def handler(event: dict, context: Any) -> dict:
    logger.info(f"Handler called with event: {event}")
    try:
        user_instance = write_user_to_rds(event)
        add_user_to_group(event["userPoolId"], user_instance["email"], user_instance["role"])
        log_audit(
            "INFO",
            message="user written to RDS successfully",
            userId=event.get("user_id"),
            service=context.gfunction_name,
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