const { Router } = require('express');
const { requirePermission } = require('../middleware/rbac');
const sessionService = require('../services/sessionService');
const { requireFields, validatePositiveNumber } = require('../utils/validators');

const router = Router();

router.post('/start', requirePermission('sessions:create'), async (req, res, next) => {
  try {
    const { stationId, portId, batteryCapacityKwh } = req.body;
    requireFields(req.body, ['stationId', 'portId']);
    if (batteryCapacityKwh !== undefined) {
      validatePositiveNumber(batteryCapacityKwh, 'batteryCapacityKwh');
    }

    const session = await sessionService.startSession(
      req.user.userId,
      stationId,
      portId,
      batteryCapacityKwh || 60,
    );
    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/stop', async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const isForceStop = req.user.role === 'TECH_SUPPORT' || req.user.role === 'ADMIN';
    const session = await sessionService.stopSession(sessionId, req.user.userId, isForceStop);
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

router.get('/active', requirePermission('sessions:read'), async (req, res, next) => {
  try {
    const session = await sessionService.getActiveSession(req.user.userId);
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

router.get('/history', requirePermission('sessions:read'), async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessionHistory(req.user.userId);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

router.get('/all', requirePermission('sessions:force_stop'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const sessions = await sessionService.getAllSessions(status);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requirePermission('sessions:read'), async (req, res, next) => {
  try {
    const session = await sessionService.getSession(req.params.id);
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
