import { Router } from 'express';
import { authorController } from '../controllers/authorController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', authorController.getAuthors);
router.get('/popular', authorController.getPopularAuthors);
router.get('/slug/:slug', authorController.getAuthorBySlug);
router.get('/:id', authorController.getAuthorById);
router.get('/:id/stories', authorController.getAuthorStories);

// Protected routes (Editor+)
router.use(authMiddleware);
router.post('/', authorController.createAuthor);
router.put('/:id', authorController.updateAuthor);
router.delete('/:id', authorController.deleteAuthor);

export default router;