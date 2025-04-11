/**
 * URLManager - Utility for handling URL hash parameters for the Rando application
 * 
 * This utility provides functions to:
 * - Parse items from the URL hash
 * - Update the URL hash with new items
 * - Handle sticky items
 * - Support object-based items with name and export properties
 */

import { URL_CONSTANTS } from '../constants/appConstants';

/**
 * Encode a string for use in the URL hash
 * @param {String} str - String to encode
 * @returns {String} Encoded string
 */
export const encodeHashString = (str) => {
  if (typeof str !== 'string') return '';
  
  // Encode special characters that would interfere with our format
  return encodeURIComponent(str);
};

/**
 * Decode a string from the URL hash
 * @param {String} str - Encoded string
 * @returns {String} Decoded string
 */
export const decodeHashString = (str) => {
  if (typeof str !== 'string') return '';
  
  try {
    return decodeURIComponent(str);
  } catch (error) {
    console.error('[URLManager] Error decoding string:', error);
    return str;
  }
};

/**
 * Clean an item by removing any sticky prefixes
 * @param {String|Object} item - Item to clean
 * @returns {String|Object} Cleaned item
 */
const cleanItem = (item) => {
  if (typeof item === 'string') {
    // Remove any sticky prefixes from the item string
    return item.replace(new RegExp(`^${URL_CONSTANTS.STICKY_PREFIX}+`), '');
  }
  return item;
};

/**
 * Parse items from the URL hash
 * @returns {Object} Object containing items and sticky indices
 */
export const parseURLParams = () => {
  // Get the hash without the # symbol
  const hash = decodeURIComponent(window.location.hash.substring(1));
  
  console.log('[URLManager] Parsing URL hash:', hash);
  console.log('[URLManager] Using separator:', URL_CONSTANTS.NAME_EXPORT_SEPARATOR);
  
  if (!hash) {
    return { items: [], sticky: [] };
  }
  
  const itemStrings = hash.split(URL_CONSTANTS.ITEM_SEPARATOR);
  console.log('[URLManager] Split items:', itemStrings);
  
  const items = [];
  const sticky = [];
  
  itemStrings.forEach((itemStr, index) => {
    // Skip empty items
    if (!itemStr.trim()) return;
    
    let isItemSticky = false;
    let processedStr = itemStr;
    
    // Check if item is sticky
    if (processedStr.startsWith(URL_CONSTANTS.STICKY_PREFIX)) {
      isItemSticky = true;
      processedStr = processedStr.substring(URL_CONSTANTS.STICKY_PREFIX.length);
    }
    
    // Only add to sticky array if the item is sticky
    if (isItemSticky) {
      sticky.push(index);
    }
    
    // Check if item has separate name and export values
    if (processedStr.includes(URL_CONSTANTS.NAME_EXPORT_SEPARATOR)) {
      console.log('[URLManager] Item contains separator:', processedStr);
      
      const parts = processedStr.split(URL_CONSTANTS.NAME_EXPORT_SEPARATOR);
      console.log('[URLManager] Split parts:', parts);
      
      // Make sure we have at least two parts
      if (parts.length >= 2) {
        const name = decodeHashString(parts[0]);
        // Join the rest of the parts with the separator in case there are multiple separators
        const exportVal = decodeHashString(parts.slice(1).join(URL_CONSTANTS.NAME_EXPORT_SEPARATOR));
        
        console.log('[URLManager] Parsed item with separator:', { name, export: exportVal });
        items.push({ name, export: exportVal });
      } else {
        // If we only have one part, treat it as a simple string
        const decodedItem = decodeHashString(processedStr);
        console.log('[URLManager] Parsed as simple item despite separator:', decodedItem);
        items.push(decodedItem);
      }
    } else {
      // Simple string item
      const decodedItem = decodeHashString(processedStr);
      console.log('[URLManager] Parsed simple item:', decodedItem);
      items.push(decodedItem);
    }
  });
  
  return { items, sticky };
};

/**
 * Update the URL with new parameters
 * @param {Array} items - List of items (strings or objects with name/export properties)
 * @param {Array} sticky - Indices of sticky items
 */
export const updateURL = (items, sticky = []) => {
  if (!items || !items.length) {
    window.location.hash = '';
    return;
  }
  
  console.log('[URLManager] Updating URL with items:', items);
  console.log('[URLManager] Sticky indices:', sticky);
  
  // Clean all items before serializing to URL
  const cleanedItems = items.map(item => cleanItem(item));
  
  const hashParts = cleanedItems.map((item, index) => {
    let hashPart = '';
    
    // Add sticky prefix if needed - only once
    if (sticky.includes(index)) {
      hashPart += URL_CONSTANTS.STICKY_PREFIX;
    }
    
    // Handle string vs object items
    if (typeof item === 'string') {
      hashPart += encodeHashString(item);
      console.log(`[URLManager] Item ${index} is string:`, item);
    } else {
      const name = encodeHashString(item.name || '');
      
      // Only add export value if it differs from name
      if (item.export && item.export !== item.name) {
        const exportVal = encodeHashString(item.export);
        hashPart += `${name}${URL_CONSTANTS.NAME_EXPORT_SEPARATOR}${exportVal}`;
        console.log(`[URLManager] Item ${index} has different export:`, { name: item.name, export: item.export });
      } else {
        hashPart += name;
        console.log(`[URLManager] Item ${index} has same name and export:`, item.name);
      }
    }
    
    return hashPart;
  });
  
  const newHash = hashParts.join(URL_CONSTANTS.ITEM_SEPARATOR);
  console.log('[URLManager] New URL hash:', newHash);
  
  // Update the URL hash
  window.location.hash = newHash;
};

/**
 * Set up a hash change listener to update the app state when the URL hash changes
 * @param {Function} callback - Callback function to call when the hash changes
 * @returns {Function} Cleanup function to remove the event listener
 */
export const setupHashChangeListener = (callback) => {
  const handleHashChange = () => {
    const { items, sticky } = parseURLParams();
    callback(items, sticky);
  };
  
  window.addEventListener('hashchange', handleHashChange);
  
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
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
  // First clean the item to remove any sticky prefixes
  const cleaned = cleanItem(item);
  
  if (typeof cleaned === 'string') {
    // If the item contains a separator, extract just the name part
    if (cleaned.includes(URL_CONSTANTS.NAME_EXPORT_SEPARATOR)) {
      const separatorIndex = cleaned.indexOf(URL_CONSTANTS.NAME_EXPORT_SEPARATOR);
      return cleaned.substring(0, separatorIndex);
    }
    
    return cleaned;
  }
  return cleaned.name || '';
};

/**
 * Get the export value for an item
 * @param {String|Object} item - Item (string or object with name/export properties)
 * @returns {String} Export value
 */
export const getExportValue = (item) => {
  // Clean the item to remove sticky prefixes
  const cleaned = cleanItem(item);

  if (typeof cleaned === 'string') {
    // Split the string by the separator and return the second part if it exists
    const parts = cleaned.split(URL_CONSTANTS.NAME_EXPORT_SEPARATOR);
    return parts[1] || parts[0];
  }

  // Return the export property if it exists, otherwise fallback to the name
  return cleaned.export || cleaned.name || '';
};

/**
 * Check if a string is a single emoji or just two characters
 * @param {String} str - String to check
 * @returns {Boolean} True if the string is a single emoji or exactly two characters
 */
export const shouldStretch = (str) => {
  if (typeof str !== 'string') return false;
  
  // Check if it's exactly one or two characters
  if (str.length === 2 || str.length === 1) return true;
  
  // Regex to match emoji characters
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
  return emojiRegex.test(str);
};
