import { Router } from 'express';
import {
  createMenuItem,
  deleteMenuItem,
  getMenu,
  updateMenuItem
} from '../controllers/menu.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getMenu);
router.post('/', authenticate, authorizeAdmin, upload.single('image'), createMenuItem);
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), updateMenuItem);
router.delete('/:id', authenticate, authorizeAdmin, deleteMenuItem);

export default router;
