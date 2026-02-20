import { Role } from '@prisma/client';
import { Router } from 'express';
import { createFrontendLog, readBackendLogs, readFrontendLogs } from '../controllers/log.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', createFrontendLog);
router.get('/backend', authenticateToken, authorizeRole(Role.ADMIN), readBackendLogs);
router.get('/frontend', authenticateToken, authorizeRole(Role.ADMIN), readFrontendLogs);

export default router;
