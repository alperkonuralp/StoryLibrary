import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Navigation from '../Navigation'
import { useAuth } from '../../hooks/useAuth'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

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
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
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
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
    })

    it('should not show user-specific menus', () => {
      render(<Navigation />)

      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      expect(screen.queryByText('My Stories')).not.toBeInTheDocument()
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
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
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      })
    })

    it('should show user profile menu', () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      expect(profileButton).toBeInTheDocument()
    })

    it('should show profile dropdown when clicked', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
      })
    })

    it('should not show admin or editor options', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.queryByText('My Stories')).not.toBeInTheDocument()
        expect(screen.queryByText('Create Story')).not.toBeInTheDocument()
        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
      })
    })

    it('should call logout when logout is clicked', async () => {
      const mockLogout = jest.fn()
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
        },
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        register: jest.fn(),
        loading: false,
      })

      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        const logoutButton = screen.getByRole('menuitem', { name: /logout/i })
        fireEvent.click(logoutButton)
      })

      expect(mockLogout).toHaveBeenCalled()
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
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      })
    })

    it('should show editor-specific options', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /editoruser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /create story/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /my stories/i })).toBeInTheDocument()
      })
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
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      })
    })

    it('should show admin panel dropdown', () => {
      render(<Navigation />)

      const adminButton = screen.getByRole('button', { name: /admin panel/i })
      expect(adminButton).toBeInTheDocument()
    })

    it('should show admin dropdown options', async () => {
      render(<Navigation />)

      const adminButton = screen.getByRole('button', { name: /admin panel/i })
      fireEvent.click(adminButton)

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /stories/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /categories/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /authors/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /tags/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /users/i })).toBeInTheDocument()
      })
    })

    it('should show all user options including editor features', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /adminuser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /create story/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /my stories/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
      })
    })
  })

  describe('Mobile navigation', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      })
    })

    it('should show mobile menu button', () => {
      render(<Navigation />)

      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('should toggle mobile menu when button is clicked', async () => {
      render(<Navigation />)

      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toHaveClass('mobile-open')
      })

      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByRole('navigation')).not.toHaveClass('mobile-open')
      })
    })
  })

  describe('Search functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      })
    })

    it('should show search input', () => {
      render(<Navigation />)

      const searchInput = screen.getByPlaceholderText(/search stories/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should navigate to search results when search is submitted', async () => {
      render(<Navigation />)

      const searchInput = screen.getByPlaceholderText(/search stories/i)
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      fireEvent.submit(searchInput.closest('form')!)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/stories?search=test%20query')
      })
    })

    it('should show search suggestions', async () => {
      render(<Navigation />)

      const searchInput = screen.getByPlaceholderText(/search stories/i)
      fireEvent.focus(searchInput)
      fireEvent.change(searchInput, { target: { value: 'test' } })

      await waitFor(() => {
        expect(screen.getByText(/recent searches/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: true,
      })
    })

    it('should show loading skeleton for user area', () => {
      render(<Navigation />)

      expect(screen.getByTestId('user-loading')).toBeInTheDocument()
    })

    it('should not show login/register buttons while loading', () => {
      render(<Navigation />)

      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument()
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
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      })
    })

    it('should have proper ARIA labels', () => {
      render(<Navigation />)

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation')
      expect(screen.getByRole('button', { name: /testuser/i })).toHaveAttribute('aria-haspopup', 'menu')
    })

    it('should support keyboard navigation', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      profileButton.focus()
      fireEvent.keyDown(profileButton, { key: 'Enter' })

      await waitFor(() => {
        const profileMenuItem = screen.getByRole('menuitem', { name: /profile/i })
        expect(profileMenuItem).toBeInTheDocument()
      })

      fireEvent.keyDown(profileButton, { key: 'ArrowDown' })
      const logoutMenuItem = screen.getByRole('menuitem', { name: /logout/i })
      expect(logoutMenuItem).toHaveFocus()
    })

    it('should close dropdown on Escape key', async () => {
      render(<Navigation />)

      const profileButton = screen.getByRole('button', { name: /testuser/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: /profile/i })).not.toBeInTheDocument()
      })
    })
  })
})