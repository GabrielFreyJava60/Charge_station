import os
import boto3
import psycopg2
from utils.logger import logger
from datetime import datetime
from data_types.db_instance_types import UserInstance
from utils.logger import log_audit
from utils.error_handlers import LambdaResponseError
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
    try:
        logger.info(f"Extracting user instance")
        attrs = event['request']['userAttributes']
        email = attrs['email']
        status = attrs['cognito:user_status']
        full_name = attrs['name']
        if full_name.startswith("cognito:"):
            full_name = "Console User"
        user_instance: UserInstance = {
            'user_id': attrs['sub'],
            'full_name': full_name,
            'email': email,
            'phone': attrs.get('phone_number'),
            'role': "USER",
            'status': "ACTIVE" if status == "CONFIRMED" else None,
            'created_at': datetime.now(),
            'updated_at': None,
            }
        return user_instance
    except KeyError as e:
        logger.error(f"Missing key: {e}")
        raise LambdaResponseError({"error": f"Missing key: {e}", "statusCode": 400})
    except TypeError as e:
        logger.error(f"Event type error: {e}")
        raise LambdaResponseError({"error": f"Event type error: {e}", "statusCode": 400})
    except Exception as e:
        logger.error(f"Unhandled error: {e}")
        raise LambdaResponseError({"error": f"Unhandled error: {e}", "statusCode": 500})


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
        raise LambdaResponseError({"error": f"Error adding user to group: {e}", "statusCode": 500})

def validate_user_instance(event: dict) -> UserInstance:
    try:
        user_instance: UserInstance = extract_user_instance_from_event(event)
        logger.info(f"User instance: {user_instance}")
        if is_admin_console_created(event):
            user_instance["role"] = "ADMIN"
        return user_instance
    except LambdaResponseError:
        raise
    except Exception as e:
        logger.error(f"Unhandled error validating user instance: {e}")
        raise LambdaResponseError({"error": f"Unhandled error validating user instance: {e}", "statusCode": 500})

def insert_user(user: UserInstance) -> None:
    try:
        conn = get_connection()
    except Exception as e:
        logger.error(f"Error getting connection: {e}")
        raise LambdaResponseError({"error": f"Error getting connection: {e}", "statusCode": 500})
    status = user.get("status") or "ACTIVE"
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (user_id, full_name, email, phone, role, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
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
    except psycopg2.IntegrityError as e:
        conn.rollback()
        if e.pgcode == "23505":  # unique_violation
            logger.error(f"User already exists: {e}")
            raise LambdaResponseError({"error": "User already exists", "statusCode": 409})
        logger.error(f"Constraint violation inserting user: {e}")
        raise LambdaResponseError({"error": str(e), "statusCode": 400})
    except psycopg2.DatabaseError as e:
        conn.rollback()
        logger.error(f"Database error inserting user: {e}")
        raise LambdaResponseError({"error": str(e), "statusCode": 500})

def write_user_to_rds(user_instance: UserInstance) -> None:
    insert_user(user_instance)
    logger.info("User written to RDS")

def handler(event: dict, context: Any) -> dict:
    logger.info(f"Handler called with event: {event}")
    audit_base = {
        "userId": event.get("user_id"),
        "service": context.function_name,
        "event": "WRITE_USER_TO_RDS",
        "requestId": context.aws_request_id,
        "trigger": event.get("triggerSource"),
    }
    try:
        user_instance = validate_user_instance(event)
        write_user_to_rds(user_instance)
        if is_admin_console_created(event):
            add_user_to_group(event["userPoolId"], user_instance["email"], "ADMIN")
        log_audit("INFO", message="user written to RDS successfully", status="SUCCESS", **audit_base)
    except LambdaResponseError as e:
        log_audit("ERROR", message="error writing user to RDS", status="ERROR", errorMessage=e.response.get("error", str(e)), **audit_base)
        return e.response
    except Exception as e:
        log_audit("ERROR", message="error writing user to RDS", status="ERROR", errorMessage=str(e), **audit_base)
        return {"error": f"Unhandled error: {e}", "statusCode": 500}
    return event