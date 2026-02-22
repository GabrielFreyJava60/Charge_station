const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const config = require('./config');
const { requestLogger } = require('./middleware/logger');
const { authenticate } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const stationRoutes = require('./routes/stations');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');
const techSupportRoutes = require('./routes/techSupport');

const app = express();

const lambdaClient = new LambdaClient({ region: config.aws.region });

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const result = {
    service: 'ev-charging-backend',
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    checks: {
      gateway: { status: 'ok' },
    },
  };

  if (req.query.full === 'true') {
    try {
      const command = new InvokeCommand({
        FunctionName: config.lambda.healthCheckFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ source: 'backend-health-check' }),
      });

      const lambdaResponse = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
      const lambdaBody = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload;

      result.checks.lambda = {
        status: lambdaBody.status || 'ok',
        responseTimeMs: lambdaBody.responseTimeMs,
        checks: lambdaBody.checks,
      };

      if (lambdaBody.status === 'degraded') {
        result.status = 'degraded';
      }
    } catch (err) {
      result.checks.lambda = {
        status: 'error',
        message: config.isDev
          ? `Lambda недоступна (${err.message}). В dev-режиме это нормально, если Lambda не развернута.`
          : err.message,
      };
      if (!config.isDev) {
        result.status = 'degraded';
      }
    }
  }

  result.totalResponseTimeMs = Date.now() - startTime;
  res.json(result);
});

app.use('/api/auth', authRoutes);
app.use('/api/stations', authenticate, stationRoutes);
app.use('/api/sessions', authenticate, sessionRoutes);
app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/tech-support', authenticate, techSupportRoutes);

app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`EV Charging Backend running on port ${PORT} [${config.nodeEnv}]`);
});

module.exports = app;
