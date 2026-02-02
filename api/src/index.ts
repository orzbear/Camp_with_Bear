import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { PORT, NODE_ENV } from './config/env.js';
import { seedCampsites } from './scripts/seedCampsites.js';
import { authMiddleware } from './middleware/auth.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import tripsRouter from './routes/trips.js';
import weatherRouter from './routes/weather.js';
import checklistRouter from './routes/checklist.js';
import publicCampsitesRouter from './routes/publicCampsites.js';
import footprintsRouter from './routes/footprints.js';
import geocodeRouter from './routes/geocode.js';

const app = express();

// CORS allowed origins configuration
function getAllowedOrigins(): string[] {
  const isProduction = NODE_ENV === 'production';
  const origins: string[] = [];

  // Development: Allow localhost origins
  if (!isProduction) {
    origins.push(
      "http://localhost:5173",  // Vite dev server
      "http://localhost:3000",   // Docker frontend (browser access)
      "http://localhost:3001"   // Alternative port
    );
  }

  // Support multiple origins via ALLOWED_ORIGINS (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    const allowedOriginsList = process.env.ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
    origins.push(...allowedOriginsList);
  }

  // Support single origin via FRONTEND_URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Production: Fail fast if no allowed origins configured
  if (isProduction && origins.length === 0) {
    throw new Error(
      'CORS configuration error: In production, at least one of ALLOWED_ORIGINS or FRONTEND_URL must be set. ' +
      'Localhost origins are not allowed in production.'
    );
  }

  // Remove duplicates and filter out any empty values
  const uniqueOrigins = Array.from(new Set(origins.filter(Boolean)));

  // Log allowed origins at startup (once)
  if (uniqueOrigins.length > 0) {
    console.log(`✅ CORS allowed origins (${NODE_ENV}):`, uniqueOrigins);
  }

  return uniqueOrigins;
}

const allowedOrigins = getAllowedOrigins();

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: false,
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes - Mount all routes under /api prefix for ALB routing
// ALB routes /api/* to this service, so we need to handle the /api prefix
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/public/campsites', publicCampsitesRouter);
app.use('/api/geocode', geocodeRouter); // Public geocoding endpoint (no auth required)
app.use('/api/trips', authMiddleware, tripsRouter);
app.use('/api/weather', authMiddleware, weatherRouter);
app.use('/api/checklist', authMiddleware, checklistRouter);
app.use('/api/footprints', authMiddleware, footprintsRouter);

// Also support root-level routes for direct container access (health checks, etc.)
app.use('/health', healthRouter);

// Connect to database and start server
async function start() {
  try {
    await connectDB();
    
    // Seed campsites in non-production environments
    if (NODE_ENV !== 'production') {
      await seedCampsites();
    }
    
    app.listen(PORT, () => {
      console.log(`CampMate API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

