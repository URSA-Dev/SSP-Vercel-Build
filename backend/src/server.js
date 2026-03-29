import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const log = logger.child({ module: 'server' });

app.listen(config.port, () => {
  log.info({ port: config.port, env: config.nodeEnv }, 'SSP API server running');
  log.info({ url: `http://localhost:${config.port}/api/v1/health` }, 'Health check available');
});
