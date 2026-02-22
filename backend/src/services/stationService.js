const { v4: uuidv4 } = require('uuid');
const { tables, getItem, putItem, updateItem, queryByPK, queryGSI, scanTable } = require('../utils/dynamodb');
const { NotFoundError, InvalidTransitionError } = require('../utils/errors');

const STATION_TRANSITIONS = {
  NEW: ['ACTIVE'],
  ACTIVE: ['MAINTENANCE', 'OUT_OF_ORDER'],
  MAINTENANCE: ['ACTIVE'],
  OUT_OF_ORDER: ['ACTIVE'],
};

const PORT_TRANSITIONS = {
  FREE: ['CHARGING', 'RESERVED'],
  RESERVED: ['CHARGING', 'FREE'],
  CHARGING: ['FREE', 'ERROR'],
  ERROR: ['FREE'],
};

async function listStations() {
  const items = await scanTable(tables.stations, 'SK = :sk', { ':sk': 'METADATA' });
  return items.map(_formatStation);
}

async function getStation(stationId) {
  const items = await queryByPK(tables.stations, `STATION#${stationId}`);
  if (items.length === 0) throw new NotFoundError('Station', stationId);

  const metadata = items.find(i => i.SK === 'METADATA');
  if (!metadata) throw new NotFoundError('Station', stationId);

  const ports = items.filter(i => i.SK.startsWith('PORT#')).map(_formatPort);
  return { ..._formatStation(metadata), ports };
}

async function getStationsByStatus(status) {
  const items = await queryGSI(tables.stations, 'status-index', 'status', status);
  return items.filter(i => i.SK === 'METADATA').map(_formatStation);
}

async function createStation({ name, address, latitude, longitude, totalPorts, powerKw, tariffPerKwh }) {
  const stationId = `station-${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  const stationItem = {
    PK: `STATION#${stationId}`,
    SK: 'METADATA',
    stationId,
    name,
    address,
    latitude,
    longitude,
    totalPorts,
    powerKw,
    tariffPerKwh,
    status: 'NEW',
    createdAt: now,
    updatedAt: now,
  };
  await putItem(tables.stations, stationItem);

  for (let i = 1; i <= totalPorts; i++) {
    const portId = `port-${stationId}-${String(i).padStart(3, '0')}`;
    await putItem(tables.stations, {
      PK: `STATION#${stationId}`,
      SK: `PORT#${portId}`,
      portId,
      stationId,
      portNumber: i,
      status: 'FREE',
      updatedAt: now,
    });
  }

  return { ..._formatStation(stationItem), ports: [] };
}

async function updateStationStatus(stationId, newStatus) {
  const station = await getItem(tables.stations, `STATION#${stationId}`, 'METADATA');
  if (!station) throw new NotFoundError('Station', stationId);

  const currentStatus = station.status;
  const allowed = STATION_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new InvalidTransitionError(
      `Cannot transition station from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`
    );
  }

  const result = await updateItem(
    tables.stations,
    `STATION#${stationId}`, 'METADATA',
    'SET #status = :status, updatedAt = :now',
    { ':status': newStatus, ':now': new Date().toISOString() },
    { '#status': 'status' },
  );
  return _formatStation(result);
}

async function updateTariff(stationId, tariffPerKwh) {
  const station = await getItem(tables.stations, `STATION#${stationId}`, 'METADATA');
  if (!station) throw new NotFoundError('Station', stationId);

  const result = await updateItem(
    tables.stations,
    `STATION#${stationId}`, 'METADATA',
    'SET tariffPerKwh = :tariff, updatedAt = :now',
    { ':tariff': tariffPerKwh, ':now': new Date().toISOString() },
  );
  return _formatStation(result);
}

async function updatePortStatus(stationId, portId, newStatus) {
  const port = await getItem(tables.stations, `STATION#${stationId}`, `PORT#${portId}`);
  if (!port) throw new NotFoundError('Port', portId);

  const currentStatus = port.status;
  const allowed = PORT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new InvalidTransitionError(
      `Cannot transition port from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`
    );
  }

  const result = await updateItem(
    tables.stations,
    `STATION#${stationId}`, `PORT#${portId}`,
    'SET #status = :status, updatedAt = :now',
    { ':status': newStatus, ':now': new Date().toISOString() },
    { '#status': 'status' },
  );
  return _formatPort(result);
}

async function getFreePorts(stationId) {
  const items = await queryByPK(tables.stations, `STATION#${stationId}`, 'PORT#');
  return items.filter(i => i.status === 'FREE').map(_formatPort);
}

function _formatStation(item) {
  return {
    stationId: item.stationId,
    name: item.name,
    address: item.address,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    totalPorts: Number(item.totalPorts),
    powerKw: Number(item.powerKw),
    tariffPerKwh: Number(item.tariffPerKwh),
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function _formatPort(item) {
  return {
    portId: item.portId,
    stationId: item.stationId,
    portNumber: Number(item.portNumber),
    status: item.status,
    updatedAt: item.updatedAt,
  };
}

module.exports = {
  listStations,
  getStation,
  getStationsByStatus,
  createStation,
  updateStationStatus,
  updateTariff,
  updatePortStatus,
  getFreePorts,
  STATION_TRANSITIONS,
  PORT_TRANSITIONS,
};
