/**
 * LocalStorageManager - Utility for handling local storage operations
 * 
 * This utility provides functions to:
 * - Save settings to local storage
 * - Load settings from local storage
 * - Clear settings from local storage
 */

// Storage keys
const STORAGE_KEYS = {
  TEMPLATE: 'rando_template',
  ENABLED_ANIMATIONS: 'rando_enabled_animations',
  TAB_SWITCH_ANIMATION: 'rando_tab_switch_animation',
  AUTO_COPY: 'rando_auto_copy',
  ANIMATE_STICKY_CARDS: 'rando_animate_sticky_cards'
};

/**
 * Save template to local storage
 * @param {String} template - Template string
 */
export const saveTemplate = (template) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATE, template);
  } catch (error) {
    console.error('[LocalStorageManager] Error saving template:', error);
  }
};

/**
 * Load template from local storage
 * @returns {String|null} Template string or null if not found
 */
export const loadTemplate = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TEMPLATE);
  } catch (error) {
    console.error('[LocalStorageManager] Error loading template:', error);
    return null;
  }
};

/**
 * Save enabled animations to local storage
 * @param {Object} enabledAnimations - Object with animation names as keys and boolean values
 */
export const saveEnabledAnimations = (enabledAnimations) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ENABLED_ANIMATIONS, JSON.stringify(enabledAnimations));
  } catch (error) {
    console.error('[LocalStorageManager] Error saving enabled animations:', error);
  }
};

/**
 * Load enabled animations from local storage
 * @returns {Object|null} Object with animation names as keys and boolean values, or null if not found
 */
export const loadEnabledAnimations = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.ENABLED_ANIMATIONS);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.error('[LocalStorageManager] Error loading enabled animations:', error);
    return null;
  }
};

/**
 * Save tab switch animation setting to local storage
 * @param {Boolean} enabled - Whether tab switch animation is enabled
 */
export const saveTabSwitchAnimation = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TAB_SWITCH_ANIMATION, JSON.stringify(enabled));
  } catch (error) {
    console.error('[LocalStorageManager] Error saving tab switch animation setting:', error);
  }
};

/**
 * Load tab switch animation setting from local storage
 * @returns {Boolean|null} Whether tab switch animation is enabled, or null if not found
 */
export const loadTabSwitchAnimation = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.TAB_SWITCH_ANIMATION);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.error('[LocalStorageManager] Error loading tab switch animation setting:', error);
    return null;
  }
};

/**
 * Save auto copy setting to local storage
 * @param {Boolean} enabled - Whether auto copy is enabled
 */
export const saveAutoCopy = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_COPY, JSON.stringify(enabled));
  } catch (error) {
    console.error('[LocalStorageManager] Error saving auto copy setting:', error);
  }
};

/**
 * Load auto copy setting from local storage
 * @returns {Boolean|null} Whether auto copy is enabled, or null if not found
 */
export const loadAutoCopy = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.AUTO_COPY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.error('[LocalStorageManager] Error loading auto copy setting:', error);
    return null;
  }
};

/**
 * Save animate sticky cards setting to local storage
 * @param {Boolean} enabled - Whether sticky cards should be animated
 */
export const saveAnimateStickyCards = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ANIMATE_STICKY_CARDS, JSON.stringify(enabled));
  } catch (error) {
    console.error('[LocalStorageManager] Error saving animate sticky cards setting:', error);
  }
};

/**
 * Load animate sticky cards setting from local storage
 * @returns {Boolean|null} Whether sticky cards should be animated, or null if not found
 */
export const loadAnimateStickyCards = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.ANIMATE_STICKY_CARDS);
    return storedValue ? JSON.parse(storedValue) : false; // Default to false (skip animation)
  } catch (error) {
    console.error('[LocalStorageManager] Error loading animate sticky cards setting:', error);
    return false;
  }
};

/**
 * Clear all settings from local storage
 */
export const clearAllSettings = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[LocalStorageManager] Error clearing settings:', error);
  }
};
