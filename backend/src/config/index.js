require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },

  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    clientSecret: process.env.COGNITO_CLIENT_SECRET || undefined,
  },

  dynamodb: {
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
    tables: {
      stations: process.env.DYNAMODB_STATIONS_TABLE || 'Stations',
      sessions: process.env.DYNAMODB_SESSIONS_TABLE || 'Sessions',
      users: process.env.DYNAMODB_USERS_TABLE || 'Users',
      errorLogs: process.env.DYNAMODB_ERROR_LOGS_TABLE || 'ErrorLogs',
    },
  },

  lambda: {
    healthCheckFunctionName: process.env.HEALTH_CHECK_LAMBDA || 'ev-health-check-dev',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

module.exports = config;
