const { Router } = require('express');
const { requireRole } = require('../middleware/rbac');
const { tables, queryGSI, updateItem, scanTable } = require('../utils/dynamodb');
const sessionService = require('../services/sessionService');
const stationService = require('../services/stationService');
const { requireFields, validateEnum } = require('../utils/validators');

const router = Router();

router.use(requireRole('TECH_SUPPORT', 'ADMIN'));

router.get('/errors', async (req, res, next) => {
  try {
    const { level, service, status } = req.query;
    let errors;

    if (level) {
      errors = await queryGSI(tables.errorLogs, 'level-index', 'level', level, { scanForward: false });
    } else if (service) {
      errors = await queryGSI(tables.errorLogs, 'service-index', 'service', service, { scanForward: false });
    } else if (status) {
      errors = await queryGSI(tables.errorLogs, 'status-index', 'logStatus', status, { scanForward: false });
    } else {
      errors = await scanTable(tables.errorLogs);
    }

    res.json({ errors: errors.map(_formatError) });
  } catch (err) {
    next(err);
  }
});

router.patch('/errors/:id/status', async (req, res, next) => {
  try {
    const { status, timestamp } = req.body;
    requireFields(req.body, ['status', 'timestamp']);
    validateEnum(status, ['NEW', 'IN_PROGRESS', 'RESOLVED'], 'status');

    const result = await updateItem(
      tables.errorLogs,
      `ERROR#${req.params.id}`, timestamp,
      'SET logStatus = :status',
      { ':status': status },
    );
    res.json({ error: _formatError(result) });
  } catch (err) {
    next(err);
  }
});

router.patch('/stations/:id/mode', async (req, res, next) => {
  try {
    const { status } = req.body;
    requireFields(req.body, ['status']);
    validateEnum(status, ['ACTIVE', 'MAINTENANCE', 'OUT_OF_ORDER'], 'status');

    const station = await stationService.updateStationStatus(req.params.id, status);
    res.json({ station });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/:id/force-stop', async (req, res, next) => {
  try {
    const session = await sessionService.stopSession(req.params.id, req.user.userId, true);
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const activeSessions = await sessionService.getActiveSessions();

    const allStations = await stationService.listStations();
    const totalPorts = allStations.reduce((sum, s) => sum + s.totalPorts, 0);
    const faultyStations = allStations.filter(s =>
      s.status === 'OUT_OF_ORDER' || s.status === 'MAINTENANCE'
    ).length;

    const occupiedPorts = activeSessions.length;
    const occupancyPercent = totalPorts > 0
      ? Math.round((occupiedPorts / totalPorts) * 10000) / 100
      : 0;

    res.json({
      stats: {
        activeSessions: activeSessions.length,
        totalStations: allStations.length,
        totalPorts,
        occupiedPorts,
        portOccupancyPercent: occupancyPercent,
        faultyStations,
        stationsByStatus: {
          ACTIVE: allStations.filter(s => s.status === 'ACTIVE').length,
          NEW: allStations.filter(s => s.status === 'NEW').length,
          MAINTENANCE: allStations.filter(s => s.status === 'MAINTENANCE').length,
          OUT_OF_ORDER: allStations.filter(s => s.status === 'OUT_OF_ORDER').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

function _formatError(item) {
  return {
    errorId: item.errorId,
    service: item.service,
    level: item.level,
    message: item.message,
    status: item.logStatus,
    details: item.details || null,
    timestamp: item.timestamp || item.SK,
  };
}

module.exports = router;
