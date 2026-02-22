const { ForbiddenError } = require('../utils/errors');

const PERMISSIONS = {
  USER: [
    'stations:read',
    'sessions:create',
    'sessions:read',
    'sessions:stop_own',
    'profile:read',
    'profile:update',
  ],
  TECH_SUPPORT: [
    'stations:read',
    'stations:set_mode',
    'sessions:read',
    'sessions:force_stop',
    'errors:read',
    'errors:update',
    'stats:read',
    'profile:read',
  ],
  ADMIN: [
    '*',
    'stations:create',
    'stations:update_tariff',
    'users:manage',
  ],
};

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    const role = req.user.role;
    const perms = PERMISSIONS[role] || [];
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }
    return next(new ForbiddenError(`Insufficient permissions: ${permission}`));
  };
}

module.exports = { requireRole, requirePermission, PERMISSIONS };
