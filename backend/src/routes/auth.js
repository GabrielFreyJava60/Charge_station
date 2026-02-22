const { Router } = require('express');
const cognitoService = require('../services/cognitoService');
const userService = require('../services/userService');
const { requireFields, validateEmail } = require('../utils/validators');

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber } = req.body;
    requireFields(req.body, ['email', 'password', 'name']);
    validateEmail(email);

    const cognitoResult = await cognitoService.signUp(email, password, name, phoneNumber);

    await userService.createOrUpdateUser({
      userId: cognitoResult.userId,
      email,
      name,
      role: 'USER',
    });

    res.status(201).json({
      message: 'Registration successful',
      user: cognitoResult,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    requireFields(req.body, ['email', 'password']);

    const authResult = await cognitoService.signIn(email, password);

    await userService.createOrUpdateUser({
      userId: authResult.userId,
      email,
      name: '',
      role: authResult.role,
    });

    res.json(authResult);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    requireFields(req.body, ['refreshToken']);
    const result = await cognitoService.refreshToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
