const { Router } = require('express');
const { requireRole } = require('../middleware/rbac');
const userService = require('../services/userService');
const cognitoService = require('../services/cognitoService');
const stationService = require('../services/stationService');
const { requireFields, validateEnum, validateCoordinates, validatePositiveNumber } = require('../utils/validators');

const router = Router();

router.use(requireRole('ADMIN'));

router.get('/users', async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    requireFields(req.body, ['role']);
    validateEnum(role, ['USER', 'TECH_SUPPORT', 'ADMIN'], 'role');

    const user = await userService.getUser(req.params.id);
    await cognitoService.changeUserRole(user.email, role);
    const updated = await userService.updateUserRole(req.params.id, role);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/block', async (req, res, next) => {
  try {
    const { blocked } = req.body;
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: '"blocked" must be boolean' });
    }

    const user = await userService.getUser(req.params.id);
    if (blocked) {
      await cognitoService.disableUser(user.email);
    } else {
      await cognitoService.enableUser(user.email);
    }

    const updated = await userService.blockUser(req.params.id, blocked);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    await cognitoService.deleteUser(user.email);
    await userService.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/stations', async (req, res, next) => {
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

router.patch('/stations/:id/commission', async (req, res, next) => {
  try {
    const station = await stationService.updateStationStatus(req.params.id, 'ACTIVE');
    res.json({ station });
  } catch (err) {
    next(err);
  }
});

router.patch('/stations/:id/tariff', async (req, res, next) => {
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
