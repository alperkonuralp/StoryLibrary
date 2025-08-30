import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { 
  validateBody, 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../middleware/validation';
import { 
  authenticate, 
  authRateLimit, 
  passwordResetRateLimit,
  requireDevelopment,
  logAuthEvent,
} from '../middleware/authMiddleware';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  authRateLimit,
  validateBody(registerSchema),
  logAuthEvent('REGISTER'),
  AuthController.register
);

router.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  logAuthEvent('LOGIN'),
  AuthController.login
);

router.post(
  '/refresh',
  authRateLimit,
  validateBody(refreshTokenSchema),
  logAuthEvent('REFRESH_TOKEN'),
  AuthController.refreshToken
);

router.post(
  '/logout',
  validateBody(refreshTokenSchema),
  logAuthEvent('LOGOUT'),
  AuthController.logout
);

// Token verification (for external services)
router.post(
  '/verify',
  AuthController.verifyToken
);

// Protected routes (require authentication)
router.get(
  '/me',
  authenticate,
  AuthController.me
);

router.put(
  '/profile',
  authenticate,
  validateBody(updateProfileSchema),
  logAuthEvent('UPDATE_PROFILE'),
  AuthController.updateProfile
);

router.put(
  '/password',
  authenticate,
  validateBody(changePasswordSchema),
  logAuthEvent('CHANGE_PASSWORD'),
  AuthController.changePassword
);

router.delete(
  '/account',
  authenticate,
  passwordResetRateLimit,
  logAuthEvent('DELETE_ACCOUNT'),
  AuthController.deleteAccount
);

router.get(
  '/stats',
  authenticate,
  AuthController.getUserStats
);

// Health check
router.get('/health', AuthController.healthCheck);

// Development only routes
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/admin',
    requireDevelopment,
    validateBody(registerSchema),
    AuthController.createAdmin
  );
}

export default router;