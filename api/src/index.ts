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

const app = express();

const allowedOrigins = [
  "http://localhost:5173",  
  "http://localhost:3000",  
  "http://localhost:3001"   
];


// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: false,
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/me', meRouter);
app.use('/public/campsites', publicCampsitesRouter);
app.use('/trips', authMiddleware, tripsRouter);
app.use('/weather', authMiddleware, weatherRouter);
app.use('/checklist', authMiddleware, checklistRouter);

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

