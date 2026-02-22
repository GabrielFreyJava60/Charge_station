const { v4: uuidv4 } = require('uuid');
const { tables, getItem, putItem, updateItem, queryGSI } = require('../utils/dynamodb');
const { NotFoundError, ConflictError, InvalidTransitionError, ValidationError } = require('../utils/errors');
const stationService = require('./stationService');

const SESSION_TRANSITIONS = {
  STARTED: ['IN_PROGRESS', 'FAILED'],
  IN_PROGRESS: ['IN_PROGRESS', 'COMPLETED', 'INTERRUPTED', 'FAILED'],
  COMPLETED: [],
  INTERRUPTED: [],
  FAILED: [],
};

async function startSession(userId, stationId, portId, batteryCapacityKwh = 60) {
  const stationData = await stationService.getStation(stationId);
  if (stationData.status !== 'ACTIVE') {
    throw new ValidationError(`Station is ${stationData.status}, cannot start charging`);
  }

  const port = stationData.ports.find(p => p.portId === portId);
  if (!port) throw new NotFoundError('Port', portId);
  if (port.status !== 'FREE') {
    throw new ConflictError(`Port ${portId} is currently ${port.status}`);
  }

  const activeSessions = await queryGSI(tables.sessions, 'userId-index', 'userId', userId);
  const hasActive = activeSessions.some(s => ['STARTED', 'IN_PROGRESS'].includes(s.status));
  if (hasActive) {
    throw new ConflictError('You already have an active charging session');
  }

  const sessionId = `sess-${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  const sessionItem = {
    PK: `SESSION#${sessionId}`,
    SK: 'METADATA',
    sessionId,
    userId,
    stationId,
    portId,
    status: 'STARTED',
    chargePercent: 0,
    energyConsumedKwh: 0,
    totalCost: 0,
    tariffPerKwh: stationData.tariffPerKwh,
    batteryCapacityKwh,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(tables.sessions, sessionItem);
  await stationService.updatePortStatus(stationId, portId, 'CHARGING');

  return _formatSession(sessionItem);
}

async function stopSession(sessionId, userId, isForceStop = false) {
  const session = await getItem(tables.sessions, `SESSION#${sessionId}`, 'METADATA');
  if (!session) throw new NotFoundError('Session', sessionId);

  if (!isForceStop && session.userId !== userId) {
    throw new ValidationError('You can only stop your own sessions');
  }

  const currentStatus = session.status;
  if (!['STARTED', 'IN_PROGRESS'].includes(currentStatus)) {
    throw new InvalidTransitionError(`Session is ${currentStatus}, cannot stop`);
  }

  const newStatus = isForceStop ? 'INTERRUPTED' : 'INTERRUPTED';
  const now = new Date().toISOString();

  const result = await updateItem(
    tables.sessions,
    `SESSION#${sessionId}`, 'METADATA',
    'SET #status = :status, updatedAt = :now, completedAt = :now',
    { ':status': newStatus, ':now': now },
    { '#status': 'status' },
  );

  await stationService.updatePortStatus(session.stationId, session.portId, 'FREE');

  return _formatSession(result);
}

async function getSession(sessionId) {
  const item = await getItem(tables.sessions, `SESSION#${sessionId}`, 'METADATA');
  if (!item) throw new NotFoundError('Session', sessionId);
  return _formatSession(item);
}

async function getActiveSession(userId) {
  const items = await queryGSI(tables.sessions, 'userId-index', 'userId', userId, {
    scanForward: false,
  });
  const active = items.find(s => ['STARTED', 'IN_PROGRESS'].includes(s.status));
  return active ? _formatSession(active) : null;
}

async function getUserSessionHistory(userId) {
  const items = await queryGSI(tables.sessions, 'userId-index', 'userId', userId, {
    scanForward: false,
  });
  return items.map(_formatSession);
}

async function getAllSessions(statusFilter) {
  if (statusFilter) {
    const items = await queryGSI(tables.sessions, 'status-index', 'status', statusFilter, {
      scanForward: false,
    });
    return items.map(_formatSession);
  }

  const { scanTable } = require('../utils/dynamodb');
  const items = await scanTable(tables.sessions, 'SK = :sk', { ':sk': 'METADATA' });
  return items.map(_formatSession);
}

async function getActiveSessions() {
  const started = await queryGSI(tables.sessions, 'status-index', 'status', 'STARTED');
  const inProgress = await queryGSI(tables.sessions, 'status-index', 'status', 'IN_PROGRESS');
  return [...started, ...inProgress].map(_formatSession);
}

function _formatSession(item) {
  return {
    sessionId: item.sessionId,
    userId: item.userId,
    stationId: item.stationId,
    portId: item.portId,
    status: item.status,
    chargePercent: Math.round((Number(item.chargePercent) || 0) * 100) / 100,
    energyConsumedKwh: Math.round((Number(item.energyConsumedKwh) || 0) * 10000) / 10000,
    totalCost: Math.round((Number(item.totalCost) || 0) * 100) / 100,
    tariffPerKwh: Number(item.tariffPerKwh) || 0,
    batteryCapacityKwh: Number(item.batteryCapacityKwh) || 60,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: item.completedAt || null,
  };
}

module.exports = {
  startSession,
  stopSession,
  getSession,
  getActiveSession,
  getUserSessionHistory,
  getAllSessions,
  getActiveSessions,
  SESSION_TRANSITIONS,
};
