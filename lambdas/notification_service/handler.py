"""
Notification Service Lambda — handles sending notifications to users.
In production, this integrates with AWS SNS for SMS.
In development, notifications are logged to DynamoDB ErrorLogs table.
"""

import os
import json
import uuid
from datetime import datetime, timezone

import boto3

ERROR_LOGS_TABLE = os.environ.get("ERROR_LOGS_TABLE", "ErrorLogs")
REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
SNS_ENABLED = os.environ.get("SNS_ENABLED", "false").lower() == "true"
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
error_logs_table = dynamodb.Table(ERROR_LOGS_TABLE)

NOTIFICATION_TEMPLATES = {
    "CHARGING_STARTED": "Your EV charging session {sessionId} has started.",
    "CHARGE_80_PERCENT": "Your EV is at {chargePercent}% charge. Consider stopping soon to save time.",
    "CHARGING_COMPLETED": "Charging complete! Total energy: {energyConsumedKwh} kWh, Cost: ${totalCost}",
    "EMERGENCY_STOP": "ALERT: Your charging session {sessionId} was stopped due to an error.",
    "SESSION_INTERRUPTED": "Your charging session {sessionId} was manually stopped.",
}


def lambda_handler(event, context):
    """Handle notification requests."""
    action = event.get("action", "send")

    if action == "send":
        return handle_send(event)
    elif action == "batch_send":
        return handle_batch_send(event)
    else:
        return _response(400, {"error": f"Unknown action: {action}"})


def handle_send(event):
    """Send a single notification."""
    notification = event.get("notification", {})
    notif_type = notification.get("type", "UNKNOWN")
    user_id = notification.get("userId", "unknown")
    session_id = notification.get("sessionId", "unknown")

    template = NOTIFICATION_TEMPLATES.get(notif_type, "Notification: {type}")
    message = template.format(**{**notification, "type": notif_type})

    if SNS_ENABLED and SNS_TOPIC_ARN:
        _send_sns(user_id, message)
    else:
        _log_notification(notif_type, user_id, session_id, message, notification)

    print(f"Notification sent: [{notif_type}] to user {user_id}")
    return _response(200, {"message": "Notification sent", "type": notif_type})


def handle_batch_send(event):
    """Send multiple notifications."""
    notifications = event.get("notifications", [])
    results = []
    for notif in notifications:
        result = handle_send({"notification": notif})
        results.append(result)
    return _response(200, {"sent": len(results)})


def _send_sns(user_id, message):
    """Send a real SMS via SNS (production only)."""
    sns = boto3.client("sns", region_name=REGION)
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Message=message,
        Subject="EV Charging Notification",
        MessageAttributes={
            "userId": {"DataType": "String", "StringValue": user_id},
        },
    )


def _log_notification(notif_type, user_id, session_id, message, details):
    """Log notification to DynamoDB (mock SNS for development)."""
    now = datetime.now(timezone.utc).isoformat()
    error_logs_table.put_item(
        Item={
            "PK": f"NOTIFICATION#{uuid.uuid4()}",
            "SK": now,
            "errorId": str(uuid.uuid4()),
            "service": "notification_service",
            "level": "INFO",
            "logStatus": "NEW",
            "message": f"[{notif_type}] User {user_id}: {message}",
            "details": json.dumps(
                {"type": notif_type, "userId": user_id, "sessionId": session_id, **details},
                default=str,
            ),
            "timestamp": now,
        }
    )


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
