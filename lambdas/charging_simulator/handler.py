"""
Charging Simulator Lambda — triggered by EventBridge every minute.
Simulates charging ticks for all active sessions using a nonlinear charging curve.
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
ERROR_LOGS_TABLE = os.environ.get("ERROR_LOGS_TABLE", "ErrorLogs")
REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")

TICK_INTERVAL_SECONDS = 10
TICKS_PER_INVOCATION = 6

dynamodb = boto3.resource("dynamodb", region_name=REGION)
sessions_table = dynamodb.Table(SESSIONS_TABLE)
stations_table = dynamodb.Table(STATIONS_TABLE)
error_logs_table = dynamodb.Table(ERROR_LOGS_TABLE)


def lambda_handler(event, context):
    """Main entry point for EventBridge scheduled invocation."""
    print(f"Charging Simulator invoked at {datetime.now(timezone.utc).isoformat()}")

    try:
        active_sessions = _get_active_sessions()
        print(f"Found {len(active_sessions)} active sessions")

        if not active_sessions:
            return {"statusCode": 200, "body": "No active sessions"}

        station_cache = {}
        results = {"updated": 0, "completed": 0, "errors": 0, "notifications": []}

        for session in active_sessions:
            try:
                station_id = session["stationId"]
                if station_id not in station_cache:
                    station_cache[station_id] = _get_station_data(station_id)

                station = station_cache[station_id]
                if not station:
                    continue

                active_ports_count = _count_active_ports_on_station(
                    station_id, active_sessions
                )

                for _ in range(TICKS_PER_INVOCATION):
                    session, notifications = _simulate_tick(
                        session, station, active_ports_count
                    )
                    results["notifications"].extend(notifications)

                    if session["status"] in ("COMPLETED", "FAILED"):
                        break

                _save_session(session)
                if session["status"] == "COMPLETED":
                    results["completed"] += 1
                    _free_port(session["stationId"], session["portId"])
                else:
                    results["updated"] += 1

            except Exception as e:
                results["errors"] += 1
                _log_error("charging_simulator", "ERROR", str(e), session.get("sessionId"))
                print(f"Error processing session {session.get('sessionId')}: {e}")

        for notif in results["notifications"]:
            _log_notification(notif)

        print(f"Simulator results: {json.dumps(results, default=str)}")
        return {"statusCode": 200, "body": json.dumps(results, default=str)}

    except Exception as e:
        _log_error("charging_simulator", "CRITICAL", f"Simulator failure: {e}")
        print(f"CRITICAL: Simulator failure: {e}")
        raise


def calculate_power_factor(charge_percent):
    """Nonlinear charging curve: full power up to 70%, then tapering."""
    if charge_percent < 70:
        return 1.0
    elif charge_percent < 90:
        return 0.6
    else:
        return 0.3


def _simulate_tick(session, station, active_ports_count):
    """Simulate one 10-second charging tick."""
    notifications = []
    charge_percent = float(session.get("chargePercent", 0))
    energy_consumed = float(session.get("energyConsumedKwh", 0))
    total_cost = float(session.get("totalCost", 0))
    tariff = float(session.get("tariffPerKwh", 0))
    battery_capacity = float(session.get("batteryCapacityKwh", 60))
    station_power = float(station.get("powerKw", 150))

    old_percent = charge_percent

    if session["status"] == "STARTED":
        session["status"] = "IN_PROGRESS"
        notifications.append({
            "type": "CHARGING_STARTED",
            "sessionId": session["sessionId"],
            "userId": session["userId"],
        })

    interval_hours = TICK_INTERVAL_SECONDS / 3600
    power_per_port = station_power / max(active_ports_count, 1)
    power_factor = calculate_power_factor(charge_percent)
    effective_power = power_per_port * power_factor

    energy_added = effective_power * interval_hours
    new_percent = min(100.0, charge_percent + (energy_added / battery_capacity) * 100)
    new_cost = total_cost + energy_added * tariff

    session["chargePercent"] = Decimal(str(round(new_percent, 2)))
    session["energyConsumedKwh"] = Decimal(str(round(energy_consumed + energy_added, 4)))
    session["totalCost"] = Decimal(str(round(new_cost, 2)))
    session["updatedAt"] = datetime.now(timezone.utc).isoformat()

    if old_percent < 80 and new_percent >= 80:
        notifications.append({
            "type": "CHARGE_80_PERCENT",
            "sessionId": session["sessionId"],
            "userId": session["userId"],
            "chargePercent": round(new_percent, 2),
        })

    if new_percent >= 100:
        session["status"] = "COMPLETED"
        session["chargePercent"] = Decimal("100")
        session["completedAt"] = datetime.now(timezone.utc).isoformat()
        notifications.append({
            "type": "CHARGING_COMPLETED",
            "sessionId": session["sessionId"],
            "userId": session["userId"],
            "totalCost": round(new_cost, 2),
            "energyConsumedKwh": round(energy_consumed + energy_added, 4),
        })

    return session, notifications


def _get_active_sessions():
    """Fetch all sessions with STARTED or IN_PROGRESS status."""
    results = []
    for status in ("STARTED", "IN_PROGRESS"):
        resp = sessions_table.query(
            IndexName="status-index",
            KeyConditionExpression=Key("status").eq(status),
        )
        results.extend(resp.get("Items", []))
    return results


def _get_station_data(station_id):
    """Fetch station metadata."""
    resp = stations_table.get_item(
        Key={"PK": f"STATION#{station_id}", "SK": "METADATA"}
    )
    return resp.get("Item")


def _count_active_ports_on_station(station_id, all_active_sessions):
    """Count how many active sessions are on a given station."""
    return sum(1 for s in all_active_sessions if s["stationId"] == station_id)


def _save_session(session):
    """Persist updated session back to DynamoDB."""
    sessions_table.put_item(Item=session)


def _free_port(station_id, port_id):
    """Set port status back to FREE after session completes."""
    stations_table.update_item(
        Key={"PK": f"STATION#{station_id}", "SK": f"PORT#{port_id}"},
        UpdateExpression="SET #status = :status, updatedAt = :now",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": "FREE",
            ":now": datetime.now(timezone.utc).isoformat(),
        },
    )


def _log_notification(notification):
    """Log notification to ErrorLogs table (mock SNS)."""
    error_logs_table.put_item(
        Item={
            "PK": f"NOTIFICATION#{uuid.uuid4()}",
            "SK": datetime.now(timezone.utc).isoformat(),
            "errorId": str(uuid.uuid4()),
            "service": "notification_service",
            "level": "INFO",
            "logStatus": "NEW",
            "message": f"[{notification['type']}] Session {notification['sessionId']}",
            "details": json.dumps(notification, default=str),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


def _log_error(service, level, message, session_id=None):
    """Log an error to the ErrorLogs table."""
    details = json.dumps({"sessionId": session_id}) if session_id else None
    error_logs_table.put_item(
        Item={
            "PK": f"ERROR#{uuid.uuid4()}",
            "SK": datetime.now(timezone.utc).isoformat(),
            "errorId": str(uuid.uuid4()),
            "service": service,
            "level": level,
            "logStatus": "NEW",
            "message": message,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
