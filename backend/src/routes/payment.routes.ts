import { Router } from 'express';
import { confirmPayment, createPayment } from '../controllers/payment.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/create', upload.single('paymentReceipt'), createPayment);
router.post('/confirm/:id', confirmPayment);

export default router;
