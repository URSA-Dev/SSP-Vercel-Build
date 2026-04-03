import dotenv from 'dotenv';
dotenv.config();

const isDev = (process.env.NODE_ENV || 'development') === 'development';

function requireEnv(name, devDefault) {
  const value = process.env[name];
  if (value) return value;
  if (isDev && devDefault !== undefined) return devDefault;
  throw new Error(`Missing required environment variable: ${name}`);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'ssp',
    user: process.env.DB_USER || 'ssp',
    password: requireEnv('DB_PASS', 'ssp_dev_password'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-only-secret-do-not-use-in-prod'),
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800,
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png,text/plain').split(','),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10) || 4096,
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.3,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimensions: 1536,
    batchSize: 100,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  ai: {
    maxConcurrentTasks: parseInt(process.env.AI_MAX_CONCURRENT_TASKS, 10) || 5,
    defaultTopK: parseInt(process.env.AI_DEFAULT_TOP_K, 10) || 5,
    similarityThreshold: parseFloat(process.env.AI_SIMILARITY_THRESHOLD) || 0.7,
    dailyCostLimitUsd: parseFloat(process.env.AI_DAILY_COST_LIMIT_USD) || 500.0,
  },
};

export default config;
