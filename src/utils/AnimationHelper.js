/**
 * AnimationHelper - Utility for handling animation-related functionality
 * 
 * This utility provides functions to:
 * - Determine if a card should be animated based on its sticky status and user settings
 * - Control the overflow property of the card grid for animations
 */

import { isSticky } from './URLManager';
import { loadAnimateStickyCards } from './LocalStorageManager';

// Track the overflow state of the card grid (true = visible, false = hidden)
let cardGridOverflowVisible = false;

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

/**
 * Set the overflow property on the card grid
 * @param {Boolean} makeVisible - Whether to make overflow visible (true) or hidden (false)
 * @returns {Boolean} The new overflow state (true = visible, false = hidden)
 */
export const setCardGridOverflow = (makeVisible) => {
  const cardGrid = document.getElementById('card-grid');
  if (cardGrid) {
    if (makeVisible) {
      cardGrid.style.overflow = 'visible';
      cardGridOverflowVisible = true;
    } else {
      cardGrid.style.overflow = 'hidden';
      cardGridOverflowVisible = false;
    }
  }
  return cardGridOverflowVisible;
};

/**
 * Get the current overflow state of the card grid
 * @returns {Boolean} True if overflow is visible, false if overflow is hidden
 */
export const isCardGridOverflowVisible = () => {
  return cardGridOverflowVisible;
};

/**
 * Helper function to manage overflow for animations
 * @param {Function} callback - The animation function to run
 * @param {Boolean} overflow - Whether this animation needs overflow visible (true) or hidden (false)
 * @param {Object} options - Animation options to pass to the callback
 * @returns {gsap.core.Timeline} The animation timeline
 */
export const runAnimationWithOverflowControl = (callback, overflow, options) => {
  // Save the previous overflow state
  const previousState = cardGridOverflowVisible;
  
  // Set overflow based on animation needs
  setCardGridOverflow(overflow);
  
  // Check if options contains a timeline
  const timeline = options && options.timeline;
  
  // Run the animation (which adds to the timeline but doesn't return it)
  callback(options);
  
  // Add an onComplete callback to restore overflow if needed
  if (timeline) {
    const existingOnComplete = timeline.eventCallback('onComplete');
    
    timeline.eventCallback('onComplete', () => {
      // Call the existing onComplete if there is one
      if (existingOnComplete) {
        existingOnComplete();
      }
      
      // Restore previous overflow state
      setCardGridOverflow(previousState);
    });
  }
  
  // Return the timeline for backward compatibility
  return timeline;
};
