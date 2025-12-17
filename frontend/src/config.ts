// Environment-based configuration for CineLog
/// <reference types="vite/client" />

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const config = {
  apiUrl: API_URL,
  apiBaseUrl: `${API_URL}/api`,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};

export default config;
