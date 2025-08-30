import { Router } from 'express';
import { storyController } from '../controllers/storyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', storyController.getStories);
router.get('/top-rated', storyController.getTopRatedStories);
router.get('/recent', storyController.getRecentStories);
router.get('/slug/:slug', storyController.getStoryBySlug);
router.get('/:id', storyController.getStoryById);

// Protected routes
router.use(authMiddleware);

router.post('/', storyController.createStory);
router.put('/:id', storyController.updateStory);
router.delete('/:id', storyController.deleteStory);
router.post('/:id/publish', storyController.publishStory);
router.post('/:id/unpublish', storyController.unpublishStory);
router.post('/:id/rate', storyController.rateStory);

export default router;