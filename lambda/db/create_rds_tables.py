import json
import os
import boto3
import psycopg2
from utils.logger import logger, log_audit

def get_secret():
    secret_arn = os.getenv("DB_SECRET_ARN")
    if not secret_arn:
        raise RuntimeError("DB_SECRET_ARN environment variable is not set")
    region = os.getenv("AWS_REGION", "il-central-1")
    sm = boto3.client("secretsmanager", region_name=region)

    r = sm.get_secret_value(SecretId=secret_arn)
    secret_value = json.loads(r["SecretString"])
    return secret_value

def create_tables():
    logger.info("Fetching secret...")
    secret = get_secret()
    logger.info("Connecting to DB...")
    conn = psycopg2.connect(
        host=secret["host"],
        port=int(secret.get("port", 5432)),
        dbname=secret["dbname"],
        user=secret["username"],
        password=secret["password"],
        connect_timeout=30,
    )
    logger.info("Connected. Creating tables...")
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    phone TEXT UNIQUE,
                    role TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BANNED', 'DISABLED')),
                    created_at TIMESTAMPTZ NOT NULL,
                    updated_at TIMESTAMPTZ
                );
            """)
        conn.commit()
    finally:
        conn.close()
def handler(event, context):
    logger.info(f"Handler called with event: {event}")
    try:
        log_audit(
            "INFO",
            message="tables created or already exist",
            userId=event.get("user_id"),
            service=context.function_name,
            event="CREATE_RDS_TABLES",
            status="SUCCESS",
            requestId=context.aws_request_id,
            trigger=event.get("trigger"),
        )
        create_tables()
        return {"message": "Tables created or already exist"}
    except Exception as e:
        log_audit(
            "ERROR",
            message="error creating tables",
            userId=event.get("user_id"),
            service=context.function_name,
            event="CREATE_RDS_TABLES",
            status="ERROR",
            errorMessage=str(e),
            requestId=context.aws_request_id,
            trigger=event.get("trigger"),
        )
        raise Exception(f"Error creating tables: {e}")
