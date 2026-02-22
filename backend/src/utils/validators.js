const { ValidationError } = require('./errors');

function requireFields(body, fields) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90');
  }
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180');
  }
}

function validatePositiveNumber(value, fieldName) {
  if (typeof value !== 'number' || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
}

function validateEnum(value, validValues, fieldName) {
  if (!validValues.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${validValues.join(', ')}`);
  }
}

module.exports = {
  requireFields,
  validateEmail,
  validateCoordinates,
  validatePositiveNumber,
  validateEnum,
};
