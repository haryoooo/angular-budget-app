import { EnvConfig } from '@env/env';
import packageInfo from '../../package.json';


// Ensure correct type usage
const env: EnvConfig = window.env || {};

export const environment = {
  production: false,
  version: packageInfo.version,
  apiBaseUrl: "http://localhost:5000/api/",
  appName: "Budget Tracker App",
  defaultLanguage: "en",
  apiKey: "AIzaSyBDdtgW09XZBENsAThOP-QT0q6_DsicwNE",
  authDomain: "budget-planner-app-fca65.firebaseapp.com",
  projectId: "budget-planner-app-fca65",
  storageBucket: "budget-planner-app-fca65.appspot.com",
  messagingSenderId: "597346873722",
  appId: "1:597346873722:web:9cfb2ae08f66bce20266c3"
};

