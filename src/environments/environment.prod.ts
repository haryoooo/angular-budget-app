import { EnvConfig } from '@env/env';
import packageInfo from '../../package.json';


// Ensure correct type usage
const env: EnvConfig = window.env || {};

export const environment = {
  production: true,
  version: packageInfo.version,
  apiBaseUrl:
    env.NG_APP_SCHEME && env.NG_APP_HOST && env.NG_APP_PORT && env.NG_APP_PATH
      ? `${env.NG_APP_SCHEME}${env.NG_APP_HOST}${env.NG_APP_PORT}${env.NG_APP_PATH}`
      : 'http://localhost:5000/api/',
  appName: env.NG_APP_NAME || 'Budget Tracker App',
  defaultLanguage: env.NG_APP_DEFAULT_LANGUAGE || 'en',
  apiKey: env.NG_APP_API_KEY || '',
  authDomain: env.NG_APP_AUTH_DOMAIN || '',
  projectId: env.NG_APP_PROJECT_ID || '',
  storageBucket: env.NG_APP_STORAGE_BUCKET || '',
  messagingSenderId: env.NG_APP_MESSAGING_ID || '',
  appId: env.NG_APP_APP_ID || '',
};
