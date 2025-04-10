import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * fireworks Animation: Cards gather in the center, then explode outward like fireworks
 * with trails and secondary explosions before settling into their final positions.
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
export function fireworks({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[fireworks] Animating cards...');

  // Card dimensions from constants
  const cardWidth = BASE_CARD_WIDTH; 
  const cardHeight = BASE_CARD_HEIGHT;

  // Calculate grid center point
  const gridCenterX = gridDimensions.width / 2;
  const gridCenterY = gridDimensions.height / 2;

  // Fireworks parameters
  const launchDuration = 0.3; // Duration of the initial gathering phase
  const explosionDuration = 0.7; // Duration of the main explosion
  const settleDuration = 1.0; // Duration of the final settling phase
  const maxExplosionHeight = gridDimensions.height * 0.8; // Maximum height of explosion
  const secondaryExplosionChance = 0.3; // Chance for a card to have a secondary explosion
  const trailCount = 3; // Number of trail elements to create for each card
  
  // Get non-sticky cards
  const nonStickyIndices = newOrder.filter(index => true);
  
  if (nonStickyIndices.length === 0) {
    console.log('[fireworks] No non-sticky cards to animate');
    return;
  }

  // Group cards into "firework clusters"
  // Each cluster will explode at a slightly different time
  const clusterCount = Math.min(4, Math.ceil(nonStickyIndices.length / 3));
  const clusters = Array(clusterCount).fill().map(() => []);
  
  // Distribute cards among clusters
  nonStickyIndices.forEach((itemIndex, i) => {
    const clusterIndex = i % clusterCount;
    clusters[clusterIndex].push(itemIndex);
  });
  
  // Create a mapping of which card goes to which position
  const cardDestinations = {};
  newOrder.forEach((oldIndex, newIndex) => {
    cardDestinations[oldIndex] = newIndex;
  });

  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[fireworks] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[fireworks] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Find which cluster this card belongs to
    const clusterIndex = clusters.findIndex(cluster => cluster.includes(itemIndex));
    
    // Calculate delay based on cluster
    const clusterDelay = clusterIndex * 0.15; // 150ms between cluster explosions
    
    // Determine if this card will have a secondary explosion
    const hasSecondaryExplosion = Math.random() < secondaryExplosionChance;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Store original styles to restore later
    let originalBoxShadow, originalZIndex;
    
    // Setup function to capture original styles
    cardTimeline.call(() => {
      originalBoxShadow = cardElement.style.boxShadow;
      originalZIndex = cardElement.style.zIndex;
      
      // Increase z-index to ensure card is above others during animation
      cardElement.style.zIndex = 10;
    });
    
    // Phase 1: Initial gathering toward the launch point (center-bottom of grid)
    const launchX = gridCenterX - cardWidth/2 + (Math.random() - 0.5) * 30; // Slight randomness
    const launchY = gridCenterY + gridDimensions.height * 0.2; // Below center
    
    cardTimeline.to(cardElement, {
      x: launchX,
      y: launchY,
      rotation: 0,
      scale: 0.7,
      duration: launchDuration,
      delay: clusterDelay,
      ease: "power1.in",
      force3D: true
    });
    
    // Phase 2: Create "trail" effect by cloning the card and animating the clones
    cardTimeline.call(() => {
      // Only create trails if we're in a browser environment
      if (typeof document !== 'undefined') {
        // Create trail elements
        for (let i = 0; i < trailCount; i++) {
          const trail = cardElement.cloneNode(true);
          trail.style.position = 'absolute';
          trail.style.opacity = 0.5 - (i * 0.15); // Decreasing opacity for each trail
          trail.style.transform = `translate(${launchX}px, ${launchY}px) scale(0.7)`;
          trail.style.pointerEvents = 'none'; // Make sure trails don't interfere with interactions
          trail.id = `trail-${itemIndex}-${i}`;
          trail.classList.add('card-trail');
          
          // Add the trail to the grid
          cardElement.parentNode.parentNode.appendChild(trail);
          
          // Animate the trail with a delay
          gsap.to(trail, {
            x: launchX + (Math.random() - 0.5) * 100, // Random x offset
            y: launchY - Math.random() * maxExplosionHeight * 0.7, // Random height, but not as high as the main card
            rotation: (Math.random() - 0.5) * 360, // Random rotation
            scale: 0.5 - (i * 0.1), // Decreasing scale for each trail
            opacity: 0,
            duration: explosionDuration * 0.8,
            delay: 0.1 * i, // Staggered delay for each trail
            ease: "power1.out",
            onComplete: () => {
              // Remove the trail element when animation is complete
              trail.parentNode.removeChild(trail);
            }
          });
        }
      }
    });
    
    // Phase 3: Main explosion - card shoots upward and outward
    // Calculate a random angle for the explosion
    const explosionAngle = Math.random() * Math.PI; // Semi-circle (upward directions)
    const explosionDistance = Math.random() * gridDimensions.width * 0.4 + gridDimensions.width * 0.2;
    
    // Calculate explosion target position
    const explosionX = launchX + Math.cos(explosionAngle) * explosionDistance;
    const explosionY = launchY - Math.sin(explosionAngle) * maxExplosionHeight; // Negative y is upward
    
    // Add glow effect during explosion
    cardTimeline.to(cardElement, {
      boxShadow: `0 0 20px rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`,
      duration: 0.2,
      ease: "power1.in"
    }, "-=0.1"); // Overlap with previous animation
    
    // Main explosion animation
    cardTimeline.to(cardElement, {
      x: explosionX,
      y: explosionY,
      rotation: (Math.random() - 0.5) * 720, // 2 full rotations in either direction
      scale: 1.2, // Slightly larger during explosion
      duration: explosionDuration,
      ease: "power2.out",
      force3D: true
    });
    
    // Phase 4: Secondary explosion (for some cards)
    if (hasSecondaryExplosion) {
      // Calculate secondary explosion position
      const secondaryAngle = explosionAngle + (Math.random() - 0.5) * Math.PI/2; // Variation from original angle
      const secondaryDistance = explosionDistance * 0.5;
      const secondaryX = explosionX + Math.cos(secondaryAngle) * secondaryDistance;
      const secondaryY = explosionY - Math.sin(secondaryAngle) * secondaryDistance;
      
      // Secondary explosion animation
      cardTimeline.to(cardElement, {
        x: secondaryX,
        y: secondaryY,
        rotation: `+=${(Math.random() - 0.5) * 360}`, // Additional rotation
        scale: 1.1,
        duration: explosionDuration * 0.6,
        ease: "power1.inOut",
        force3D: true
      });
      
      // Create mini-trails for secondary explosion
      cardTimeline.call(() => {
        if (typeof document !== 'undefined') {
          // Create mini-trail elements
          for (let i = 0; i < 2; i++) {
            const miniTrail = cardElement.cloneNode(true);
            miniTrail.style.position = 'absolute';
            miniTrail.style.opacity = 0.3;
            miniTrail.style.transform = `translate(${secondaryX}px, ${secondaryY}px) scale(0.6)`;
            miniTrail.style.pointerEvents = 'none';
            miniTrail.id = `mini-trail-${itemIndex}-${i}`;
            miniTrail.classList.add('card-mini-trail');
            
            // Add the mini-trail to the grid
            cardElement.parentNode.parentNode.appendChild(miniTrail);
            
            // Animate the mini-trail
            gsap.to(miniTrail, {
              x: secondaryX + (Math.random() - 0.5) * 50,
              y: secondaryY + (Math.random() - 0.5) * 50,
              rotation: (Math.random() - 0.5) * 180,
              scale: 0.3,
              opacity: 0,
              duration: 0.4,
              delay: 0.05 * i,
              ease: "power1.out",
              onComplete: () => {
                // Remove the mini-trail element when animation is complete
                miniTrail.parentNode.removeChild(miniTrail);
              }
            });
          }
        }
      });
    }
    
    // Phase 5: Floating down to final position
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      boxShadow: originalBoxShadow || "0 0 15px rgba(0, 0, 0, 0.3)",
      duration: settleDuration,
      ease: "power2.inOut",
      force3D: true
    });
    
    // Restore original z-index
    cardTimeline.call(() => {
      cardElement.style.zIndex = originalZIndex || "auto";
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
