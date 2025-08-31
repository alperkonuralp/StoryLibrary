import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Admin-only routes (must come before other routes)
router.get('/', userController.getAllUsers); // GET /api/users - Admin only
router.put('/:id', userController.updateUser); // PUT /api/users/:id - Admin only
router.delete('/:id', userController.deleteUser); // DELETE /api/users/:id - Admin only

// User profile routes
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