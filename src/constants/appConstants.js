/**
 * Application constants for Rando
 */

// Shared constants
export const TEMPLATE_SEPARATOR = '->';  // No spaces

// Constants for URL hash format
export const URL_CONSTANTS = {
  ITEM_SEPARATOR: ',',
  NAME_EXPORT_SEPARATOR: TEMPLATE_SEPARATOR,
  STICKY_PREFIX: '📌'
};

// Constants for UI display
export const UI_CONSTANTS = {
  NAME_EXPORT_SEPARATOR: TEMPLATE_SEPARATOR,
  NAME_EXPORT_SEPARATOR_PATTERN: /^(.+?)->(.+)$/
};
