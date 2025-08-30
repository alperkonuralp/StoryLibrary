import { Router } from 'express';
import { tagController } from '../controllers/tagController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', tagController.getTags);
router.get('/popular', tagController.getPopularTags);
router.get('/slug/:slug', tagController.getTagBySlug);
router.get('/:id', tagController.getTagById);
router.get('/:id/stories', tagController.getTagStories);

// Protected routes (Editor+)
router.use(authMiddleware);
router.post('/', tagController.createTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

export default router;