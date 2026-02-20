import { Role } from '@prisma/client';
import { Router } from 'express';
import { createUser, deleteUser, listUsers } from '../controllers/user.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken, authorizeRole(Role.ADMIN));
router.get('/', listUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);

export default router;
