import { Router } from 'express';
import { authorController } from '../controllers/authorController';
import { authMiddleware, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', authorController.getAuthors);
router.get('/popular', authorController.getPopularAuthors);
router.get('/slug/:slug', authorController.getAuthorBySlug);
router.get('/slug/:slug/stories', authorController.getAuthorStoriesBySlug);

// Author follow routes by slug (require authentication)
router.get('/slug/:slug/follow-status', authMiddleware, authorController.getFollowStatusBySlug);
router.post('/slug/:slug/follow', authMiddleware, authorController.followAuthorBySlug);
router.delete('/slug/:slug/follow', authMiddleware, authorController.unfollowAuthorBySlug);
router.get('/slug/:slug/followers', optionalAuthenticate, authorController.getFollowersBySlug);
router.get('/slug/:slug/following', optionalAuthenticate, authorController.getFollowingBySlug);

// ID-based routes (kept for backward compatibility)
router.get('/:id', authorController.getAuthorById);
router.get('/:id/stories', authorController.getAuthorStories);

// Author follow routes by ID (require authentication)
router.get('/:id/follow-status', authMiddleware, authorController.getFollowStatus);
router.post('/:id/follow', authMiddleware, authorController.followAuthor);
router.delete('/:id/follow', authMiddleware, authorController.unfollowAuthor);
router.get('/:id/followers', optionalAuthenticate, authorController.getFollowers);
router.get('/:id/following', optionalAuthenticate, authorController.getFollowing);

// Protected routes (Editor+)
router.post('/', authMiddleware, authorController.createAuthor);
router.put('/:id', authMiddleware, authorController.updateAuthor);
router.delete('/:id', authMiddleware, authorController.deleteAuthor);

export default router;