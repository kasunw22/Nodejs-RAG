// config.js
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars before any other imports
const result = dotenv.config({
  path: resolve(__dirname, './.env')
});

dotenvExpand.expand(result);

if (result.error) {
  throw result.error;
}

// Optional: validate required env vars
const requiredEnvVars = [
    'APP_HOST',
    'APP_PORT',
    'DB_BASE',
    'DB_PATH',
    'DB_DATA_PATH',
    'DB_DATA_PATH_UPLOAD',
    'COMPUTE_SERVICE_URL',
    'TRANSLATOR_URL',
    'EMBED_URL',
    'LLM_URL',
    'STT_URL',
    'TTS_URL',
    'STATUS_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export environment configuration
export default process.env;
