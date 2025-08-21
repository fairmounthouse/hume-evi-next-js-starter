import { useEffect, useState, useRef, useCallback } from 'react';

interface UseSmartScrollOptions {
  threshold?: number; // How close to bottom to consider "at bottom" (default: 100px)
  debounceMs?: number; // Debounce scroll events (default: 100ms)
}

interface UseSmartScrollReturn {
  isAtBottom: boolean;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * Smart scrolling hook for transcript
 * - Auto-scrolls only when user is at bottom
 * - Shows scroll-to-bottom button when not at bottom
 * - Debounces scroll events for performance
 */
export function useSmartScroll(
  messagesRef: React.RefObject<any>,
  messageCount: number,
  options: UseSmartScrollOptions = {}
): UseSmartScrollReturn {
  const { threshold = 100, debounceMs = 100 } = options;
  
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(messageCount);

  // Check if user is at bottom of scroll
  const checkIsAtBottom = useCallback((element: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= threshold;
  }, [threshold]);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
      
      // Update state immediately for better UX
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  }, [messagesRef]);

  // Handle scroll events with debouncing
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the scroll check
    debounceTimeoutRef.current = setTimeout(() => {
      const atBottom = checkIsAtBottom(element);
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom && messageCount > 3); // Only show button if there are messages and not at bottom
    }, debounceMs);
  }, [checkIsAtBottom, debounceMs, messageCount]);

  // Auto-scroll when new messages arrive (only if user was at bottom)
  useEffect(() => {
    const hasNewMessages = messageCount > lastMessageCountRef.current;
    lastMessageCountRef.current = messageCount;
    
    if (hasNewMessages && isAtBottom && messagesRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTo({
            top: messagesRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [messageCount, isAtBottom, messagesRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAtBottom,
    showScrollButton,
    scrollToBottom,
    handleScroll
  };
}
