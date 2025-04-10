/**
 * AnimationHelper - Utility for handling animation-related functionality
 * 
 * This utility provides functions to:
 * - Determine if a card should be animated based on its sticky status and user settings
 */

import { isSticky } from './URLManager';
import { loadAnimateStickyCards } from './LocalStorageManager';

/**
 * Check if a card should be animated based on its sticky status and user settings
 * @param {Number} itemIndex - Index of the item
 * @param {Array} sticky - Array of sticky indices
 * @returns {Boolean} True if the card should be animated
 */
export const shouldAnimateCard = (itemIndex, sticky = []) => {
  // If the card is not sticky, it should always be animated
  if (!isSticky(itemIndex, sticky)) {
    return true;
  }
  
  // If the card is sticky, check the user setting
  return loadAnimateStickyCards();
};
