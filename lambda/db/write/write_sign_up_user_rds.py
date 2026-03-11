import os
import json
import boto3
import psycopg2
from utils.logger import logger
from datetime import datetime
from data_types.db_instance_types import UserInstance



_conn = None

def get_secret():
    arn = os.environ.get("DB_SECRET_ARN")
    if not arn:
        raise ValueError("DB_SECRET_ARN not set")
    sm = boto3.client("secretsmanager")
    r = sm.get_secret_value(SecretId=arn)
    return json.loads(r["SecretString"])

def get_connection():
    global _conn
    if _conn is None or _conn.closed:
        secret = get_secret()
        _conn = psycopg2.connect(
            host=secret["host"],
            port=int(secret.get("port", 5432)),
            dbname=secret["dbname"],
            user=secret["username"],
            password=secret["password"],
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
    except Exception as e:
        logger.error(f"Error writing user to RDS: {e}", exc_info=True)
    return event