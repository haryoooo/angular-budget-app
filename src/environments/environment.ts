import packageInfo from '../../package.json';

// Define interface for environment variables
interface Environment {
  production: boolean;
  version: string;
  apiBaseUrl: string;
  appName: string;
  defaultLanguage: string;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Define a type for `window.env`
interface WindowEnv extends Partial<Environment> {
  NG_APP_SCHEME?: string;
  NG_APP_HOST?: string;
  NG_APP_PORT?: string;
  NG_APP_PATH?: string;
  NG_APP_NAME?: string;
  NG_APP_DEFAULT_LANGUAGE?: string;
  NG_APP_API_KEY?: string;
  NG_APP_AUTH_DOMAIN?: string;
  NG_APP_PROJECT_ID?: string;
  NG_APP_STORAGE_BUCKET?: string;
  NG_APP_MESSAGING_ID?: string;
  NG_APP_APP_ID?: string;
}

// Declare `window.env`
declare global {
  interface Window {
    env: WindowEnv;
  }
}

// Ensure `window.env` exists
const env: WindowEnv = window.env || {};

export const environment: Environment = {
  production: false,
  version: packageInfo.version,
  apiBaseUrl:
    env.apiBaseUrl ??
    (env.NG_APP_SCHEME && env.NG_APP_HOST && env.NG_APP_PORT && env.NG_APP_PATH
      ? `${env.NG_APP_SCHEME}${env.NG_APP_HOST}${env.NG_APP_PORT}${env.NG_APP_PATH}`
      : 'http://localhost:5000/api/'),
  appName: env.appName ?? env.NG_APP_NAME ?? 'Budget Tracker App',
  defaultLanguage: env.defaultLanguage ?? env.NG_APP_DEFAULT_LANGUAGE ?? 'en',
  apiKey: env.apiKey ?? env.NG_APP_API_KEY ?? '',
  authDomain: env.authDomain ?? env.NG_APP_AUTH_DOMAIN ?? '',
  projectId: env.projectId ?? env.NG_APP_PROJECT_ID ?? '',
  storageBucket: env.storageBucket ?? env.NG_APP_STORAGE_BUCKET ?? '',
  messagingSenderId: env.messagingSenderId ?? env.NG_APP_MESSAGING_ID ?? '',
  appId: env.appId ?? env.NG_APP_APP_ID ?? '',
};
