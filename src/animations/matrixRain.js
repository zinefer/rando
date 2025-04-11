import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

// Helper function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * matrixRain Animation: Cards fall from top like digital rain with wave motion and glow effects.
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
export function matrixRain({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[matrixRain] Animating cards...');

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

  // Matrix rain parameters
  const maxFallHeight = -gridDimensions.height; // Start above the grid
  const waveAmplitude = 50; // Amplitude of the wave motion
  const waveFrequency = 2; // Frequency of the wave
  
  // Create column assignments for cards (to create a matrix-like column effect)
  const numColumns = Math.ceil(Math.sqrt(newOrder.length)); // Roughly square grid of columns
  const columnAssignments = {};
  
  // Assign each card to a column
  newOrder.forEach((itemIndex, i) => {
    columnAssignments[itemIndex] = i % numColumns;
  });
  
  // Create a map of final x positions for each column
  const columnXPositions = {};
  for (let i = 0; i < numColumns; i++) {
    // Distribute columns evenly across the grid width
    columnXPositions[i] = (i + 0.5) * (gridDimensions.width / numColumns) - cardWidth/2;
  }

  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[matrixRain] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[matrixRain] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Get the column for this card
    const column = columnAssignments[itemIndex];
    
    // Calculate the x position for the falling animation based on the column
    const fallX = columnXPositions[column];
    
    // Calculate a delay based on column and a random factor
    // This creates the cascading effect of the matrix rain
    const baseDelay = column * 0.1; // Base delay by column
    const randomDelay = Math.random() * 0.3; // Random component
    const delay = baseDelay + randomDelay;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Store the original border and box-shadow to restore later
    let originalBorder, originalBoxShadow;
    
    // Setup function to capture original styles and add glow effect
    cardTimeline.call(() => {
      // Capture original styles
      originalBorder = cardElement.style.border;
      originalBoxShadow = cardElement.style.boxShadow;
      
      // Add matrix-like glow effect
      cardElement.style.boxShadow = "0 0 15px rgba(0, 255, 70, 0.7)";
      cardElement.style.border = "1px solid rgba(0, 255, 70, 0.9)";
    });
    
    // Phase 1: Move to top of column with slight scale down
    cardTimeline.to(cardElement, {
      x: fallX,
      y: maxFallHeight,
      rotation: 0,
      scale: 0.8,
      opacity: 0.7,
      duration: 0.01, // Almost instant
      delay: delay,
      force3D: true
    });
    
    // Phase 2: Fall down with wave motion
    // We'll use a custom ease function to create the wave effect
    cardTimeline.to(cardElement, {
      x: (i, target) => {
        // Create a wave motion by oscillating around the column x position
        // The wave amplitude decreases as the card falls further
        const progress = gsap.getProperty(target, "y") / finalY; // 0 to 1 as it falls
        const waveEffect = Math.sin(progress * waveFrequency * Math.PI) * waveAmplitude * (1 - progress);
        return fallX + waveEffect;
      },
      y: finalY,
      rotation: () => (Math.random() - 0.5) * 20, // Random slight rotation
      scale: 1,
      opacity: 1,
      duration: 1.5,
      ease: "power2.in",
      force3D: true
    });
    
    // Phase 3: Settle into final position with bounce
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
      force3D: true
    });
    
    // Restore original styles
    cardTimeline.call(() => {
      // Gradually fade out the glow effect
      gsap.to(cardElement, {
        boxShadow: originalBoxShadow || "0 0 15px rgba(0, 0, 0, 0.3)",
        border: originalBorder || "1px solid rgba(107, 114, 128, 0.7)",
        duration: 0.5
      });
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
