import pino from 'pino';
import config from '../config/index.js';

const logger = pino({
  level: config.logLevel || 'info',
  transport:
    config.nodeEnv === 'development'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: {
    service: 'ssp-backend',
    env: config.nodeEnv || 'development',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.ssn',
      'body.social_security_number',
      '*.password_hash',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export default logger;
