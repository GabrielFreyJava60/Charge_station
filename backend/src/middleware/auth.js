const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');

let client;
function getJwksClient() {
  if (!client) {
    const jwksUri = `https://cognito-idp.${config.aws.region}.amazonaws.com/${config.cognito.userPoolId}/.well-known/jwks.json`;
    client = jwksClient({ jwksUri, cache: true, cacheMaxEntries: 5, cacheMaxAge: 600000 });
  }
  return client;
}

function getSigningKey(header, callback) {
  if (config.isDev && !config.cognito.userPoolId) {
    return callback(null, process.env.JWT_SECRET || 'dev-secret-key');
  }
  getJwksClient().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  if (config.isDev && !config.cognito.userPoolId) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
      req.user = {
        userId: decoded.sub || decoded.userId,
        email: decoded.email,
        role: decoded['custom:role'] || decoded.role || 'USER',
        groups: decoded['cognito:groups'] || decoded.groups || [],
      };
      return next();
    } catch (err) {
      return next(new UnauthorizedError('Invalid token'));
    }
  }

  jwt.verify(token, getSigningKey, {
    algorithms: ['RS256'],
    issuer: `https://cognito-idp.${config.aws.region}.amazonaws.com/${config.cognito.userPoolId}`,
  }, (err, decoded) => {
    if (err) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      role: (decoded['cognito:groups'] || [])[0] || 'USER',
      groups: decoded['cognito:groups'] || [],
    };
    next();
  });
}

module.exports = { authenticate };
