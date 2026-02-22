"""Structured JSON logging for Lambda functions with CloudWatch integration."""

import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone


class StructuredFormatter(logging.Formatter):
    """Format log records as JSON for CloudWatch."""

    def __init__(self, service_name):
        super().__init__()
        self.service_name = service_name

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service_name,
            "message": record.getMessage(),
            "logger": record.name,
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra_data"):
            log_entry["data"] = record.extra_data
        return json.dumps(log_entry, default=str)


def get_logger(service_name, level=None):
    """Create a structured logger for a Lambda service."""
    log_level = level or os.environ.get("LOG_LEVEL", "INFO").upper()
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, log_level, logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter(service_name))
        logger.addHandler(handler)

    return logger


def log_with_data(logger, level, message, **kwargs):
    """Log a message with extra structured data."""
    record = logger.makeRecord(
        name=logger.name,
        level=getattr(logging, level.upper()),
        fn="",
        lno=0,
        msg=message,
        args=(),
        exc_info=None,
    )
    record.extra_data = kwargs
    logger.handle(record)


def create_error_log_entry(service, level, message, details=None):
    """Create an error log dict ready for DynamoDB insertion."""
    from .models import ErrorLog
    error_log = ErrorLog(
        error_id=str(uuid.uuid4()),
        service=service,
        level=level,
        message=message,
        details=details,
    )
    return error_log
