const { Router } = require('express');
const { requirePermission } = require('../middleware/rbac');
const stationService = require('../services/stationService');
const { requireFields, validateCoordinates, validatePositiveNumber, validateEnum } = require('../utils/validators');

const router = Router();

router.get('/', requirePermission('stations:read'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const stations = status
      ? await stationService.getStationsByStatus(status)
      : await stationService.listStations();
    res.json({ stations });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requirePermission('stations:read'), async (req, res, next) => {
  try {
    const station = await stationService.getStation(req.params.id);
    res.json({ station });
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('stations:create'), async (req, res, next) => {
  try {
    const { name, address, latitude, longitude, totalPorts, powerKw, tariffPerKwh } = req.body;
    requireFields(req.body, ['name', 'address', 'latitude', 'longitude', 'totalPorts', 'powerKw', 'tariffPerKwh']);
    validateCoordinates(latitude, longitude);
    validatePositiveNumber(totalPorts, 'totalPorts');
    validatePositiveNumber(powerKw, 'powerKw');
    validatePositiveNumber(tariffPerKwh, 'tariffPerKwh');

    const station = await stationService.createStation({
      name, address, latitude, longitude, totalPorts, powerKw, tariffPerKwh,
    });
    res.status(201).json({ station });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requirePermission('stations:set_mode'), async (req, res, next) => {
  try {
    const { status } = req.body;
    requireFields(req.body, ['status']);
    validateEnum(status, ['NEW', 'ACTIVE', 'MAINTENANCE', 'OUT_OF_ORDER'], 'status');

    const station = await stationService.updateStationStatus(req.params.id, status);
    res.json({ station });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/tariff', requirePermission('stations:update_tariff'), async (req, res, next) => {
  try {
    const { tariffPerKwh } = req.body;
    requireFields(req.body, ['tariffPerKwh']);
    validatePositiveNumber(tariffPerKwh, 'tariffPerKwh');

    const station = await stationService.updateTariff(req.params.id, tariffPerKwh);
    res.json({ station });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
