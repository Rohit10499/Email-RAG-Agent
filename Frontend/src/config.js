const config = {
  API_BASE: import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000",
  APP_ENV: import.meta.env?.VITE_APP_ENV || "development",
  IS_DEVELOPMENT: import.meta.env?.DEV ?? true,
  IS_PRODUCTION: import.meta.env?.PROD ?? false,
};

export default config;