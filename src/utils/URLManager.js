/**
 * URLManager - Utility for handling URL parameters for the Rando application
 * 
 * This utility provides functions to:
 * - Parse items from the URL
 * - Update the URL with new items
 * - Handle sticky items
 * - Support object-based items with name and export properties
 */

/**
 * Encode data to Base64
 * @param {Object|Array|String} data - Data to encode
 * @returns {String} Base64 encoded string
 */
export const encodeData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error('[URLManager] Error encoding data:', error);
    return '';
  }
};

/**
 * Decode data from Base64
 * @param {String} encodedData - Base64 encoded string
 * @returns {Object|Array|String} Decoded data
 */
export const decodeData = (encodedData) => {
  try {
    if (!encodedData) return null;
    const jsonString = decodeURIComponent(atob(encodedData));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[URLManager] Error decoding data:', error);
    return null;
  }
};

/**
 * Parse items from the URL
 * @returns {Object} Object containing items and sticky indices
 */
export const parseURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  
  // Get items from URL or use default empty array
  const itemsParam = params.get('i') || '';
  const items = itemsParam ? decodeData(itemsParam) || [] : [];
  
  // Get sticky indices from URL or use default empty array
  const stickyParam = params.get('s') || '';
  const sticky = stickyParam ? decodeData(stickyParam) || [] : [];
  
  return { items, sticky };
};

/**
 * Update the URL with new parameters
 * @param {Array} items - List of items (strings or objects with name/export properties)
 * @param {Array} sticky - Indices of sticky items
 */
export const updateURL = (items, sticky = []) => {
  const params = new URLSearchParams();

  // Only add parameters if they have values
  if (items.length > 0) {
    params.set('i', encodeData(items));
  }
  
  if (sticky.length > 0) {
    params.set('s', encodeData(sticky));
  }

  // Update URL without reloading the page
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.pushState({ path: newURL }, '', newURL);
};

/**
 * Check if an item is sticky
 * @param {Number} index - Index of the item
 * @param {Array} sticky - Array of sticky indices
 * @returns {Boolean} True if the item is sticky
 */
export const isSticky = (index, sticky = []) => {
  return sticky.includes(index);
};

/**
 * Toggle sticky status for an item
 * @param {Number} index - Index of the item
 * @param {Array} sticky - Current array of sticky indices
 * @returns {Array} Updated array of sticky indices
 */
export const toggleSticky = (index, sticky = []) => {
  if (isSticky(index, sticky)) {
    return sticky.filter(i => i !== index);
  } else {
    return [...sticky, index];
  }
};

/**
 * Get the display name for an item
 * @param {String|Object} item - Item (string or object with name/export properties)
 * @returns {String} Display name
 */
export const getDisplayName = (item) => {
  if (typeof item === 'string') {
    return item;
  }
  return item.name || '';
};

/**
 * Get the export value for an item
 * @param {String|Object} item - Item (string or object with name/export properties)
 * @returns {String} Export value
 */
export const getExportValue = (item) => {
  if (typeof item === 'string') {
    return item;
  }
  return item.export || item.name || '';
};

/**
 * Check if a string is a single emoji or just two characters
 * @param {String} str - String to check
 * @returns {Boolean} True if the string is a single emoji or exactly two characters
 */
export const shouldStretch = (str) => {
  if (typeof str !== 'string') return false;
  
  // Check if it's exactly two characters
  if (str.length === 2) return true;
  
  // Regex to match emoji characters
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
  return emojiRegex.test(str);
};
