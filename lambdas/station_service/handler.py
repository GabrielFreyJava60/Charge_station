"""
Station Service Lambda — invoked by the backend for station CRUD operations.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

STATIONS_TABLE = os.environ.get("STATIONS_TABLE", "Stations")
REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
stations_table = dynamodb.Table(STATIONS_TABLE)

STATION_TRANSITIONS = {
    "NEW": ["ACTIVE"],
    "ACTIVE": ["MAINTENANCE", "OUT_OF_ORDER"],
    "MAINTENANCE": ["ACTIVE"],
    "OUT_OF_ORDER": ["ACTIVE"],
}


def lambda_handler(event, context):
    """Route requests based on the 'action' field."""
    action = event.get("action")
    handlers = {
        "list": handle_list,
        "get": handle_get,
        "create": handle_create,
        "update_status": handle_update_status,
        "update_tariff": handle_update_tariff,
    }

    handler = handlers.get(action)
    if not handler:
        return _response(400, {"error": f"Unknown action: {action}"})

    try:
        return handler(event)
    except Exception as e:
        print(f"Error in station_service/{action}: {e}")
        return _response(500, {"error": str(e)})


def handle_list(event):
    resp = stations_table.scan(
        FilterExpression="SK = :sk",
        ExpressionAttributeValues={":sk": "METADATA"},
    )
    stations = [_format_station(item) for item in resp.get("Items", [])]
    return _response(200, {"stations": stations})


def handle_get(event):
    station_id = event.get("stationId")
    resp = stations_table.query(
        KeyConditionExpression=Key("PK").eq(f"STATION#{station_id}")
    )
    items = resp.get("Items", [])
    if not items:
        return _response(404, {"error": f"Station {station_id} not found"})

    metadata = next((i for i in items if i["SK"] == "METADATA"), None)
    ports = [_format_port(i) for i in items if i["SK"].startswith("PORT#")]
    station = _format_station(metadata)
    station["ports"] = ports
    return _response(200, {"station": station})


def handle_create(event):
    data = event.get("data", {})
    station_id = f"station-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    station_item = {
        "PK": f"STATION#{station_id}",
        "SK": "METADATA",
        "stationId": station_id,
        "name": data["name"],
        "address": data["address"],
        "latitude": Decimal(str(data["latitude"])),
        "longitude": Decimal(str(data["longitude"])),
        "totalPorts": data["totalPorts"],
        "powerKw": Decimal(str(data["powerKw"])),
        "tariffPerKwh": Decimal(str(data["tariffPerKwh"])),
        "status": "NEW",
        "createdAt": now,
        "updatedAt": now,
    }
    stations_table.put_item(Item=station_item)

    for i in range(1, data["totalPorts"] + 1):
        port_id = f"port-{station_id}-{str(i).zfill(3)}"
        stations_table.put_item(Item={
            "PK": f"STATION#{station_id}",
            "SK": f"PORT#{port_id}",
            "portId": port_id,
            "stationId": station_id,
            "portNumber": i,
            "status": "FREE",
            "updatedAt": now,
        })

    return _response(201, {"station": _format_station(station_item)})


def handle_update_status(event):
    station_id = event.get("stationId")
    new_status = event.get("status")

    resp = stations_table.get_item(
        Key={"PK": f"STATION#{station_id}", "SK": "METADATA"}
    )
    item = resp.get("Item")
    if not item:
        return _response(404, {"error": f"Station {station_id} not found"})

    current = item["status"]
    allowed = STATION_TRANSITIONS.get(current, [])
    if new_status not in allowed:
        return _response(400, {
            "error": f"Cannot transition from {current} to {new_status}. Allowed: {allowed}"
        })

    stations_table.update_item(
        Key={"PK": f"STATION#{station_id}", "SK": "METADATA"},
        UpdateExpression="SET #status = :status, updatedAt = :now",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": new_status,
            ":now": datetime.now(timezone.utc).isoformat(),
        },
    )
    item["status"] = new_status
    return _response(200, {"station": _format_station(item)})


def handle_update_tariff(event):
    station_id = event.get("stationId")
    tariff = event.get("tariffPerKwh")

    stations_table.update_item(
        Key={"PK": f"STATION#{station_id}", "SK": "METADATA"},
        UpdateExpression="SET tariffPerKwh = :tariff, updatedAt = :now",
        ExpressionAttributeValues={
            ":tariff": Decimal(str(tariff)),
            ":now": datetime.now(timezone.utc).isoformat(),
        },
    )
    return _response(200, {"message": "Tariff updated"})


def _format_station(item):
    return {
        "stationId": item["stationId"],
        "name": item["name"],
        "address": item["address"],
        "latitude": float(item["latitude"]),
        "longitude": float(item["longitude"]),
        "totalPorts": int(item["totalPorts"]),
        "powerKw": float(item["powerKw"]),
        "tariffPerKwh": float(item["tariffPerKwh"]),
        "status": item["status"],
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
    }


def _format_port(item):
    return {
        "portId": item["portId"],
        "stationId": item["stationId"],
        "portNumber": int(item["portNumber"]),
        "status": item["status"],
    }


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
