import dotenv from 'dotenv';
dotenv.config();

const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssp',
  user: process.env.DB_USER || 'ssp',
  password: process.env.DB_PASS || 'ssp_dev_password',
};

export default {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: '../database/migrations',
    },
    seeds: {
      directory: '../database/seeds',
    },
    pool: { min: 2, max: 10 },
  },

  test: {
    client: 'pg',
    connection: {
      ...connection,
      database: process.env.DB_NAME_TEST || 'ssp_test',
    },
    migrations: {
      directory: '../database/migrations',
    },
    seeds: {
      directory: '../database/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: '../database/migrations',
    },
    pool: { min: 2, max: 20 },
  },
};
