import { Router } from 'express';
import { seriesController } from '../controllers/seriesController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', seriesController.getSeries);
router.get('/slug/:slug', seriesController.getSeriesBySlug);
router.get('/:id', seriesController.getSeriesById);
router.get('/:id/stories', seriesController.getSeriesStories);

// Protected routes (Editor+)
router.use(authMiddleware);
router.post('/', seriesController.createSeries);
router.put('/:id', seriesController.updateSeries);
router.put('/:id/reorder', seriesController.reorderSeriesStories);
router.delete('/:id', seriesController.deleteSeries);

export default router;