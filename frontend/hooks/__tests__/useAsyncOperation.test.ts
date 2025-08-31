import { renderHook, act } from '@testing-library/react'
import { useAsyncOperation } from '../useAsyncOperation'
import { APIError } from '../../lib/errorHandling'

describe('useAsyncOperation', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAsyncOperation<string>())

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.execute).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  describe('execute', () => {
    it('should handle successful operations', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      const mockOperation = jest.fn().mockResolvedValue('success data')

      let executionResult
      await act(async () => {
        executionResult = await result.current.execute(mockOperation)
      })

      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(executionResult).toBe('success data')
      expect(result.current.data).toBe('success data')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should set loading state during execution', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      const mockOperation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
      )

      act(() => {
        result.current.execute(mockOperation)
      })

      // Should be loading immediately
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.data).toBeNull()

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBe('data')
    })

    it('should clear error state when starting new operation', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())

      // First operation that fails
      const failingOperation = jest.fn().mockRejectedValue(new Error('First error'))

      await act(async () => {
        try {
          await result.current.execute(failingOperation)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBeInstanceOf(APIError)
      expect(result.current.error?.message).toBe('First error')

      // Second operation that succeeds
      const successOperation = jest.fn().mockResolvedValue('success')

      await act(async () => {
        await result.current.execute(successOperation)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.data).toBe('success')
    })

    it('should handle APIError instances', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      const apiError = new APIError('API Error', 400, 'BAD_REQUEST', { field: 'invalid' }, false)
      const mockOperation = jest.fn().mockRejectedValue(apiError)

      await act(async () => {
        try {
          await result.current.execute(mockOperation)
        } catch (error) {
          expect(error).toBe(apiError) // Should throw the same APIError instance
        }
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(apiError)
      expect(result.current.error?.status).toBe(400)
      expect(result.current.error?.code).toBe('BAD_REQUEST')
      expect(result.current.error?.details).toEqual({ field: 'invalid' })
      expect(result.current.error?.retryable).toBe(false)
    })

    it('should convert regular errors to APIError', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      const regularError = new Error('Regular error message')
      const mockOperation = jest.fn().mockRejectedValue(regularError)

      await act(async () => {
        try {
          await result.current.execute(mockOperation)
        } catch (error) {
          expect(error).toBeInstanceOf(APIError)
          expect(error.message).toBe('Regular error message')
        }
      })

      expect(result.current.error).toBeInstanceOf(APIError)
      expect(result.current.error?.message).toBe('Regular error message')
      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should handle non-error rejections', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      const mockOperation = jest.fn().mockRejectedValue('string error')

      await act(async () => {
        try {
          await result.current.execute(mockOperation)
        } catch (error) {
          expect(error).toBeInstanceOf(APIError)
          expect(error.message).toBe('Unknown error')
        }
      })

      expect(result.current.error).toBeInstanceOf(APIError)
      expect(result.current.error?.message).toBe('Unknown error')
    })

    it('should preserve previous data on error', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())

      // First successful operation
      const successOperation = jest.fn().mockResolvedValue('success data')

      await act(async () => {
        await result.current.execute(successOperation)
      })

      expect(result.current.data).toBe('success data')

      // Second operation that fails
      const failingOperation = jest.fn().mockRejectedValue(new Error('Failure'))

      await act(async () => {
        try {
          await result.current.execute(failingOperation)
        } catch (error) {
          // Expected to throw
        }
      })

      // Data should be preserved (not reset to null on error)
      expect(result.current.data).toBe('success data')
      expect(result.current.error).toBeInstanceOf(APIError)
      expect(result.current.loading).toBe(false)
    })

    it('should handle multiple concurrent operations', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      
      const operation1 = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('result1'), 100))
      )
      const operation2 = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('result2'), 50))
      )

      // Start both operations concurrently
      const promise1 = act(async () => {
        return result.current.execute(operation1)
      })

      const promise2 = act(async () => {
        return result.current.execute(operation2)
      })

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Both operations should complete successfully
      expect(result1).toBe('result1')
      expect(result2).toBe('result2')

      // The hook state should reflect the last completed operation
      expect(result.current.data).toBe('result2') // Completed last
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle operations with complex data types', async () => {
      const { result } = renderHook(() => useAsyncOperation<{ user: { id: string; name: string }; posts: string[] }>())
      
      const complexData = {
        user: { id: '123', name: 'John Doe' },
        posts: ['post1', 'post2', 'post3']
      }
      
      const mockOperation = jest.fn().mockResolvedValue(complexData)

      await act(async () => {
        await result.current.execute(mockOperation)
      })

      expect(result.current.data).toEqual(complexData)
      expect(result.current.data?.user.name).toBe('John Doe')
      expect(result.current.data?.posts).toHaveLength(3)
    })
  })

  describe('reset', () => {
    it('should reset all state to defaults', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())

      // First, set some state by running an operation
      const mockOperation = jest.fn().mockResolvedValue('test data')

      await act(async () => {
        await result.current.execute(mockOperation)
      })

      expect(result.current.data).toBe('test data')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()

      // Now reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should reset error state', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())

      // Create an error state
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'))

      await act(async () => {
        try {
          await result.current.execute(mockOperation)
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBeInstanceOf(APIError)

      // Reset should clear the error
      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should not interfere with ongoing operations', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      
      const slowOperation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow result'), 100))
      )

      // Start an operation
      const operationPromise = act(async () => {
        return result.current.execute(slowOperation)
      })

      // Reset while operation is in progress
      act(() => {
        result.current.reset()
      })

      // The operation should still complete successfully
      const result_value = await operationPromise

      expect(result_value).toBe('slow result')
      expect(result.current.data).toBe('slow result')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('function stability', () => {
    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useAsyncOperation<string>())

      const initialExecute = result.current.execute
      const initialReset = result.current.reset

      // Rerender the hook
      rerender()

      // Functions should maintain the same reference
      expect(result.current.execute).toBe(initialExecute)
      expect(result.current.reset).toBe(initialReset)
    })
  })

  describe('error handling edge cases', () => {
    it('should handle null/undefined errors', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      const mockOperation = jest.fn().mockRejectedValue(null)

      await act(async () => {
        try {
          await result.current.execute(mockOperation)
        } catch (error) {
          expect(error).toBeInstanceOf(APIError)
          expect(error.message).toBe('Unknown error')
        }
      })

      expect(result.current.error?.message).toBe('Unknown error')
    })

    it('should handle errors with circular references', async () => {
      const { result } = renderHook(() => useAsyncOperation<string>())
      
      // Create an error with circular reference
      const circularError: any = { message: 'Circular error' }
      circularError.self = circularError
      
      const mockOperation = jest.fn().mockRejectedValue(circularError)

      await act(async () => {
        try {
          await result.current.execute(mockOperation)
        } catch (error) {
          expect(error).toBeInstanceOf(APIError)
          expect(error.message).toBe('Unknown error')
        }
      })

      expect(result.current.error?.message).toBe('Unknown error')
    })
  })

  describe('type safety', () => {
    it('should maintain type safety for different data types', async () => {
      // String type
      const stringHook = renderHook(() => useAsyncOperation<string>())
      const stringOp = jest.fn().mockResolvedValue('string result')

      await act(async () => {
        const result = await stringHook.result.current.execute(stringOp)
        // TypeScript should infer this as string
        expect(typeof result).toBe('string')
      })

      // Number type
      const numberHook = renderHook(() => useAsyncOperation<number>())
      const numberOp = jest.fn().mockResolvedValue(42)

      await act(async () => {
        const result = await numberHook.result.current.execute(numberOp)
        // TypeScript should infer this as number
        expect(typeof result).toBe('number')
      })

      // Object type
      interface TestObject {
        id: number
        name: string
      }

      const objectHook = renderHook(() => useAsyncOperation<TestObject>())
      const objectOp = jest.fn().mockResolvedValue({ id: 1, name: 'test' })

      await act(async () => {
        const result = await objectHook.result.current.execute(objectOp)
        // TypeScript should infer this as TestObject
        expect(result.id).toBe(1)
        expect(result.name).toBe('test')
      })
    })
  })
})