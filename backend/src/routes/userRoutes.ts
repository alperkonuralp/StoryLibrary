import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.changePassword);
router.get('/progress', userController.getReadingProgress);
router.post('/progress', userController.updateReadingProgress);
router.get('/completed', userController.getCompletedStories);
router.get('/ratings', userController.getUserRatings);
router.get('/stats', userController.getUserStats);
router.delete('/account', userController.deleteAccount);

export default router;