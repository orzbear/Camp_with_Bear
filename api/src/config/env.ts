import 'dotenv/config';

const requiredEnvVars = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
};

// Fail fast if required env vars are missing
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const MONGO_URI = process.env.MONGO_URI!;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;
export const PORT = parseInt(process.env.PORT || '8080', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';

