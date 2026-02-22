const morgan = require('morgan');
const config = require('../config');

const format = config.isDev
  ? 'dev'
  : ':remote-addr :method :url :status :res[content-length] - :response-time ms';

const requestLogger = morgan(format);

module.exports = { requestLogger };
