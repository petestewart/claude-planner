import { renderHook, act } from '@testing-library/react'
import { useRetry, retry } from './useRetry'

describe('useRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial state', () => {
    const asyncFn = jest.fn().mockResolvedValue('test')
    const { result } = renderHook(() => useRetry<string>(asyncFn))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.attempt).toBe(0)
  })

  it('should execute successfully on first attempt', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useRetry<string>(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('success')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.attempt).toBe(1)
    expect(asyncFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('success')

    const { result } = renderHook(() =>
      useRetry<string>(asyncFn, { initialDelay: 100, maxAttempts: 3 })
    )

    // Start execution
    act(() => {
      void result.current.execute()
    })

    // Wait for first attempt to fail and timer to advance
    await act(async () => {
      await Promise.resolve()
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })

    expect(result.current.data).toBe('success')
    expect(result.current.error).toBeNull()
    expect(asyncFn).toHaveBeenCalledTimes(2)
  })

  it('should call onRetry callback', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')
    const onRetry = jest.fn()

    const { result } = renderHook(() =>
      useRetry<string>(asyncFn, { initialDelay: 100, onRetry })
    )

    act(() => {
      void result.current.execute()
    })

    await act(async () => {
      await Promise.resolve()
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
  })

  it('should stop after maxAttempts', async () => {
    const asyncFn = jest.fn().mockRejectedValue(new Error('always fails'))

    const { result } = renderHook(() =>
      useRetry<string>(asyncFn, { maxAttempts: 2, initialDelay: 100 })
    )

    act(() => {
      void result.current.execute()
    })

    await act(async () => {
      await Promise.resolve()
      jest.advanceTimersByTime(100)
      await Promise.resolve()
      jest.advanceTimersByTime(200)
      await Promise.resolve()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error?.message).toBe('always fails')
    expect(result.current.attempt).toBe(2)
    expect(asyncFn).toHaveBeenCalledTimes(2)
  })

  it('should reset state', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useRetry<string>(asyncFn))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('success')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.attempt).toBe(0)
  })

  it('should use exponential backoff', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success')

    const { result } = renderHook(() =>
      useRetry<string>(asyncFn, {
        initialDelay: 100,
        backoffFactor: 2,
        maxAttempts: 3,
      })
    )

    act(() => {
      void result.current.execute()
    })

    // First attempt fails, wait for first delay (100ms)
    await act(async () => {
      await Promise.resolve()
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })

    // Second attempt fails, wait for second delay (200ms)
    await act(async () => {
      jest.advanceTimersByTime(200)
      await Promise.resolve()
    })

    expect(asyncFn).toHaveBeenCalledTimes(3)
    expect(result.current.data).toBe('success')
  })

  it('should cap delay at maxDelay', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')

    const { result } = renderHook(() =>
      useRetry<string>(asyncFn, {
        initialDelay: 1000,
        maxDelay: 50,
        backoffFactor: 10,
      })
    )

    act(() => {
      void result.current.execute()
    })

    await act(async () => {
      await Promise.resolve()
      // Should cap at maxDelay (50ms) not initialDelay (1000ms)
      jest.advanceTimersByTime(50)
      await Promise.resolve()
    })

    expect(result.current.data).toBe('success')
  })

  it('should handle non-Error throws', async () => {
    const asyncFn = jest.fn().mockRejectedValue('string error')

    const { result } = renderHook(() =>
      useRetry<string>(asyncFn, { maxAttempts: 1 })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.error?.message).toBe('string error')
  })
})

describe('retry utility function', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return result on success', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success')

    const resultPromise = retry(asyncFn)

    await jest.runAllTimersAsync()
    const result = await resultPromise

    expect(result).toBe('success')
    expect(asyncFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')

    const resultPromise = retry(asyncFn, { initialDelay: 100 })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(100)
    })

    const result = await resultPromise

    expect(result).toBe('success')
    expect(asyncFn).toHaveBeenCalledTimes(2)
  })

  it('should throw after maxAttempts', async () => {
    jest.useRealTimers() // Use real timers for this test
    const asyncFn = jest.fn().mockRejectedValue(new Error('always fails'))

    await expect(
      retry(asyncFn, { maxAttempts: 2, initialDelay: 1 })
    ).rejects.toThrow('always fails')

    expect(asyncFn).toHaveBeenCalledTimes(2)
    jest.useFakeTimers() // Restore fake timers
  })

  it('should call onRetry callback', async () => {
    const asyncFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')
    const onRetry = jest.fn()

    const resultPromise = retry(asyncFn, { initialDelay: 100, onRetry })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(100)
    })

    await resultPromise

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
  })

  it('should handle non-Error throws', async () => {
    const asyncFn = jest.fn().mockRejectedValue('string error')

    const resultPromise = retry(asyncFn, { maxAttempts: 1 })

    await expect(resultPromise).rejects.toThrow('string error')
  })
})
