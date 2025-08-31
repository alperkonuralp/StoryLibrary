import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { useAuth } from '../useAuth'

// Mock the API client
jest.mock('../../lib/api', () => ({
  apiClient: {
    getMe: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    setAuthToken: jest.fn(),
    clearAuthToken: jest.fn(),
  },
}))

// Get the mocked version to use in tests
const { apiClient: mockApiClient } = require('../../lib/api')

// Wrapper component for tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

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
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should load user data when token exists in localStorage', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      }

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      mockApiClient.getMe.mockResolvedValue({
        success: true,
        data: { user: mockUser },
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockApiClient.getMe).toHaveBeenCalled()
    })

    it('should handle invalid token by clearing storage', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token')
      mockApiClient.getMe.mockRejectedValue(new Error('Invalid token'))

      const { result } = renderHook(() => useAuth(), { wrapper })

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
        success: true,
        data: {
          user: mockUser,
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }

      mockApiClient.login.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(mockApiClient.login).toHaveBeenCalledWith('test@example.com', 'password123')

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-access-token')
    })

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials')
      mockApiClient.login.mockRejectedValue(error)

      const { result } = renderHook(() => useAuth(), { wrapper })

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
        success: true,
        data: {
          user: mockUser,
          accessToken: 'new-access-token',
        },
      }

      mockApiClient.register.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.register('new@example.com', 'password123', 'newuser')
      })

      expect(mockApiClient.register).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
        'newuser'
      )

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-access-token')
    })

    it('should handle registration failure', async () => {
      const error = new Error('Email already exists')
      mockApiClient.register.mockRejectedValue(error)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        try {
          await result.current.register('existing@example.com', 'password123')
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
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Mock logout - AuthContext doesn't call API for logout, just clears local state

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
    })
  })
})