import express from 'express';
import healthRouter from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use('/health', healthRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

