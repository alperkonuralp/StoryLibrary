import { AuthService, setPrismaClient } from '../authService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, AuthenticationError, NotFoundError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../utils/helpers', () => ({
  generateRandomString: jest.fn(() => 'random-string-123'),
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Setup mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPrismaClient(mockPrisma);
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        createdAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await AuthService.register(mockRegisterData);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: 'test@example.com' },
            { username: 'testuser' },
          ],
        },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hashed-password',
          role: 'USER',
          profile: {
            create: {
              firstName: 'Test',
              lastName: 'User',
            },
          },
        },
        include: {
          profile: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'test@example.com',
        username: 'differentuser',
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(AuthService.register(mockRegisterData)).rejects.toThrow(ConflictError);
      await expect(AuthService.register(mockRegisterData)).rejects.toThrow('Email already registered');
    });

    it('should throw ConflictError if username already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'different@example.com',
        username: 'testuser',
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(AuthService.register(mockRegisterData)).rejects.toThrow(ConflictError);
      await expect(AuthService.register(mockRegisterData)).rejects.toThrow('Username already taken');
    });

    it('should handle registration without username', async () => {
      const registerDataNoUsername = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      });

      await AuthService.register(registerDataNoUsername);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'test@example.com' }],
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findFirst.mockRejectedValue(new Error('Database connection failed'));

      await expect(AuthService.register(mockRegisterData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed-password',
      role: 'USER',
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    it('should login user with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await AuthService.login(mockCredentials);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { profile: true },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-1', email: 'test@example.com' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-1', tokenId: 'random-string-123' },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
        }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.login(mockCredentials)).rejects.toThrow(AuthenticationError);
      await expect(AuthService.login(mockCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw AuthenticationError for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login(mockCredentials)).rejects.toThrow(AuthenticationError);
      await expect(AuthService.login(mockCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(AuthService.login(mockCredentials)).rejects.toThrow('Database error');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-1', tokenId: 'token-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await AuthService.refreshToken(refreshToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(refreshToken, 'test-refresh-secret');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw AuthenticationError for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError if user not found', async () => {
      mockJwt.verify.mockReturnValue({ userId: 'user-1', tokenId: 'token-123' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.refreshToken('valid-token')).rejects.toThrow(NotFoundError);
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      const token = 'valid-token';
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await AuthService.validateToken(token);

      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-jwt-secret');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          profile: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw AuthenticationError for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthService.validateToken('invalid-token')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError if user not found', async () => {
      mockJwt.verify.mockReturnValue({ userId: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.validateToken('valid-token')).rejects.toThrow(NotFoundError);
    });
  });

  describe('changePassword', () => {
    const userId = 'user-1';
    const currentPassword = 'oldpassword';
    const newPassword = 'newpassword';

    it('should change password successfully', async () => {
      const mockUser = {
        id: userId,
        passwordHash: 'old-hashed-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue('new-hashed-password');
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });

      await AuthService.changePassword(userId, currentPassword, newPassword);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(currentPassword, 'old-hashed-password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'new-hashed-password' },
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw AuthenticationError for incorrect current password', async () => {
      const mockUser = {
        id: userId,
        passwordHash: 'old-hashed-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await AuthService.getUserById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.getUserById('nonexistent-user'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUserProfile', () => {
    const userId = 'user-1';
    const profileData = {
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio',
    };

    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: userId,
        profile: profileData,
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await AuthService.updateUserProfile(userId, profileData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          profile: {
            upsert: {
              create: profileData,
              update: profileData,
            },
          },
        },
        include: { profile: true },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

      await expect(AuthService.updateUserProfile(userId, profileData))
        .rejects.toThrow('Database error');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token successfully', async () => {
      const tokenId = 'token-123';

      // Test the revoke functionality (implementation depends on refresh token storage)
      const result = AuthService.revokeRefreshToken(tokenId);

      expect(result).toBeDefined();
    });
  });
});