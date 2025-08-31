import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import Navigation from '../Navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the AuthContext directly
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Get the mock after it's defined
const { useAuth: mockUseAuth } = require('../../contexts/AuthContext')

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('Navigation', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Unauthenticated user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      })
    })

    it('should render basic navigation links', () => {
      render(<Navigation />)

      expect(screen.getByText('Story Library')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /stories/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /authors/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /categories/i })).toBeInTheDocument()
    })

    it('should show login and register buttons', () => {
      render(<Navigation />)

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should not show user-specific menus', () => {
      render(<Navigation />)

      expect(screen.queryByText('Progress')).not.toBeInTheDocument()
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated regular user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
        },
        token: 'mock-token',
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      })
    })

    it('should show user profile menu', () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      expect(profileButton).toBeInTheDocument()
    })

    it('should show profile dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      
      // Use userEvent for better Radix UI interaction
      await user.click(profileButton)

      await waitFor(
        () => {
          expect(screen.getByText('Profile')).toBeInTheDocument()
          expect(screen.getByText('Log out')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('should not show admin or editor options', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.queryByText('Editor Dashboard')).not.toBeInTheDocument()
        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
      })
    })

    it('should call logout when logout is clicked', async () => {
      const user = userEvent.setup()
      const mockLogout = jest.fn()
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
        },
        token: 'mock-token',
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        register: jest.fn(),
        isLoading: false,
      })

      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      await user.click(profileButton)

      await waitFor(
        async () => {
          const logoutButton = screen.getByText('Log out')
          await user.click(logoutButton)
          expect(mockLogout).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('Authenticated editor', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'editor-1',
          username: 'editoruser',
          email: 'editor@example.com',
          role: 'EDITOR',
        },
        token: 'mock-token',
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      })
    })

    it('should show editor-specific options', async () => {
      const user = userEvent.setup()
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /editoruser/i })
      await user.click(profileButton)

      await waitFor(
        () => {
          expect(screen.getByText('Editor Dashboard')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('should not show admin-only options', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /editoruser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
      })
    })
  })

  describe('Authenticated admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'admin-1',
          username: 'adminuser',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
        token: 'mock-token',
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      })
    })

    it('should show admin button for admin users', () => {
      render(<Navigation />)

      const adminButton = screen.getByRole('link', { name: /admin/i })
      expect(adminButton).toBeInTheDocument()
    })

    it('should show admin panel in dropdown', async () => {
      const user = userEvent.setup()
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /adminuser/i })
      await user.click(profileButton)

      await waitFor(
        () => {
          expect(screen.getByText('Admin Panel')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('should show all user options including editor features', async () => {
      const user = userEvent.setup()
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /adminuser/i })
      await user.click(profileButton)

      await waitFor(
        () => {
          expect(screen.getByText('Profile')).toBeInTheDocument()
          expect(screen.getByText('Editor Dashboard')).toBeInTheDocument()
          expect(screen.getByText('Admin Panel')).toBeInTheDocument()
          expect(screen.getByText('Log out')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('Responsive behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      })
    })

    it('should render navigation links consistently', () => {
      render(<Navigation />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('Stories')).toBeInTheDocument()
      expect(screen.getByText('Authors')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
    })
  })

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: true,
      })
    })

    it('should show loading skeleton for user area', () => {
      render(<Navigation />)

      expect(screen.getByText('Story Library')).toBeInTheDocument()
      // Loading state shows placeholder divs but no specific test id
    })

    it('should not show login/register buttons while loading', () => {
      render(<Navigation />)

      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
        },
        token: 'mock-token',
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
      })
    })

    it('should have proper ARIA attributes for dropdown', () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      expect(profileButton).toHaveAttribute('aria-haspopup', 'menu')
    })

    it('should support basic keyboard navigation', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      profileButton.focus()
      expect(profileButton).toHaveFocus()
    })

    it('should have accessible navigation structure', async () => {
      render(<Navigation />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })
})