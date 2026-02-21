import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './config/logger';
import { uploadsDir } from './config/uploads';
import { errorHandler, notFound } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import logRoutes from './routes/log.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info('http.request', { message: message.trim() })
    }
  })
);
app.use('/uploads', express.static(uploadsDir));

app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
