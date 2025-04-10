import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

// Helper function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * swirlVortex Animation: Cards swirl in a vortex pattern before settling into position.
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
export function swirlVortex({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[swirlVortex] Animating cards...');

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

  // Vortex parameters
  const maxRadius = Math.min(gridDimensions.width, gridDimensions.height) * 0.4;
  const spiralTightness = 0.8; // How tight the spiral is (higher = tighter)
  const maxRotations = 1.5; // Maximum number of rotations in the spiral

  // Create a stagger effect
  const totalDuration = 2.5; // Total animation duration
  const maxDelay = 0.4; // Maximum stagger delay

  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[swirlVortex] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[swirlVortex] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Calculate normalized position for this card (0-1 range)
    // This will determine how far around the spiral it goes
    const normalizedIndex = newIndex / newOrder.length;
    
    // Calculate a unique delay for each card based on its position in the spiral
    // Cards that need to travel further get a head start
    const delay = normalizedIndex * maxDelay;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Initial gather toward center with slight shrink
    cardTimeline.to(cardElement, {
      x: gridCenterX - cardWidth/2 + (Math.random() - 0.5) * 20, // Slight randomness
      y: gridCenterY - cardHeight/2 + (Math.random() - 0.5) * 20,
      rotation: 0,
      scale: 0.7,
      duration: 0.3,
      ease: "power1.in",
      delay: delay,
      force3D: true
    });
    
    // Generate spiral path points
    const spiralPoints = [];
    const numPoints = 12; // Number of points in the spiral path
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1); // 0 to 1
      
      // Spiral equation: r = a + b*theta
      // We'll use a parametric version where radius grows with t
      const theta = t * maxRotations * 2 * Math.PI;
      const radius = t * maxRadius * spiralTightness;
      
      // Convert polar to cartesian coordinates
      const x = gridCenterX + radius * Math.cos(theta) - cardWidth/2;
      const y = gridCenterY + radius * Math.sin(theta) - cardHeight/2;
      
      // Add some randomness to make it more organic
      const jitter = 10 * (1 - t); // Jitter decreases as we approach the end
      const pointX = x + (Math.random() - 0.5) * jitter;
      const pointY = y + (Math.random() - 0.5) * jitter;
      
      spiralPoints.push({ x: pointX, y: pointY });
    }
    
    // Add the final position as the last point
    spiralPoints.push({ x: finalX, y: finalY });
    
    // Create the spiral motion
    const spiralDuration = 1.5;
    const pointDuration = spiralDuration / spiralPoints.length;
    
    // Add each point as a separate tween for smooth motion along the spiral
    spiralPoints.forEach((point, i) => {
      // Calculate rotation based on position in spiral
      // More rotation at the beginning, less at the end
      const rotationAmount = 360 * (1 - i / spiralPoints.length) * (Math.random() > 0.5 ? 1 : -1);
      
      // Scale varies along the path - larger in the middle, normal at the end
      const scaleAmount = i === spiralPoints.length - 1 
        ? 1 // Final position has normal scale
        : 0.7 + 0.5 * Math.sin(i / spiralPoints.length * Math.PI); // Varies from 0.7 to 1.2 and back
      
      cardTimeline.to(cardElement, {
        x: point.x,
        y: point.y,
        rotation: rotationAmount,
        scale: scaleAmount,
        duration: pointDuration,
        ease: i === spiralPoints.length - 1 ? "elastic.out(1, 0.7)" : "power1.inOut",
        force3D: true
      });
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
