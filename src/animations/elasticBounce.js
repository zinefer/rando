import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

// Helper function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * elasticBounce Animation: Cards shrink toward center, then bounce outward with physics before settling.
 * 
 * @param {object} options - Animation options.
 * @param {object} options.elements - Object mapping itemIndex to the card DOM element.
 * @param {Array<number>} options.newOrder - Array where newOrder[newIndex] = oldIndex.
 * @param {Array<{x: number, y: number}>} options.positions - Array of final calculated {x, y} positions for each newIndex.
 * @param {{width: number, height: number}} options.gridDimensions - Dimensions of the grid container.
 * @param {DOMRect} options.gridRect - Bounding client rect of the grid container.
 * @param {Array<number>} options.sticky - Array of sticky item indices (old indices).
 * @param {gsap.core.Timeline} options.timeline - The main GSAP timeline to add tweens to.
 */
export function elasticBounce({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[elasticBounce] Animating cards...');

  // Calculate grid center point
  const gridCenterX = gridDimensions.width / 2;
  const gridCenterY = gridDimensions.height / 2;

  // Get viewport dimensions
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const padding = 20; // Padding from viewport edges

  // Card dimensions from constants
  const cardWidth = BASE_CARD_WIDTH; 
  const cardHeight = BASE_CARD_HEIGHT;

  // Create a stagger effect by grouping cards
  const staggerGroups = 3; // Number of stagger groups
  const cardsPerGroup = Math.ceil(newOrder.length / staggerGroups);
  
  // Assign each card to a stagger group
  const staggerGroupAssignments = {};
  newOrder.forEach((itemIndex, i) => {
    staggerGroupAssignments[itemIndex] = Math.floor(i / cardsPerGroup);
  });

  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[elasticBounce] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[elasticBounce] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Calculate distance from center for bounce intensity
    const distanceFromCenter = Math.sqrt(
      Math.pow((finalX + cardWidth/2) - gridCenterX, 2) + 
      Math.pow((finalY + cardHeight/2) - gridCenterY, 2)
    );
    
    // Normalize distance for animation parameters
    const normalizedDistance = Math.min(distanceFromCenter / (Math.max(gridDimensions.width, gridDimensions.height) / 2), 1);
    
    // Calculate bounce intensity based on distance from center and card content
    // Using the itemIndex to add some variety
    const bounceIntensity = 0.5 + (normalizedDistance * 0.5) + (itemIndex % 5) * 0.1;
    
    // Calculate overshoot based on distance from center
    // Cards further from center will overshoot more
    const overshootX = (finalX - gridCenterX) * bounceIntensity;
    const overshootY = (finalY - gridCenterY) * bounceIntensity;
    
    // Calculate bounce position (with clamping to keep within viewport)
    let bounceX = gridCenterX + overshootX;
    let bounceY = gridCenterY + overshootY;
    
    // Convert to viewport coordinates for clamping
    let bounceViewportX = gridRect.left + bounceX;
    let bounceViewportY = gridRect.top + bounceY;
    
    // Clamp to viewport
    bounceViewportX = clamp(bounceViewportX, padding, viewportW - cardWidth - padding);
    bounceViewportY = clamp(bounceViewportY, padding, viewportH - cardHeight - padding);
    
    // Convert back to grid coordinates
    bounceX = bounceViewportX - gridRect.left;
    bounceY = bounceViewportY - gridRect.top;

    // Get stagger group for this card (0, 1, or 2)
    const staggerGroup = staggerGroupAssignments[itemIndex];
    const staggerDelay = staggerGroup * 0.08; // 80ms between groups
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Phase 1: Gather toward center with slight shrink
    cardTimeline.to(cardElement, {
      x: gridCenterX - cardWidth/2 + (Math.random() - 0.5) * 40, // Add slight randomness
      y: gridCenterY - cardHeight/2 + (Math.random() - 0.5) * 40,
      rotation: 0,
      scale: 0.7,
      duration: 0.4,
      ease: "power2.in",
      delay: staggerDelay,
      force3D: true
    });
    
    // Phase 2: Explode outward with overshoot
    cardTimeline.to(cardElement, {
      x: bounceX,
      y: bounceY,
      rotation: (Math.random() - 0.5) * 30, // Random rotation -15 to 15 degrees
      scale: 1.2, // Slightly larger than normal
      duration: 0.6,
      ease: "power2.out",
      force3D: true
    });
    
    // Phase 3: First bounce back
    cardTimeline.to(cardElement, {
      x: finalX + (bounceX - finalX) * 0.3, // 30% of the way back from bounce position
      y: finalY + (bounceY - finalY) * 0.3,
      rotation: (Math.random() - 0.5) * 15, // Reduced rotation
      scale: 0.9, // Slightly smaller
      duration: 0.3,
      ease: "power1.inOut",
      force3D: true
    });
    
    // Phase 4: Final elastic settle
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: (Math.random() - 0.5) * 5, // Slight final rotation
      scale: 1,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)", // Elastic easing for bouncy finish
      force3D: true,
      onComplete: () => {
        // Log the final position after animation completes
        const finalAnimX = gsap.getProperty(cardElement, "x");
        const finalAnimY = gsap.getProperty(cardElement, "y");
        console.log(`[elasticBounce] Card ${itemIndex} animation completed. Final animated position: X=${finalAnimX}, Y=${finalAnimY}`);
        
        // Check if the final animated position matches the target position
        const diffX = Math.abs(finalAnimX - finalX);
        const diffY = Math.abs(finalAnimY - finalY);
        
        if (diffX > 0.1 || diffY > 0.1) {
          console.warn(`[elasticBounce] Card ${itemIndex} final position mismatch! Target: (${finalX}, ${finalY}), Actual: (${finalAnimX}, ${finalAnimY}), Diff: (${diffX.toFixed(2)}, ${diffY.toFixed(2)})`);
        }
      }
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });

  // Return the main timeline so the caller can attach callbacks
  return timeline;
}
