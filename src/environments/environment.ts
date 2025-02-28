// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Packages
import { EnvConfig } from 'env';
import packageInfo from '../../package.json';

// Enums
const scheme = 'http://';
const host = 'localhost';
const port = ':5000';
const path = '/api/';

const baseUrl = scheme + host + port + path;

export const environment = {
  production: (window.env as EnvConfig)?.NG_APP_ENV_NAME !== 'LOCAL',
  version: packageInfo.version,
  apiBaseUrl: `${(window.env as EnvConfig)?.NG_APP_SCHEME}${(window.env as EnvConfig)?.NG_APP_HOST}${(window.env as EnvConfig)?.NG_APP_PORT}${(window.env as EnvConfig)?.NG_APP_PATH}`,
  appName: (window.env as EnvConfig)?.NG_APP_NAME,
  defaultLanguage: (window.env as EnvConfig)?.NG_APP_DEFAULT_LANGUAGE,
  apiKey: (window.env as EnvConfig)?.NG_APP_API_KEY,
  authDomain: (window.env as EnvConfig)?.NG_APP_AUTH_DOMAIN,
  projectId: (window.env as EnvConfig)?.NG_APP_PROJECT_ID,
  storageBucket: (window.env as EnvConfig)?.NG_APP_STORAGE_BUCKET,
  messagingId: (window.env as EnvConfig)?.NG_APP_MESSAGING_ID,
  appId: (window.env as EnvConfig)?.NG_APP_APP_ID,
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
