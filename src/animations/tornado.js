import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * tornado Animation: Cards form a powerful tornado funnel, swirling at different speeds
 * and heights before settling into their final positions.
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
export function tornado({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[tornado] Animating cards...');

  // Card dimensions from constants
  const cardWidth = BASE_CARD_WIDTH; 
  const cardHeight = BASE_CARD_HEIGHT;

  // Calculate grid center point
  const gridCenterX = gridDimensions.width / 2;
  const gridCenterY = gridDimensions.height / 2;

  // Tornado parameters
  const tornadoHeight = gridDimensions.height * 1.5; // How high the tornado reaches
  const maxRotationRadius = Math.min(gridDimensions.width, gridDimensions.height) * 0.3; // Maximum radius of rotation
  const minRotationRadius = maxRotationRadius * 0.15; // Minimum radius (at the top of the funnel)
  const maxRotations = 3; // Maximum number of rotations during the tornado phase
  const tornadoDuration = 2.5; // Duration of the main tornado phase
  const debrisChance = 0.3; // Chance for a card to become "debris" (temporarily leave the funnel)
  
  // Get cards that should be animated
  const animatableIndices = newOrder.filter(index => shouldAnimateCard(index, sticky));
  
  if (animatableIndices.length === 0) {
    console.log('[tornado] No cards to animate based on settings');
    return;
  }

  // Assign each card a "height level" in the tornado
  // Cards will be distributed throughout the funnel height
  const heightLevels = {};
  animatableIndices.forEach((itemIndex, i) => {
    // Distribute cards evenly throughout the tornado height
    // 0 = bottom of tornado, 1 = top of tornado
    heightLevels[itemIndex] = i / (animatableIndices.length - 1 || 1);
  });

  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[tornado] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[tornado] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Get this card's height level in the tornado
    const heightLevel = heightLevels[itemIndex];
    
    // Calculate tornado parameters for this card
    
    // Radius decreases as height increases (funnel shape)
    const rotationRadius = maxRotationRadius - (heightLevel * (maxRotationRadius - minRotationRadius));
    
    // Rotation speed increases as radius decreases (conservation of angular momentum)
    const rotationSpeed = 1 + (1 - heightLevel) * 0.5; // 1.0 to 1.5x speed multiplier
    
    // Height in the tornado (higher heightLevel = higher in the tornado)
    const tornadoY = currentY - (heightLevel * tornadoHeight);
    
    // Determine if this card will be "debris" (temporarily leave the funnel)
    const isDebris = Math.random() < debrisChance;
    
    // Calculate a random delay for the initial gathering phase
    const gatherDelay = Math.random() * 0.2;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Phase 1: Initial gathering toward the tornado base
    cardTimeline.to(cardElement, {
      x: gridCenterX - cardWidth/2 + (Math.random() - 0.5) * 40, // Slight randomness
      y: gridCenterY + gridDimensions.height * 0.1, // Slightly below center
      rotation: (Math.random() - 0.5) * 30, // Random slight rotation
      scale: 0.8,
      opacity: 0.9,
      duration: 0.4,
      delay: gatherDelay,
      ease: "power1.in",
      force3D: true
    });
    
    // Phase 2: Enter the tornado funnel
    // We'll use a custom function to create circular motion
    const tornadoTimeline = gsap.timeline();
    
    // Start position for the tornado phase
    const startAngle = Math.random() * Math.PI * 2; // Random start angle
    
    // Create the tornado motion
    const numSteps = 20; // Number of steps for smooth tornado motion
    for (let i = 0; i <= numSteps; i++) {
      const progress = i / numSteps;
      
      // Calculate angle based on progress and rotation speed
      const angle = startAngle + (progress * Math.PI * 2 * maxRotations * rotationSpeed);
      
      // Calculate position based on angle and radius
      const x = gridCenterX + Math.cos(angle) * rotationRadius - cardWidth/2;
      const y = tornadoY + (progress * (finalY - tornadoY)); // Gradually descend
      
      // Calculate rotation - cards rotate more as they get closer to the center
      const rotation = 360 * maxRotations * progress * rotationSpeed;
      
      // Calculate scale - cards get slightly smaller at the top of the tornado
      const scale = 0.7 + (1 - heightLevel) * 0.3;
      
      // For debris effect: occasionally deviate from the perfect circle
      let deviationX = 0;
      let deviationY = 0;
      let deviationRotation = 0;
      
      if (isDebris && progress > 0.3 && progress < 0.7) {
        // Apply deviation during the middle of the animation
        const deviationIntensity = Math.sin(progress * Math.PI) * 50; // Peaks in the middle
        deviationX = (Math.random() - 0.5) * deviationIntensity;
        deviationY = (Math.random() - 0.5) * deviationIntensity;
        deviationRotation = (Math.random() - 0.5) * 180; // More chaotic rotation
      }
      
      // Add this step to the tornado timeline
      tornadoTimeline.to(cardElement, {
        x: x + deviationX,
        y: y + deviationY,
        rotation: rotation + deviationRotation,
        scale: scale,
        duration: tornadoDuration / numSteps,
        ease: "none", // Linear steps for smooth circular motion
        force3D: true
      }, i * (tornadoDuration / numSteps));
    }
    
    // Add the tornado timeline to the card timeline
    cardTimeline.add(tornadoTimeline);
    
    // Phase 3: Final settling into position
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: "back.out(1.2)",
      force3D: true
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
