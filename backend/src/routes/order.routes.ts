import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getPaymentOptions,
  resendOrderConfirmation,
  updateOrder,
  verifyBankTransfer
} from '../controllers/order.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/payment/options', getPaymentOptions);
router.post('/', upload.single('paymentReceipt'), createOrder);
router.get('/', authenticate, authorizeAdmin, getOrders);
router.put('/:id', authenticate, authorizeAdmin, updateOrder);
router.post('/:id/send-confirmation', authenticate, authorizeAdmin, resendOrderConfirmation);
router.post('/:id/payment/verify', authenticate, authorizeAdmin, verifyBankTransfer);

export default router;
