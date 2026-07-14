export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(`[INFO] ${message}`, meta ? meta : '');
  },
  error: (message: string, meta?: unknown) => {
    console.error(`[ERROR] ${message}`, meta ? meta : '');
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(`[WARN] ${message}`, meta ? meta : '');
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta ? meta : '');
    }
  }
};
