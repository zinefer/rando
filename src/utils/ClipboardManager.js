/**
 * ClipboardManager - Utility for handling clipboard operations
 * 
 * This utility provides functions to:
 * - Copy text to clipboard
 * - Handle keyboard shortcuts for clipboard operations
 * - Support auto-copy on randomize
 */

import { getExportValue } from './URLManager'; // Import needed function

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
    console.error('[ClipboardManager] Failed to copy text: ', err);
    return false;
  }
};

/**
 * Copy items to clipboard using the template
 * @param {Array} items - List of items
 * @param {String} template - Template for formatting items
 * @param {Function} onCopy - Callback for when items are copied
 * @returns {Promise<Boolean>} Promise that resolves to true if copy was successful
 */
export const copyItemsToClipboard = async (items, template, onCopy) => {
  // Format items with template
  const formattedText = formatWithTemplate(items, template);

  console.log('[ClipboardManager] Copying items to clipboard:', formattedText);
  
  // Copy to clipboard
  const success = await copyToClipboard(formattedText);
  
  // Call callback if provided
  if (success && onCopy) {
    onCopy();
  }
  
  return success;
};

/**
 * Apply padding to a string based on the template
 * @param {String} str - String to pad
 * @param {String} template - Template string
 * @returns {String} Padded string
 */
const applyPadding = (str, template) => {
  // Find all padding placeholders in the template
  const padMatches = template.match(/\{pad:(\d+)\}/g);

  if (!padMatches) return template.replace('{item}', str);

  let result = template;

  // Apply each padding placeholder
  padMatches.forEach(match => {
    const padLength = parseInt(match.match(/\{pad:(\d+)\}/)[1]);
    const padding = ' '.repeat(Math.max(0, padLength - str.length));
    result = result.replace(match, padding);
  });

  // Replace the item placeholder
  return result.replace('{item}', str);
};

/**
 * Format items using the template
 * @param {Array} items - List of items (strings or objects with name/export properties)
 * @param {String} template - Template string
 * @returns {String} Formatted string
 */
export const formatWithTemplate = (items, template = '{item}') => {
  return items.map(item => {
    const exportValue = getExportValue(item); // Use imported function
    return applyPadding(exportValue, template);
  }).join('\n');
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
  notification.style.opacity = '0';
  
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
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
};
