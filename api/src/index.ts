import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/me', meRouter);

// Connect to database and start server
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

