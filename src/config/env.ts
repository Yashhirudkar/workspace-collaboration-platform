export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/local_first_docs',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-for-dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
