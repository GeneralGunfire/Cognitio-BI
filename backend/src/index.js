import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { healthRouter } from './routes/health.js';
import { datasetsRouter } from './routes/datasets.js';
import { transformsRouter } from './routes/transforms.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.use('/api', healthRouter);
app.use('/api', datasetsRouter);
app.use('/api', transformsRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
