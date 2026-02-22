"""
Domain models and state machine definitions for the EV Charging Station system.
"""

from enum import Enum
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional


class StationStatus(str, Enum):
    NEW = "NEW"
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    OUT_OF_ORDER = "OUT_OF_ORDER"


class PortStatus(str, Enum):
    FREE = "FREE"
    RESERVED = "RESERVED"
    CHARGING = "CHARGING"
    ERROR = "ERROR"


class SessionStatus(str, Enum):
    STARTED = "STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    INTERRUPTED = "INTERRUPTED"
    FAILED = "FAILED"


class ErrorLogStatus(str, Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class UserRole(str, Enum):
    USER = "USER"
    TECH_SUPPORT = "TECH_SUPPORT"
    ADMIN = "ADMIN"


STATION_TRANSITIONS = {
    StationStatus.NEW: [StationStatus.ACTIVE],
    StationStatus.ACTIVE: [StationStatus.MAINTENANCE, StationStatus.OUT_OF_ORDER],
    StationStatus.MAINTENANCE: [StationStatus.ACTIVE],
    StationStatus.OUT_OF_ORDER: [StationStatus.ACTIVE],
}

PORT_TRANSITIONS = {
    PortStatus.FREE: [PortStatus.CHARGING, PortStatus.RESERVED],
    PortStatus.RESERVED: [PortStatus.CHARGING, PortStatus.FREE],
    PortStatus.CHARGING: [PortStatus.FREE, PortStatus.ERROR],
    PortStatus.ERROR: [PortStatus.FREE],
}

SESSION_TRANSITIONS = {
    SessionStatus.STARTED: [SessionStatus.IN_PROGRESS, SessionStatus.FAILED],
    SessionStatus.IN_PROGRESS: [
        SessionStatus.IN_PROGRESS,
        SessionStatus.COMPLETED,
        SessionStatus.INTERRUPTED,
        SessionStatus.FAILED,
    ],
    SessionStatus.COMPLETED: [],
    SessionStatus.INTERRUPTED: [],
    SessionStatus.FAILED: [],
}

ERROR_LOG_TRANSITIONS = {
    ErrorLogStatus.NEW: [ErrorLogStatus.IN_PROGRESS, ErrorLogStatus.RESOLVED],
    ErrorLogStatus.IN_PROGRESS: [ErrorLogStatus.RESOLVED],
    ErrorLogStatus.RESOLVED: [],
}


def validate_transition(current_status, new_status, transitions_map):
    """Validate that a state transition is allowed. Returns True if valid."""
    allowed = transitions_map.get(current_status, [])
    if new_status not in allowed:
        raise InvalidTransitionError(
            f"Transition from {current_status.value} to {new_status.value} is not allowed. "
            f"Allowed: {[s.value for s in allowed]}"
        )
    return True


class InvalidTransitionError(Exception):
    pass


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Station:
    station_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    total_ports: int
    power_kw: float
    tariff_per_kwh: float
    status: str = StationStatus.NEW.value
    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)

    def to_dynamo_item(self):
        return {
            "PK": f"STATION#{self.station_id}",
            "SK": "METADATA",
            "stationId": self.station_id,
            "name": self.name,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "totalPorts": self.total_ports,
            "powerKw": self.power_kw,
            "tariffPerKwh": self.tariff_per_kwh,
            "status": self.status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_dynamo_item(cls, item):
        return cls(
            station_id=item["stationId"],
            name=item["name"],
            address=item["address"],
            latitude=float(item["latitude"]),
            longitude=float(item["longitude"]),
            total_ports=int(item["totalPorts"]),
            power_kw=float(item["powerKw"]),
            tariff_per_kwh=float(item["tariffPerKwh"]),
            status=item["status"],
            created_at=item.get("createdAt", ""),
            updated_at=item.get("updatedAt", ""),
        )

    def to_api_dict(self):
        return asdict(self)


@dataclass
class ChargingPort:
    port_id: str
    station_id: str
    port_number: int
    status: str = PortStatus.FREE.value
    updated_at: str = field(default_factory=_now_iso)

    def to_dynamo_item(self):
        return {
            "PK": f"STATION#{self.station_id}",
            "SK": f"PORT#{self.port_id}",
            "portId": self.port_id,
            "stationId": self.station_id,
            "portNumber": self.port_number,
            "status": self.status,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_dynamo_item(cls, item):
        return cls(
            port_id=item["portId"],
            station_id=item["stationId"],
            port_number=int(item["portNumber"]),
            status=item["status"],
            updated_at=item.get("updatedAt", ""),
        )

    def to_api_dict(self):
        return asdict(self)


@dataclass
class ChargingSession:
    session_id: str
    user_id: str
    station_id: str
    port_id: str
    status: str = SessionStatus.STARTED.value
    charge_percent: float = 0.0
    energy_consumed_kwh: float = 0.0
    total_cost: float = 0.0
    tariff_per_kwh: float = 0.0
    battery_capacity_kwh: float = 60.0
    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)
    completed_at: Optional[str] = None

    def to_dynamo_item(self):
        item = {
            "PK": f"SESSION#{self.session_id}",
            "SK": "METADATA",
            "sessionId": self.session_id,
            "userId": self.user_id,
            "stationId": self.station_id,
            "portId": self.port_id,
            "status": self.status,
            "chargePercent": self.charge_percent,
            "energyConsumedKwh": self.energy_consumed_kwh,
            "totalCost": self.total_cost,
            "tariffPerKwh": self.tariff_per_kwh,
            "batteryCapacityKwh": self.battery_capacity_kwh,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.completed_at:
            item["completedAt"] = self.completed_at
        return item

    @classmethod
    def from_dynamo_item(cls, item):
        return cls(
            session_id=item["sessionId"],
            user_id=item["userId"],
            station_id=item["stationId"],
            port_id=item["portId"],
            status=item["status"],
            charge_percent=float(item.get("chargePercent", 0)),
            energy_consumed_kwh=float(item.get("energyConsumedKwh", 0)),
            total_cost=float(item.get("totalCost", 0)),
            tariff_per_kwh=float(item.get("tariffPerKwh", 0)),
            battery_capacity_kwh=float(item.get("batteryCapacityKwh", 60)),
            created_at=item.get("createdAt", ""),
            updated_at=item.get("updatedAt", ""),
            completed_at=item.get("completedAt"),
        )

    def to_api_dict(self):
        d = asdict(self)
        d["charge_percent"] = round(d["charge_percent"], 2)
        d["energy_consumed_kwh"] = round(d["energy_consumed_kwh"], 4)
        d["total_cost"] = round(d["total_cost"], 2)
        return d


@dataclass
class ErrorLog:
    error_id: str
    service: str
    level: str
    message: str
    log_status: str = ErrorLogStatus.NEW.value
    details: Optional[str] = None
    timestamp: str = field(default_factory=_now_iso)

    def to_dynamo_item(self):
        item = {
            "PK": f"ERROR#{self.error_id}",
            "SK": self.timestamp,
            "errorId": self.error_id,
            "service": self.service,
            "level": self.level,
            "message": self.message,
            "logStatus": self.log_status,
            "timestamp": self.timestamp,
        }
        if self.details:
            item["details"] = self.details
        return item

    @classmethod
    def from_dynamo_item(cls, item):
        return cls(
            error_id=item["errorId"],
            service=item["service"],
            level=item["level"],
            message=item["message"],
            log_status=item.get("logStatus", ErrorLogStatus.NEW.value),
            details=item.get("details"),
            timestamp=item.get("timestamp", ""),
        )

    def to_api_dict(self):
        return asdict(self)
