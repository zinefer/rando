import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

// Helper function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * flyAndSpin Animation: Makes cards fly out wildly before settling.
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
export function flyAndSpin({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[flyAndSpin] Animating cards...');

  // Get viewport dimensions (consider scrollbar width if necessary)
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const padding = 50; // Padding from viewport edges

  // Card dimensions from constants
  const cardWidth = BASE_CARD_WIDTH; 
  const cardHeight = BASE_CARD_HEIGHT; 

  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[flyAndSpin] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[flyAndSpin] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    console.log(`[flyAndSpin] Card ${itemIndex} - Current Grid Pos:`, { currentX, currentY });

    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0; // Use nullish coalescing for safety
    const finalY = positions[newIndex]?.y ?? 0;
    console.log(`[flyAndSpin] Card ${itemIndex} - Final Grid Pos:`, { finalX, finalY });

    // --- Calculate Fly-Out Positions with Clamping ---

    // Calculate minimum distance to move relative to grid size
    const minDistanceX = gridDimensions.width * 0.5; // Reduced intensity slightly
    const minDistanceY = gridDimensions.height * 0.5;

    // Generate random direction (1 or -1)
    const directionX = Math.random() > 0.5 ? 1 : -1;
    const directionY = Math.random() > 0.5 ? 1 : -1;

    // Calculate a random target position relative to the grid
    let randomGridX = currentX + (directionX * (minDistanceX + Math.random() * gridDimensions.width * 0.3));
    let randomGridY = currentY + (directionY * (minDistanceY + Math.random() * gridDimensions.height * 0.3));

    // Convert random grid position to absolute viewport position
    let randomViewportX = gridRect.left + randomGridX;
    let randomViewportY = gridRect.top + randomGridY;

    // Clamp the absolute viewport position
    randomViewportX = clamp(randomViewportX, padding, viewportW - cardWidth - padding);
    randomViewportY = clamp(randomViewportY, padding, viewportH - cardHeight - padding);

    // Convert clamped viewport position back to grid-relative position for GSAP
    const clampedRandomGridX = randomViewportX - gridRect.left;
    const clampedRandomGridY = randomViewportY - gridRect.top;
    console.log(`[flyAndSpin] Card ${itemIndex} - Clamped Random Pos:`, { x: clampedRandomGridX, y: clampedRandomGridY });

    // Calculate intermediate position (relative to grid) and clamp it similarly
    let intermediateGridX = (clampedRandomGridX + finalX) / 2 + gsap.utils.random(-100, 100);
    let intermediateGridY = (clampedRandomGridY + finalY) / 2 + gsap.utils.random(-100, 100);

    let intermediateViewportX = gridRect.left + intermediateGridX;
    let intermediateViewportY = gridRect.top + intermediateGridY;

    intermediateViewportX = clamp(intermediateViewportX, padding, viewportW - cardWidth - padding);
    intermediateViewportY = clamp(intermediateViewportY, padding, viewportH - cardHeight - padding);

    const clampedIntermediateGridX = intermediateViewportX - gridRect.left;
    const clampedIntermediateGridY = intermediateViewportY - gridRect.top;
    console.log(`[flyAndSpin] Card ${itemIndex} - Clamped Intermediate Pos:`, { x: clampedIntermediateGridX, y: clampedIntermediateGridY });


    // --- Create GSAP Timeline for this card ---
    const cardTimeline = gsap.timeline();

    // Wind-up animation
    cardTimeline.to(cardElement, {
      x: currentX - (directionX * 20), // Relative to grid
      y: currentY - (directionY * 20), // Relative to grid
      rotation: -directionX * 10,
      scale: 0.9,
      duration: 0.2,
      ease: 'power1.out',
      force3D: true
    });

    // Fly-out animation (to clamped random position)
    cardTimeline.to(cardElement, {
      x: clampedRandomGridX, // Relative to grid
      y: clampedRandomGridY, // Relative to grid
      rotation: directionX * (90 + Math.random() * 180),
      scale: gsap.utils.random(0.6, 1.4),
      duration: 0.8,
      ease: 'power2.out',
      force3D: true
    });

    // Intermediate position (clamped)
    cardTimeline.to(cardElement, {
      x: clampedIntermediateGridX, // Relative to grid
      y: clampedIntermediateGridY, // Relative to grid
      rotation: directionX * 45,
      duration: 0.4,
      ease: 'power1.inOut',
      force3D: true
    });

    // Final position
    cardTimeline.to(cardElement, {
      x: finalX, // Relative to grid
      y: finalY, // Relative to grid
      rotation: gsap.utils.random(-8, 8),
      scale: 1,
      duration: 1.2,
      ease: 'elastic.out(1, 0.7)',
      force3D: true
    });

    // Add this card's timeline to the main timeline, starting at time 0
    timeline.add(cardTimeline, 0);
  });
}
