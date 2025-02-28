// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Packages
import packageInfo from '../../package.json';

const scheme = 'http://';
const host = 'localhost';
const port = ':5000';
const path = '/api/';

const baseUrl = scheme + host + port + path;

const env = (window as any)['env'] || {};

export const environment = {
  production: true,
  version: packageInfo.version,
  apiBaseUrl: `${env.NG_APP_SCHEME}${env.NG_APP_HOST}${env.NG_APP_PORT}${env.NG_APP_PATH}` || "http://localhost:5000/api/",
  appName: env.NG_APP_NAME || "Budget Tracker App",
  defaultLanguage: env.NG_APP_DEFAULT_LANGUAGE || "en",
  apiKey: env.NG_APP_API_KEY || "",
  authDomain: env.NG_APP_AUTH_DOMAIN || "",
  projectId: env.NG_APP_PROJECT_ID || "",
  storageBucket: env.NG_APP_STORAGE_BUCKET || "",
  messagingId: env.NG_APP_MESSAGING_ID || "",  // ✅ Corrected
  appId: env.NG_APP_APP_ID || "",
};
