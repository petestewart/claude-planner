import { useRef, useEffect, useState, useCallback } from 'react'

interface UseScrollToBottomOptions {
  /** Threshold in pixels from bottom to consider "at bottom" */
  threshold?: number
}

interface UseScrollToBottomReturn {
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Whether the user is currently at the bottom */
  isAtBottom: boolean
  /** Whether to show the scroll-to-bottom button */
  showScrollButton: boolean
  /** Function to scroll to bottom */
  scrollToBottom: () => void
}

export function useScrollToBottom(
  options: UseScrollToBottomOptions = {}
): UseScrollToBottomReturn {
  const { threshold = 100 } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight <= threshold
  }, [threshold])

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = (): void => {
      const atBottom = checkIfAtBottom()
      setIsAtBottom(atBottom)
      setShowScrollButton(!atBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [checkIfAtBottom])

  // Auto-scroll when content changes and user is at bottom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new window.MutationObserver(() => {
      if (isAtBottom) {
        // Use requestAnimationFrame to ensure DOM has updated
        window.requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight
        })
      }
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }, [isAtBottom])

  return {
    containerRef,
    isAtBottom,
    showScrollButton,
    scrollToBottom,
  }
}
