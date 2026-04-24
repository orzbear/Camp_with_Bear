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

// MONGO_URI accepts both mongodb:// (local) and mongodb+srv:// (Atlas) protocols
export const MONGO_URI = process.env.MONGO_URI!;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;
// PORT defaults to 8080; Render overrides this via process.env.PORT at runtime
export const PORT = parseInt(process.env.PORT || '8080', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';
// Optional: comma-separated list of allowed CORS origins (e.g. your Vercel URL)
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? '';

