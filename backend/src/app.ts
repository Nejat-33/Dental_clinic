import rateLimit from 'express-rate-limit';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter  from './routes/index.js';
import { env } from './config/env.js';


export const app = express();


if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL.split(',').map((s) => s.trim()), // allows "https://clinic.com,https://www.clinic.com"
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
);
app.use('/api', apiRouter);