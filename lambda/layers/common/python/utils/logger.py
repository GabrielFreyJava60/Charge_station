import logging
import os
import json

logger = logging.getLogger("app")
logger.setLevel(os.getenv("LOGGER_LEVEL", "INFO").upper())

def log_audit(level: str, message: str, **fields):
    record = {
        "message": message,
        "level": level,
        **fields,
    }
    logger.info(json.dumps(record, default=str))