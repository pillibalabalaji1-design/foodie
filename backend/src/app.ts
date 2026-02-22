import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import { uploadsDir } from './config/uploads';
import { errorHandler, notFound } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import logRoutes from './routes/log.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = new Set([env.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000']);
      if (allowedOrigins.has(origin)) return callback(null, true);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
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
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
