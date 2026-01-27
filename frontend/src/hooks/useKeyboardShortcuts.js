import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 * 
 * @param {Object} shortcuts - Object mapping key combinations to callbacks
 * @param {Object} options - Configuration options
 * 
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => openSearch(),
 *   'ctrl+shift+p': () => openCommandPalette(),
 *   'escape': () => closeModal(),
 * });
 */
const useKeyboardShortcuts = (shortcuts, options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    excludeInputs = true,
  } = options;

  // Use ref to always have latest shortcuts without re-attaching listener
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Skip if focused on input elements
    if (excludeInputs) {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      const isContentEditable = target.isContentEditable;
      
      // Allow escape key even in inputs
      if ((isInput || isContentEditable) && event.key !== 'Escape') {
        return;
      }
    }

    // Build the key combination string
    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    // Normalize key name
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    
    // Don't add modifier keys as the main key
    if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
      parts.push(key);
    }

    const combo = parts.join('+');
    const currentShortcuts = shortcutsRef.current;

    if (currentShortcuts[combo]) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      currentShortcuts[combo](event);
    }
  }, [enabled, preventDefault, stopPropagation, excludeInputs]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook for common application shortcuts
 */
export const useAppShortcuts = ({
  onSearch,
  onNavigateHome,
  onToggleTheme,
  onHelp,
  onEscape,
}) => {
  useKeyboardShortcuts({
    'ctrl+k': onSearch,
    'ctrl+/': onHelp,
    'ctrl+h': onNavigateHome,
    'ctrl+shift+l': onToggleTheme,
    'escape': onEscape,
  });
};

/**
 * Hook for modal/dialog shortcuts
 */
export const useModalShortcuts = (isOpen, onClose, onConfirm) => {
  useKeyboardShortcuts({
    'escape': onClose,
    'enter': onConfirm,
  }, { enabled: isOpen });
};

/**
 * Hook for navigation shortcuts
 */
export const useNavigationShortcuts = (navigate) => {
  useKeyboardShortcuts({
    'alt+1': () => navigate('/dashboard'),
    'alt+2': () => navigate('/burial-records'),
    'alt+3': () => navigate('/plots'),
    'alt+4': () => navigate('/map'),
  });
};

export default useKeyboardShortcuts;
