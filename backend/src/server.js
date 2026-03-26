import app from './app.js';
import config from './config/index.js';

const { port } = config;

app.listen(port, () => {
  console.log(`SSP API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
});
