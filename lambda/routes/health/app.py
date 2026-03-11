import json
from utils.logger import logger, log_audit

def handler(event, context):
    logger.info(f"Health function called, Event: {event}")
    log_audit(
        "INFO",
        message="health function called",
        userId=event.get("user_id"),
        service=context.function_name,
        event="HEALTH",
        status="SUCCESS",
        requestId=context.aws_request_id,
    )
    return {"code": 200, "status": "running"}