import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth';
import { clientsRouter } from './routes/clients';
import { coursesRouter } from './routes/courses';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required');
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY env var is required');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/courses', coursesRouter);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
