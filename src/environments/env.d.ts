export { EnvConfig }; // Ensure this file is treated as a module

// Define the structure of window.env
interface EnvConfig {
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

// Augment the Window interface
declare global {
  interface Window {
    env: EnvConfig;
  }
}
