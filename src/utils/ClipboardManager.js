/**
 * ClipboardManager - Utility for handling clipboard operations
 * 
 * This utility provides functions to:
 * - Copy text to clipboard
 * - Handle keyboard shortcuts for clipboard operations
 */

import { formatWithTemplate } from './URLManager';

/**
 * Copy text to clipboard
 * @param {String} text - Text to copy
 * @returns {Promise} Promise that resolves when text is copied
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

/**
 * Set up keyboard shortcut for copying items
 * @param {Array} items - List of items
 * @param {String} template - Template for formatting items
 * @param {Function} onCopy - Callback for when items are copied
 * @returns {Function} Cleanup function to remove event listener
 */
export const setupClipboardShortcut = (items, template, onCopy) => {
  const handleKeyDown = async (e) => {
    // Check for Ctrl+C (or Cmd+C on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // Only handle if no text is selected
      const selection = window.getSelection().toString();
      if (!selection) {
        e.preventDefault();
        
        // Format items with template
        const formattedText = formatWithTemplate(items, template);
        
        // Copy to clipboard
        const success = await copyToClipboard(formattedText);
        
        // Call callback if provided
        if (success && onCopy) {
          onCopy();
        }
      }
    }
  };
  
  // Add event listener
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Show a temporary notification
 * @param {String} message - Message to display
 * @param {Number} duration - Duration in milliseconds
 */
export const showNotification = (message, duration = 2000) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Fade in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);
  
  // Fade out and remove
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, duration);
};
