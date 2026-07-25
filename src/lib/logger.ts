// Environment-aware logger. Detailed errors only in development to avoid
// leaking database schema, RLS hints, or query internals in production consoles.
const isDev = import.meta.env.DEV;

export const logError = (message: string, error?: unknown) => {
  if (isDev) {
    console.error(message, error);
  } else {
    console.error(message);
  }
};

export const logWarn = (message: string, data?: unknown) => {
  if (isDev) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
};
