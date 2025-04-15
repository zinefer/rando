import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';

/**
 * FallAndReveal: Cards rotate from bottom edge, tipping backward until flat, then new cards rotate up
 * with staggered timing either in a wave pattern or random delays
 * 
 * @param {object} options - Animation options
 * @param {object} options.elements - Object mapping itemIndex to the card DOM element
 * @param {Array<number>} options.newOrder - Array where newOrder[newIndex] = oldIndex
 * @param {Array<{x: number, y: number}>} options.positions - Array of final calculated {x, y} positions
 * @param {{width: number, height: number}} options.gridDimensions - Dimensions of the grid container
 * @param {DOMRect} options.gridRect - Bounding client rect of the grid container
 * @param {Array<number>} options.sticky - Array of sticky item indices (old indices)
 * @param {gsap.core.Timeline} options.timeline - The main GSAP timeline to add tweens to
 */
export function fallAndReveal({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[fallAndReveal] Animating cards with 3D fall and reveal effect...');

  // Animation durations
  const fallDuration = 0.8;
  const revealDelay = 0.1;
  const revealDuration = 0.9;
  const staggerAmount = 0.07; // Time between each card's animation
  
  // Add perspective to the grid container
  const gridContainer = Object.values(elements)[0]?.parentElement;
  if (gridContainer) {
    gsap.set(gridContainer, { 
      perspective: 1200,
    });
  }
  
  // Get current positions of all cards before animation starts
  const currentPositions = {};
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    if (cardElement) {
      // Get current transform
      const transform = window.getComputedStyle(cardElement).transform;
      const matrix = new DOMMatrix(transform);
      
      currentPositions[itemIndex] = {
        x: matrix.e,
        y: matrix.f
      };
    }
  });

  // Flip a coin to decide between wave pattern or random delays
  const useWavePattern = Math.random() > 0.5;
  console.log(`[fallAndReveal] Using ${useWavePattern ? 'wave pattern' : 'random delays'} for staggering`);
  
  // Prepare card indices for animation ordering
  let sortedCards;
  if (useWavePattern) {
    // For wave pattern, sort by X position (left to right)
    sortedCards = newOrder.map((oldIndex, newIndex) => ({oldIndex, newIndex}))
      .sort((a, b) => {
        const posA = positions[a.newIndex];
        const posB = positions[b.newIndex];
        return posA.x - posB.x;
      });
  } else {
    // For random pattern, just shuffle the indices
    sortedCards = newOrder.map((oldIndex, newIndex) => ({oldIndex, newIndex}))
      .sort(() => Math.random() - 0.5);
  }

  // First part: cards tip backward and fade out with staggered timing
  sortedCards.forEach(({oldIndex, newIndex}, i) => {
    const cardElement = elements[oldIndex];
    
    // Skip if element doesn't exist or should not be animated
    if (!cardElement || !shouldAnimateCard(oldIndex, sticky)) {
      return;
    }

    // Get current position
    const currentX = currentPositions[oldIndex]?.x ?? 0;
    const currentY = currentPositions[oldIndex]?.y ?? 0;
    
    // Calculate stagger time
    const staggerTime = i * staggerAmount;
    
    // Ensure card has transform-style for 3D effect and set origin to bottom
    gsap.set(cardElement, { 
      transformStyle: "preserve-3d",
      backfaceVisibility: "hidden",
      transformOrigin: "bottom center"
    });
    
    // Tip backward until flat (90 degrees) with ease-in for slow start, fast finish
    timeline.to(cardElement, {
      rotationX: 90,
      opacity: 0,
      duration: fallDuration,
      ease: "power2.in",
      force3D: true,
    }, staggerTime); // Start time is staggered
  });

  // Second part: new cards rotate up from flat position with staggered timing
  sortedCards.forEach(({oldIndex, newIndex}, i) => {
    const cardElement = elements[oldIndex];
    
    // Skip if element doesn't exist or should not be animated
    if (!cardElement || !shouldAnimateCard(oldIndex, sticky)) {
      return;
    }

    // Get final position from calculated positions
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;
    
    // Calculate stagger time
    const staggerTime = i * staggerAmount;
    const totalDelay = fallDuration + revealDelay + staggerTime;

    // Set the initial state for reveal - positioned but flat on "table" (with full opacity)
    timeline.set(cardElement, {
      x: finalX,
      y: finalY,
      rotationX: 90,
      opacity: 1,
      transformStyle: "preserve-3d",
      backfaceVisibility: "hidden",
      transformOrigin: "bottom center"
    }, totalDelay - 0.1); // Just before the reveal animation
    
    // Rotate up from flat position (no opacity change)
    timeline.to(cardElement, {
      rotationX: 0,
      duration: revealDuration,
      ease: "power2.in", // Slow start, quick end
      force3D: true
    }, totalDelay);
  });
}
