import { writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const envContent = `
window.env = {
  NG_APP_SCHEME: "${process.env.NG_APP_SCHEME || "http://"}",
  NG_APP_HOST: "${process.env.NG_APP_HOST || "localhost"}",
  NG_APP_PORT: "${process.env.NG_APP_PORT || ":5000"}",
  NG_APP_PATH: "${process.env.NG_APP_PATH || "/api/"}",
  NG_APP_NAME: "${process.env.NG_APP_NAME || "Budget Tracker App"}",
  NG_APP_DEFAULT_LANGUAGE: "${process.env.NG_APP_DEFAULT_LANGUAGE || "en"}",
  NG_APP_API_KEY: "${process.env.NG_APP_API_KEY || ""}",
  NG_APP_AUTH_DOMAIN: "${process.env.NG_APP_AUTH_DOMAIN || ""}",
  NG_APP_PROJECT_ID: "${process.env.NG_APP_PROJECT_ID || ""}",
  NG_APP_STORAGE_BUCKET: "${process.env.NG_APP_STORAGE_BUCKET || ""}",
  NG_APP_MESSAGING_ID: "${process.env.NG_APP_MESSAGING_ID || ""}",
  NG_APP_APP_ID: "${process.env.NG_APP_APP_ID || ""}"
};
`;

writeFileSync("src/assets/env.js", envContent);
console.log("✅ env.js generated successfully!");
