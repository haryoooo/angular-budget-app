import fs from 'fs';

// Define environment variables
const envConfig = `
window.env = {
  NG_APP_API_BASE_URL: "${process.env.NG_APP_API_BASE_URL || ''}",
  NG_APP_NAME: "${process.env.NG_APP_NAME || 'Budget Tracker App'}",
  NG_APP_DEFAULT_LANGUAGE: "${process.env.NG_APP_DEFAULT_LANGUAGE || 'en'}",
  NG_APP_API_KEY: "${process.env.NG_APP_API_KEY || ''}",
  NG_APP_AUTH_DOMAIN: "${process.env.NG_APP_AUTH_DOMAIN || ''}",
  NG_APP_PROJECT_ID: "${process.env.NG_APP_PROJECT_ID || ''}",
  NG_APP_STORAGE_BUCKET: "${process.env.NG_APP_STORAGE_BUCKET || ''}",
  NG_APP_MESSAGING_ID: "${process.env.NG_APP_MESSAGING_ID || ''}",
  NG_APP_APP_ID: "${process.env.NG_APP_APP_ID || ''}"
};
`;

// Ensure the 'src/assets/' directory exists
fs.mkdirSync('src/assets', { recursive: true });

// Write to env.js file
fs.writeFileSync('src/assets/env.js', envConfig);

console.log('✅ env.js file generated successfully!');