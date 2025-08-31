import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock the API
const mockApi = {
  post: jest.fn(),
  get: jest.fn(),
}

jest.mock('../../lib/api', () => ({
  api: mockApi,
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Initial state', () => {
    it('should initialize with no user when no token in localStorage', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.loading).toBe(false)
    })

    it('should load user data when token exists in localStorage', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      }

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser },
        },
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.loading).toBe(false)
      })

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me')
    })

    it('should handle invalid token by clearing storage', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token')
      mockApi.get.mockRejectedValue(new Error('Invalid token'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
      })
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: mockUser,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      }

      mockApi.post.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-access-token')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token')
    })

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials')
      mockApi.post.mockRejectedValue(error)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword')
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should set loading state during login', async () => {
      mockApi.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          data: { success: true, data: { user: {}, accessToken: 'token' } }
        }), 100)
      }))

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.login('test@example.com', 'password123')
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        id: 'user-new',
        username: 'newuser',
        email: 'new@example.com',
        role: 'USER',
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: mockUser,
            accessToken: 'new-access-token',
          },
        },
      }

      mockApi.post.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.register({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        })
      })

      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-access-token')
    })

    it('should handle registration failure', async () => {
      const error = new Error('Email already exists')
      mockApi.post.mockRejectedValue(error)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.register({
            username: 'testuser',
            email: 'existing@example.com',
            password: 'password123',
          })
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout and clear user data', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      }

      // Set up authenticated state
      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.setUser(mockUser)
      })

      mockApi.post.mockResolvedValue({ data: { success: true } })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout')
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
    })

    it('should clear user data even if logout API fails', async () => {
      const mockUser = { id: 'user-1', username: 'testuser' }
      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.setUser(mockUser)
      })

      mockApi.post.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('token refresh', () => {
    it('should refresh token when current token expires', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'expired-token'
        if (key === 'refreshToken') return 'valid-refresh-token'
        return null
      })

      const mockUser = { id: 'user-1', username: 'testuser' }
      const mockRefreshResponse = {
        data: {
          success: true,
          data: {
            user: mockUser,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      }

      mockApi.get.mockRejectedValueOnce({ response: { status: 401 } })
      mockApi.post.mockResolvedValue(mockRefreshResponse)

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh', {
          refreshToken: 'valid-refresh-token',
        })
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-access-token')
      })
    })

    it('should logout when refresh token is invalid', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'expired-token'
        if (key === 'refreshToken') return 'invalid-refresh-token'
        return null
      })

      mockApi.get.mockRejectedValue({ response: { status: 401 } })
      mockApi.post.mockRejectedValue(new Error('Invalid refresh token'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      })
    })
  })

  describe('role-based utilities', () => {
    it('should correctly identify admin users', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.setUser({ id: '1', role: 'ADMIN' })
      })

      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isEditor).toBe(true) // Admin has editor privileges
    })

    it('should correctly identify editor users', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.setUser({ id: '1', role: 'EDITOR' })
      })

      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isEditor).toBe(true)
    })

    it('should correctly identify regular users', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.setUser({ id: '1', role: 'USER' })
      })

      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isEditor).toBe(false)
    })
  })

  describe('password change', () => {
    it('should change password successfully', async () => {
      const mockUser = { id: 'user-1', username: 'testuser' }
      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.setUser(mockUser)
      })

      mockApi.post.mockResolvedValue({
        data: { success: true, message: 'Password changed successfully' },
      })

      await act(async () => {
        await result.current.changePassword('oldPassword', 'newPassword')
      })

      expect(mockApi.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      })
    })

    it('should handle password change failure', async () => {
      const mockUser = { id: 'user-1', username: 'testuser' }
      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.setUser(mockUser)
      })

      const error = new Error('Current password is incorrect')
      mockApi.post.mockRejectedValue(error)

      await act(async () => {
        try {
          await result.current.changePassword('wrongPassword', 'newPassword')
        } catch (e) {
          expect(e).toBe(error)
        }
      })
    })
  })

  describe('profile update', () => {
    it('should update user profile successfully', async () => {
      const mockUser = { id: 'user-1', username: 'testuser', email: 'test@example.com' }
      const { result } = renderHook(() => useAuth())
      
      act(() => {
        result.current.setUser(mockUser)
      })

      const updatedProfile = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio',
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { ...mockUser, profile: updatedProfile },
          },
        },
      }

      mockApi.post.mockResolvedValue(mockResponse)

      await act(async () => {
        await result.current.updateProfile(updatedProfile)
      })

      expect(mockApi.post).toHaveBeenCalledWith('/auth/me/profile', updatedProfile)
      expect(result.current.user.profile).toEqual(updatedProfile)
    })
  })
})