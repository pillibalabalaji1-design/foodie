import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined'));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
