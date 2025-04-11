import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * melt Animation: Cards liquefy, flow together, and then reform in their new positions
 * with dripping and fluid-like effects.
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
export function melt({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[melt] Animating cards...');

  // Card dimensions from constants
  const cardWidth = BASE_CARD_WIDTH; 
  const cardHeight = BASE_CARD_HEIGHT;

  // Calculate grid center point
  const gridCenterX = gridDimensions.width / 2;
  const gridCenterY = gridDimensions.height / 2;

  // Melt animation parameters
  const meltDuration = 0.7; // Duration of the initial melting phase
  const flowDuration = 0.8; // Duration of the flowing/merging phase
  const reformDuration = 1.0; // Duration of the reformation phase
  const poolY = gridCenterY + gridDimensions.height * 0.3; // Y position of the melted pool
  const maxDripCount = 3; // Maximum number of drips per card
  const dripChance = 0.7; // Chance for a card to have drips
  
  // Get cards that should be animated
  const animatableIndices = newOrder.filter(index => shouldAnimateCard(index, sticky));
  
  if (animatableIndices.length === 0) {
    console.log('[melt] No cards to animate based on settings');
    return;
  }

  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or should not be animated
    if (!cardElement) {
      return;
    }
    
    if (!shouldAnimateCard(itemIndex, sticky)) {
      console.log(`[melt] Card ${itemIndex} skipping animation based on settings`);
      return;
    }

    console.log(`[melt] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Calculate a random delay for staggered melting
    const meltDelay = Math.random() * 0.3;
    
    // Store original styles to restore later
    let originalBorderRadius, originalBoxShadow, originalTransform, originalTransition;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Setup function to capture original styles
    cardTimeline.call(() => {
      originalBorderRadius = cardElement.style.borderRadius;
      originalBoxShadow = cardElement.style.boxShadow;
      originalTransform = cardElement.style.transform;
      originalTransition = cardElement.style.transition;
      
      // Ensure no transition interference
      cardElement.style.transition = 'none';
    });
    
    // Phase 1: Initial softening/melting
    // Cards start to lose their shape, bulge at the bottom
    cardTimeline.to(cardElement, {
      borderRadius: '30% 30% 50% 50% / 30% 30% 70% 70%', // Bulge at bottom
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)', // Softer shadow
      scaleY: 1.1, // Stretch vertically a bit
      scaleX: 0.9, // Compress horizontally a bit
      y: currentY + 10, // Slight downward movement
      duration: meltDuration * 0.5,
      delay: meltDelay,
      ease: "power2.in",
      force3D: true
    });
    
    // Create drips if chance allows
    if (Math.random() < dripChance) {
      cardTimeline.call(() => {
        if (typeof document !== 'undefined') {
          // Number of drips for this card
          const dripCount = Math.floor(Math.random() * maxDripCount) + 1;
          
          for (let i = 0; i < dripCount; i++) {
            // Create a drip element
            const drip = document.createElement('div');
            drip.id = `drip-${itemIndex}-${i}`;
            drip.classList.add('card-drip');
            
            // Style the drip
            drip.style.position = 'absolute';
            drip.style.width = '10px';
            drip.style.height = '10px';
            drip.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%'; // Teardrop shape
            drip.style.background = `hsl(${Math.random() * 360}, 70%, 65%)`; // Random color similar to cards
            drip.style.opacity = '0.8';
            drip.style.zIndex = '5';
            
            // Position the drip at the bottom of the card
            const dripX = currentX + 20 + Math.random() * (cardWidth - 40); // Random position along bottom edge
            const dripY = currentY + cardHeight - 5;
            drip.style.transform = `translate(${dripX}px, ${dripY}px)`;
            
            // Add the drip to the grid
            cardElement.parentNode.parentNode.appendChild(drip);
            
            // Animate the drip falling
            gsap.to(drip, {
              y: dripY + 50 + Math.random() * 100, // Fall a random distance
              scaleY: 1.5 + Math.random(), // Stretch as it falls
              scaleX: 0.7, // Narrow as it falls
              opacity: 0, // Fade out
              duration: 1 + Math.random() * 0.5,
              delay: 0.2 + i * 0.1 + Math.random() * 0.2, // Staggered delay
              ease: "power1.in",
              onComplete: () => {
                // Remove the drip element when animation is complete
                if (drip.parentNode) {
                  drip.parentNode.removeChild(drip);
                }
              }
            });
          }
        }
      });
    }
    
    // Phase 2: Complete melting and flowing to the pool
    cardTimeline.to(cardElement, {
      y: poolY, // Move to the pool position
      x: gridCenterX - cardWidth/2 + (Math.random() - 0.5) * 60, // Random position in the pool
      borderRadius: '40% 40% 60% 60% / 30% 30% 70% 70%', // More extreme melting
      scaleY: 0.6, // Flatten vertically
      scaleX: 1.1, // Expand horizontally
      rotation: (Math.random() - 0.5) * 15, // Slight random rotation
      opacity: 0.8, // Slightly transparent
      duration: meltDuration,
      ease: "power2.in",
      force3D: true
    });
    
    // Phase 3: Merging in the pool
    // Cards lose more of their identity and merge together
    cardTimeline.to(cardElement, {
      borderRadius: '50%', // Become more blob-like
      boxShadow: '0 5px 10px rgba(0, 0, 0, 0.15)', // Even softer shadow
      scaleY: 0.4 + Math.random() * 0.2, // Random squishing
      scaleX: 1.2 + Math.random() * 0.3, // Random spreading
      x: gridCenterX - cardWidth/2 + (Math.random() - 0.5) * 30, // Tighter grouping in pool
      rotation: (Math.random() - 0.5) * 10, // Less rotation in the pool
      opacity: 0.7, // More transparent in the merged state
      duration: flowDuration * 0.6,
      ease: "power1.inOut",
      force3D: true
    });
    
    // Phase 4: Start of reformation - cards begin to separate and move toward final positions
    cardTimeline.to(cardElement, {
      x: finalX + (Math.random() - 0.5) * 20, // Near final position with slight randomness
      y: finalY + 20, // Slightly below final position
      borderRadius: '20% 20% 30% 30% / 20% 20% 40% 40%', // Starting to reform
      scaleY: 0.8, // Stretching back vertically
      scaleX: 0.9, // Compressing horizontally
      rotation: (Math.random() - 0.5) * 5, // Minimal rotation
      opacity: 0.9, // More opaque as it reforms
      duration: reformDuration * 0.6,
      ease: "power1.out",
      force3D: true
    });
    
    // Phase 5: Final reformation - cards snap back to their original shape
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      borderRadius: originalBorderRadius || '0.5rem', // Back to original shape
      boxShadow: originalBoxShadow || '0 0 15px rgba(0, 0, 0, 0.3)',
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: reformDuration * 0.4,
      ease: "elastic.out(1, 0.7)", // Elastic snap back
      force3D: true
    });
    
    // Add ripple effect at the end
    cardTimeline.call(() => {
      if (typeof document !== 'undefined') {
        // Create ripple element
        const ripple = document.createElement('div');
        ripple.classList.add('card-ripple');
        
        // Style the ripple
        ripple.style.position = 'absolute';
        ripple.style.width = `${cardWidth + 10}px`;
        ripple.style.height = `${cardHeight + 10}px`;
        ripple.style.borderRadius = originalBorderRadius || '0.5rem';
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.7)';
        ripple.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        ripple.style.opacity = '0.7';
        ripple.style.zIndex = '1';
        ripple.style.pointerEvents = 'none';
        
        // Position the ripple at the card's final position
        ripple.style.transform = `translate(${finalX - 5}px, ${finalY - 5}px)`;
        
        // Add the ripple to the grid
        cardElement.parentNode.parentNode.appendChild(ripple);
        
        // Animate the ripple
        gsap.to(ripple, {
          scale: 1.2,
          opacity: 0,
          duration: 0.5,
          ease: "power1.out",
          onComplete: () => {
            // Remove the ripple element when animation is complete
            if (ripple.parentNode) {
              ripple.parentNode.removeChild(ripple);
            }
          }
        });
      }
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
