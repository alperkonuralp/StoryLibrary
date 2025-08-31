import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// Admin-only analytics routes
router.get('/dashboard', analyticsController.getDashboardStats); // GET /api/analytics/dashboard - Admin only
router.get('/stories/:storyId', analyticsController.getStoryStats); // GET /api/analytics/stories/:id - Admin/Editor

export default router;