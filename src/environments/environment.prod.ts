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

const env = window['env'] as unknown as { [key: string]: string };

export const environment = {
  production: env?.['NG_APP_ENV_NAME'] !== 'LOCAL',
  version: packageInfo.version,
  apiUrl: `${env?.['NG_APP_SCHEME']}${env?.['NG_APP_HOST']}${env?.['NG_APP_PORT']}${env?.['NG_APP_PATH']}`,
  appName: env?.['NG_APP_NAME'],
  defaultLanguage: env?.['NG_APP_DEFAULT_LANGUAGE'],
  apiKey: env?.['NG_APP_API_KEY'],
  authDomain: env?.['NG_APP_AUTH_DOMAIN'],
  projectId: env?.['NG_APP_PROJECT_ID'],
  storageBucket: env?.['NG_APP_STORAGE_BUCKET'],
  messagingSenderId: env?.['NG_APP_MESSAGING_ID'],
  appId: env?.['NG_APP_APP_ID'],
};
