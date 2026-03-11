import os
import json
import boto3
import psycopg2
from utils.logger import logger

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
        return build_json(user_info)
    except Exception as e:
        logger.error(f"Error getting user info: {e}", exc_info=True)
        return {
            "error": str(e)
        }