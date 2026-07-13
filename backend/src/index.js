import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { healthRouter } from './routes/health.js';
import { datasetsRouter } from './routes/datasets.js';
import { transformsRouter } from './routes/transforms.js';
import { dashboardsRouter } from './routes/dashboards.js';
import { connectionsRouter } from './routes/connections.js';
import { sharesRouter } from './routes/shares.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.use('/api', healthRouter);
app.use('/api', datasetsRouter);
app.use('/api', transformsRouter);
app.use('/api', dashboardsRouter);
app.use('/api', connectionsRouter);
app.use('/api', sharesRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
