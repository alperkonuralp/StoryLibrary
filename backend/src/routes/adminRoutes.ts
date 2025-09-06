import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);

// Admin story management routes
router.get('/stories/deleted', adminController.getDeletedStories);
router.post('/stories/:id/restore', adminController.restoreStory);
router.delete('/stories/:id/permanent', adminController.permanentDeleteStory);

export default router;