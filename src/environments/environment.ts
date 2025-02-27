// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Enums
import { EnvName } from '@enums/environment.enum';

// Packages
import packageInfo from '../../package.json';

const scheme = process.env['NG_APP_SCHEME'] || 'http://';
const host = process.env['NG_APP_HOST'] || 'localhost';
const port = process.env['NG_APP_PORT'] || ':5000';
const path = process.env['NG_APP_PATH'] || '/api/';

const baseUrl = scheme + host + port + path;

export const environment = {
  production: false,
  version: packageInfo.version,
  appName: process.env['NG_APP_NAME'] || 'Expense Tracker App',
  envName: process.env['NG_APP_ENV_NAME'] || EnvName.LOCAL,
  defaultLanguage: process.env['NG_APP_DEFAULT_LANGUAGE'] || 'en',
  apiBaseUrl: baseUrl,
  apiKey: process.env['NG_APP_API_KEY'] || '',
  authDomain: process.env['NG_APP_AUTH_DOMAIN'] || '',
  projectId: process.env['NG_APP_PROJECT_ID'] || '',
  storageBucket: process.env['NG_APP_STORAGE_BUCKET'] || '',
  messagingId: process.env['NG_APP_MESSAGING_ID'] || '',
  appId: process.env['NG_APP_APP_ID'] || '',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
