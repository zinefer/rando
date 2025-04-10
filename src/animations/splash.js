import gsap from 'gsap';
import { isSticky } from '../utils/URLManager';

/**
 * splash Animation: Cards spill down like water droplets, spread horizontally,
 * come back together, and splash upward into their final positions.
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
export function splash({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[splash] Animating cards...');

  // Card dimensions
  const cardWidth = 132; 
  const cardHeight = 132;

  // Calculate grid center point
  const gridCenterX = gridDimensions.width / 2;
  const gridCenterY = gridDimensions.height / 2;

  // Splash animation parameters
  const fallDuration = 0.7; // Duration of the initial fall
  const spreadDuration = 0.5; // Duration of horizontal spreading
  const gatherDuration = 0.4; // Duration of coming back together
  const riseDuration = 0.8; // Duration of rising back up
  const settleDuration = 0.5; // Duration of settling into final positions
  
  // Splash positions
  const splashBottomY = gridRect.height - cardHeight; // Bottom of the grid
  const splashCenterX = gridCenterX - cardWidth/2; // Horizontal center
  const maxSpreadWidth = gridDimensions.width * 0.8; // How far cards spread horizontally
  const riseHeight = gridDimensions.height * 0.7; // How high cards rise after splash
  
  // Get non-sticky cards
  const nonStickyIndices = newOrder.filter(index => !isSticky(index, sticky));
  
  if (nonStickyIndices.length === 0) {
    console.log('[splash] No non-sticky cards to animate');
    return;
  }

  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or is sticky
    if (!cardElement || isSticky(itemIndex, sticky)) {
      if (isSticky(itemIndex, sticky)) {
        console.log(`[splash] Card ${itemIndex} is sticky, skipping animation`);
      }
      return;
    }

    console.log(`[splash] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Calculate a random delay for the initial fall
    // This creates a more natural, staggered water droplet effect
    const fallDelay = Math.random() * 0.2;
    
    // Calculate how far this card spreads horizontally
    // Cards should spread out to different distances
    const spreadFactor = (newIndex % 3 - 1) * 0.8 + Math.random() * 0.4; // -0.8 to 0.8 + random
    const spreadX = splashCenterX + (maxSpreadWidth/2) * spreadFactor;
    
    // Calculate how high this card rises in the splash
    // Cards in the center rise higher than those on the edges
    const riseFactor = 1 - Math.abs(spreadFactor) * 0.5; // 0.6 to 1.0
    const riseY = splashBottomY - riseHeight * riseFactor;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Store original styles to restore later
    let originalZIndex;
    
    // Setup function to capture original styles
    cardTimeline.call(() => {
      originalZIndex = cardElement.style.zIndex;
      
      // Increase z-index to ensure card is above others during animation
      cardElement.style.zIndex = 10;
    });
    
    // Phase 1: Initial fall - cards drop to the bottom like water droplets
    cardTimeline.to(cardElement, {
      x: currentX + (Math.random() - 0.5) * 40, // Slight random horizontal movement
      y: splashBottomY,
      rotation: (Math.random() - 0.5) * 20, // Slight random rotation
      scale: 0.9,
      duration: fallDuration,
      delay: fallDelay,
      ease: "bounce.out", // Bounce when hitting the bottom
      force3D: true
    });
    
    // Phase 2: Horizontal spread - cards spread out horizontally
    cardTimeline.to(cardElement, {
      x: spreadX,
      y: splashBottomY + (Math.random() - 0.5) * 10, // Slight vertical variation
      rotation: (Math.random() - 0.5) * 10, // Less rotation during spread
      scale: 0.85 + Math.random() * 0.1, // Slight scale variation
      duration: spreadDuration,
      ease: "power1.out",
      force3D: true
    });
    
    // Phase 3: Gather - cards come back together
    cardTimeline.to(cardElement, {
      x: splashCenterX + (Math.random() - 0.5) * 20, // Slight randomness in gathering
      y: splashBottomY - 10, // Slight upward movement as they gather
      rotation: 0,
      scale: 0.9,
      duration: gatherDuration,
      ease: "power1.in",
      force3D: true
    });
    
    // Phase 4: Rise - cards splash upward
    cardTimeline.to(cardElement, {
      x: splashCenterX + (finalX - splashCenterX) * 0.3, // Start moving toward final x
      y: riseY,
      rotation: (Math.random() - 0.5) * 180, // Spin during rise
      scale: 1.1, // Slightly larger during peak of splash
      duration: riseDuration,
      ease: "power2.out",
      force3D: true
    });
    
    // Create splash droplets at the peak of the rise
    cardTimeline.call(() => {
      if (typeof document !== 'undefined') {
        // Only create droplets for some cards to avoid too many elements
        if (Math.random() < 0.5) {
          // Number of droplets
          const dropletCount = Math.floor(Math.random() * 3) + 1;
          
          for (let i = 0; i < dropletCount; i++) {
            // Create a droplet element
            const droplet = document.createElement('div');
            droplet.id = `splash-droplet-${itemIndex}-${i}`;
            droplet.classList.add('splash-droplet');
            
            // Style the droplet
            droplet.style.position = 'absolute';
            droplet.style.width = '8px';
            droplet.style.height = '8px';
            droplet.style.borderRadius = '50%';
            droplet.style.background = `hsl(${Math.random() * 360}, 70%, 65%)`; // Random color similar to cards
            droplet.style.opacity = '0.8';
            droplet.style.zIndex = '5';
            
            // Position the droplet at the peak of the rise
            const dropletX = splashCenterX + (finalX - splashCenterX) * 0.3 + cardWidth/2;
            const dropletY = riseY + cardHeight/2;
            droplet.style.transform = `translate(${dropletX}px, ${dropletY}px)`;
            
            // Add the droplet to the grid
            cardElement.parentNode.parentNode.appendChild(droplet);
            
            // Animate the droplet in a small arc
            const dropletAngle = Math.random() * Math.PI; // Random angle in top half
            const dropletDistance = 20 + Math.random() * 40; // Random distance
            
            gsap.to(droplet, {
              x: dropletX + Math.cos(dropletAngle) * dropletDistance,
              y: dropletY - Math.sin(dropletAngle) * dropletDistance + 50, // Arc up then down
              scale: 0.5,
              opacity: 0,
              duration: 0.8,
              ease: "power1.out",
              onComplete: () => {
                // Remove the droplet element when animation is complete
                if (droplet.parentNode) {
                  droplet.parentNode.removeChild(droplet);
                }
              }
            });
          }
        }
      }
    }, [], riseDuration * 0.7); // Call this function 70% through the rise phase
    
    // Phase 5: Settle - cards move to their final positions
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: settleDuration,
      ease: "power1.inOut",
      force3D: true
    });
    
    // Create ripple effect when cards settle
    cardTimeline.call(() => {
      if (typeof document !== 'undefined') {
        // Create ripple element
        const ripple = document.createElement('div');
        ripple.classList.add('splash-ripple');
        
        // Style the ripple
        ripple.style.position = 'absolute';
        ripple.style.width = `${cardWidth}px`;
        ripple.style.height = `${cardHeight}px`;
        ripple.style.borderRadius = '0.5rem';
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        ripple.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.3)';
        ripple.style.opacity = '0.7';
        ripple.style.zIndex = '1';
        ripple.style.pointerEvents = 'none';
        
        // Position the ripple at the card's final position
        ripple.style.transform = `translate(${finalX}px, ${finalY}px)`;
        
        // Add the ripple to the grid
        cardElement.parentNode.parentNode.appendChild(ripple);
        
        // Animate the ripple
        gsap.to(ripple, {
          scale: 1.3,
          opacity: 0,
          duration: 0.6,
          ease: "power1.out",
          onComplete: () => {
            // Remove the ripple element when animation is complete
            if (ripple.parentNode) {
              ripple.parentNode.removeChild(ripple);
            }
          }
        });
      }
    }, [], settleDuration * 0.5); // Call this function halfway through the settle phase
    
    // Restore original z-index
    cardTimeline.call(() => {
      cardElement.style.zIndex = originalZIndex || "auto";
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
