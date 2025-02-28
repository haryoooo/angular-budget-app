// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Packages
import { EnvConfig } from 'env';
import packageInfo from '../../package.json';

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
// Access environment variables properly in TypeScript
// NOTE: In Angular, process.env is not directly available
// We'll need to use window and appropriate type handling

// Get environment variables from window.env object (which will be populated during build)
const env = window['env'] || {};

export const environment: Environment = {
  production: false,
  version: packageInfo.version,
  apiBaseUrl: env.NG_APP_SCHEME && env.NG_APP_HOST && env.NG_APP_PORT && env.NG_APP_PATH 
  ? `${env.NG_APP_SCHEME}${env.NG_APP_HOST}${env.NG_APP_PORT}${env.NG_APP_PATH}` 
  : "http://localhost:5000/api/",
  appName: env.NG_APP_NAME || "Budget Tracker App",
  defaultLanguage: env.NG_APP_DEFAULT_LANGUAGE || "en",
  apiKey: env.NG_APP_API_KEY || "",
  authDomain: env.NG_APP_AUTH_DOMAIN || "",
  projectId: env.NG_APP_PROJECT_ID || "",
  storageBucket: env.NG_APP_STORAGE_BUCKET || "",
  messagingSenderId: env.NG_APP_MESSAGING_ID || "",
  appId: env.NG_APP_APP_ID || "",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
