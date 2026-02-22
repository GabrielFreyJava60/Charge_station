"""
Session Service Lambda — invoked by the backend for session operations.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

SESSIONS_TABLE = os.environ.get("SESSIONS_TABLE", "Sessions")
STATIONS_TABLE = os.environ.get("STATIONS_TABLE", "Stations")
REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
sessions_table = dynamodb.Table(SESSIONS_TABLE)
stations_table = dynamodb.Table(STATIONS_TABLE)


def lambda_handler(event, context):
    action = event.get("action")
    handlers = {
        "start": handle_start,
        "stop": handle_stop,
        "get": handle_get,
        "get_active": handle_get_active,
        "history": handle_history,
        "list_all": handle_list_all,
    }

    handler = handlers.get(action)
    if not handler:
        return _response(400, {"error": f"Unknown action: {action}"})

    try:
        return handler(event)
    except Exception as e:
        print(f"Error in session_service/{action}: {e}")
        return _response(500, {"error": str(e)})


def handle_start(event):
    user_id = event["userId"]
    station_id = event["stationId"]
    port_id = event["portId"]
    battery_capacity = event.get("batteryCapacityKwh", 60)

    station_resp = stations_table.get_item(
        Key={"PK": f"STATION#{station_id}", "SK": "METADATA"}
    )
    station = station_resp.get("Item")
    if not station or station["status"] != "ACTIVE":
        return _response(400, {"error": "Station is not active"})

    port_resp = stations_table.get_item(
        Key={"PK": f"STATION#{station_id}", "SK": f"PORT#{port_id}"}
    )
    port = port_resp.get("Item")
    if not port or port["status"] != "FREE":
        return _response(409, {"error": f"Port {port_id} is not free"})

    active_resp = sessions_table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
    )
    has_active = any(
        s["status"] in ("STARTED", "IN_PROGRESS")
        for s in active_resp.get("Items", [])
    )
    if has_active:
        return _response(409, {"error": "User already has an active session"})

    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    session_item = {
        "PK": f"SESSION#{session_id}",
        "SK": "METADATA",
        "sessionId": session_id,
        "userId": user_id,
        "stationId": station_id,
        "portId": port_id,
        "status": "STARTED",
        "chargePercent": Decimal("0"),
        "energyConsumedKwh": Decimal("0"),
        "totalCost": Decimal("0"),
        "tariffPerKwh": station["tariffPerKwh"],
        "batteryCapacityKwh": Decimal(str(battery_capacity)),
        "createdAt": now,
        "updatedAt": now,
    }
    sessions_table.put_item(Item=session_item)

    stations_table.update_item(
        Key={"PK": f"STATION#{station_id}", "SK": f"PORT#{port_id}"},
        UpdateExpression="SET #status = :status, updatedAt = :now",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": "CHARGING", ":now": now},
    )

    return _response(201, {"session": _format_session(session_item)})


def handle_stop(event):
    session_id = event["sessionId"]
    user_id = event.get("userId")
    force = event.get("force", False)

    resp = sessions_table.get_item(
        Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"}
    )
    session = resp.get("Item")
    if not session:
        return _response(404, {"error": "Session not found"})

    if not force and session["userId"] != user_id:
        return _response(403, {"error": "Cannot stop another user's session"})

    if session["status"] not in ("STARTED", "IN_PROGRESS"):
        return _response(400, {"error": f"Session is {session['status']}"})

    now = datetime.now(timezone.utc).isoformat()
    sessions_table.update_item(
        Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"},
        UpdateExpression="SET #status = :status, updatedAt = :now, completedAt = :now",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": "INTERRUPTED", ":now": now},
    )

    stations_table.update_item(
        Key={
            "PK": f"STATION#{session['stationId']}",
            "SK": f"PORT#{session['portId']}",
        },
        UpdateExpression="SET #status = :status, updatedAt = :now",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": "FREE", ":now": now},
    )

    session["status"] = "INTERRUPTED"
    session["completedAt"] = now
    return _response(200, {"session": _format_session(session)})


def handle_get(event):
    session_id = event["sessionId"]
    resp = sessions_table.get_item(
        Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"}
    )
    item = resp.get("Item")
    if not item:
        return _response(404, {"error": "Session not found"})
    return _response(200, {"session": _format_session(item)})


def handle_get_active(event):
    user_id = event["userId"]
    resp = sessions_table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
        ScanIndexForward=False,
    )
    active = next(
        (s for s in resp.get("Items", []) if s["status"] in ("STARTED", "IN_PROGRESS")),
        None,
    )
    return _response(200, {"session": _format_session(active) if active else None})


def handle_history(event):
    user_id = event["userId"]
    resp = sessions_table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
        ScanIndexForward=False,
    )
    sessions = [_format_session(s) for s in resp.get("Items", [])]
    return _response(200, {"sessions": sessions})


def handle_list_all(event):
    status_filter = event.get("status")
    if status_filter:
        resp = sessions_table.query(
            IndexName="status-index",
            KeyConditionExpression=Key("status").eq(status_filter),
            ScanIndexForward=False,
        )
    else:
        resp = sessions_table.scan(
            FilterExpression="SK = :sk",
            ExpressionAttributeValues={":sk": "METADATA"},
        )
    sessions = [_format_session(s) for s in resp.get("Items", [])]
    return _response(200, {"sessions": sessions})


def _format_session(item):
    return {
        "sessionId": item["sessionId"],
        "userId": item["userId"],
        "stationId": item["stationId"],
        "portId": item["portId"],
        "status": item["status"],
        "chargePercent": float(item.get("chargePercent", 0)),
        "energyConsumedKwh": float(item.get("energyConsumedKwh", 0)),
        "totalCost": float(item.get("totalCost", 0)),
        "tariffPerKwh": float(item.get("tariffPerKwh", 0)),
        "batteryCapacityKwh": float(item.get("batteryCapacityKwh", 60)),
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
        "completedAt": item.get("completedAt"),
    }


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
