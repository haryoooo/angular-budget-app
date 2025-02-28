import { readFileSync, writeFileSync } from "fs";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Read template
let envTemplate = readFileSync("env-template.js", "utf8");

// Replace placeholders with actual values
let envContent = envTemplate.replace(/\${(.*?)}/g, (_, key) => process.env[key] || "");

// Write `env.js` in `src/`
writeFileSync("src/env.js", envContent);

console.log("✅ env.js generated successfully!");
