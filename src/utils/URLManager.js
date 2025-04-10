/**
 * URLManager - Utility for handling URL parameters for the Rando application
 * 
 * This utility provides functions to:
 * - Parse items from the URL
 * - Update the URL with new items
 * - Handle sticky items
 * - Manage template settings
 */

/**
 * Parse items from the URL
 * @returns {Object} Object containing items, sticky indices, and template
 */
export const parseURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  
  // Get items from URL or use default empty array
  const itemsParam = params.get('items') || '';
  const items = itemsParam ? decodeURIComponent(itemsParam).split(',') : [];
  
  // Get sticky indices from URL or use default empty array
  const stickyParam = params.get('sticky') || '';
  const sticky = stickyParam ? stickyParam.split(',').map(Number) : [];
  
  // Get template from URL or use default
  const template = params.get('template') || '{item}';
  
  return { items, sticky, template };
};

/**
 * Update the URL with new parameters
 * @param {Array} items - List of items
 * @param {Array} sticky - Indices of sticky items
 * @param {String} template - Template for clipboard copy
 */
export const updateURL = (items, sticky = [], template = '{item}') => {
  const params = new URLSearchParams();
  
  // Only add parameters if they have values
  if (items.length > 0) {
    params.set('items', encodeURIComponent(items.join(',')));
  }
  
  if (sticky.length > 0) {
    params.set('sticky', sticky.join(','));
  }
  
  if (template !== '{item}') {
    params.set('template', template);
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
 * Format items using the template
 * @param {Array} items - List of items
 * @param {String} template - Template string
 * @returns {String} Formatted string
 */
export const formatWithTemplate = (items, template = '{item}') => {
  return items.map(item => template.replace('{item}', item)).join('\n');
};
