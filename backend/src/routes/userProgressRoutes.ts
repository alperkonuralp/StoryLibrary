import { Router } from 'express';
import { userProgressController } from '../controllers/userProgressController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All user progress routes require authentication
router.use(authMiddleware);

// User progress endpoints as specified in CLAUDE.md
router.get('/progress', userProgressController.getUserProgress);
router.post('/progress', userProgressController.updateUserProgress);
router.get('/completed', userProgressController.getCompletedStories);
router.get('/ratings', userProgressController.getUserRatings);

export default router;