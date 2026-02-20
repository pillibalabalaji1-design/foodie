import { Router } from 'express';
import { createOrder, getOrders, updateOrder } from '../controllers/order.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/', createOrder);
router.get('/', authenticate, authorizeAdmin, getOrders);
router.put('/:id', authenticate, authorizeAdmin, updateOrder);

export default router;
