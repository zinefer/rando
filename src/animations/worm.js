import gsap from 'gsap';
import { isSticky } from '../utils/URLManager';

/**
 * worm Animation: Cards transform into worms that wiggle to their new positions
 * before transforming back into cards.
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
export function worm({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[worm] Animating cards...');

  // Card dimensions
  const cardWidth = 132; 
  const cardHeight = 132;

  // Worm animation parameters
  const transformDuration = 0.3; // Duration of card-to-worm transformation
  const wiggleDuration = 1.5; // Duration of wiggle movement
  const reformDuration = 0.3; // Duration of worm-to-card transformation
  const amplitude = 20; // Amplitude of the wiggle
  const wormSegments = 8; // Number of segments in the worm (control points)
  const staggerDelay = 0.1; // Delay between each card starting its animation
  
  // Get non-sticky cards
  const nonStickyIndices = newOrder.filter(index => !isSticky(index, sticky));
  
  if (nonStickyIndices.length === 0) {
    console.log('[worm] No non-sticky cards to animate');
    return;
  }

  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or is sticky
    if (!cardElement || isSticky(itemIndex, sticky)) {
      if (isSticky(itemIndex, sticky)) {
        console.log(`[worm] Card ${itemIndex} is sticky, skipping animation`);
      }
      return;
    }

    console.log(`[worm] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Calculate a delay based on index to stagger the animations
    const delay = (itemIndex % nonStickyIndices.length) * staggerDelay;
    
    // Store original styles to restore later
    let originalBorderRadius, originalBoxShadow, originalTransform, originalTransition;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline({
      delay: delay
    });
    
    // Setup function to capture original styles
    cardTimeline.call(() => {
      originalBorderRadius = cardElement.style.borderRadius;
      originalBoxShadow = cardElement.style.boxShadow;
      originalTransform = cardElement.style.transform;
      originalTransition = cardElement.style.transition;
      
      // Ensure no transition interference
      cardElement.style.transition = 'none';
    });
    
    // Phase 1: Transform card into worm (elongate horizontally)
    cardTimeline.to(cardElement, {
      scaleX: 1.5, // Stretch horizontally
      scaleY: 0.6, // Compress vertically
      borderRadius: '40% 40% 40% 40% / 50% 50% 50% 50%', // More rounded
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Softer shadow
      duration: transformDuration,
      ease: "power1.inOut",
      force3D: true
    });
    
    // Phase 2: Wiggle movement to final position
    // We'll create a series of control points for the worm to follow
    
    // Calculate the path from current to final position
    const deltaX = finalX - currentX;
    const deltaY = finalY - currentY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Create a slightly curved path
    // The curve will be perpendicular to the direct path
    const directAngle = Math.atan2(deltaY, deltaX);
    const perpAngle = directAngle + Math.PI/2;
    
    // Calculate a midpoint with some offset perpendicular to the direct path
    const midpointOffset = Math.min(distance * 0.3, 100); // Limit the offset
    const midX = currentX + deltaX * 0.5 + Math.cos(perpAngle) * midpointOffset;
    const midY = currentY + deltaY * 0.5 + Math.sin(perpAngle) * midpointOffset;
    
    // Create worm segments for wiggling
    const segments = [];
    for (let i = 0; i < wormSegments; i++) {
      segments.push({
        progress: i / (wormSegments - 1), // 0 to 1
        x: 0, // Will be calculated during animation
        y: 0  // Will be calculated during animation
      });
    }
    
    // Create a wiggle timeline
    const wiggleTimeline = gsap.timeline();
    
    // Animate each segment with a staggered delay to create the wiggle effect
    segments.forEach((segment, i) => {
      // Calculate the segment's position along the path
      const segmentTimeline = gsap.timeline();
      
      // Animate the segment along the path with wiggling
      segmentTimeline.to(segment, {
        x: (t) => {
          // Bezier curve calculation for x position
          const t1 = 1 - t;
          return t1 * t1 * currentX + 2 * t1 * t * midX + t * t * finalX;
        },
        y: (t) => {
          // Bezier curve calculation for y position
          const t1 = 1 - t;
          const baseY = t1 * t1 * currentY + 2 * t1 * t * midY + t * t * finalY;
          
          // Add wiggle effect
          // The wiggle amplitude decreases as we get closer to the final position
          const wiggleFactor = Math.sin(t * Math.PI * 8 + i) * amplitude * (1 - t * 0.7);
          return baseY + wiggleFactor;
        },
        duration: wiggleDuration,
        ease: "power1.inOut"
      });
      
      // Add this segment's timeline to the wiggle timeline
      wiggleTimeline.add(segmentTimeline, i * 0.05); // Stagger the segments
    });
    
    // Add the wiggle timeline to the card timeline
    cardTimeline.add(wiggleTimeline, 0);
    
    // Animate the card to follow the lead segment (head of the worm)
    cardTimeline.to(cardElement, {
      x: (t) => segments[0].x,
      y: (t) => segments[0].y,
      rotation: (t) => {
        // Calculate rotation based on the angle between the first two segments
        if (segments.length > 1) {
          const dx = segments[1].x - segments[0].x;
          const dy = segments[1].y - segments[0].y;
          return Math.atan2(dy, dx) * (180 / Math.PI);
        }
        return 0;
      },
      duration: wiggleDuration,
      ease: "none",
      force3D: true
    }, 0); // Start at the same time as the wiggle timeline
    
    // Phase 3: Transform back into card
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      borderRadius: originalBorderRadius || '0.5rem',
      boxShadow: originalBoxShadow || '0 0 15px rgba(0, 0, 0, 0.3)',
      duration: reformDuration,
      ease: "elastic.out(1, 0.7)",
      force3D: true
    });
    
    // Create worm segments (visual elements) for the animation
    cardTimeline.call(() => {
      if (typeof document !== 'undefined') {
        // Create worm segment elements
        const segmentElements = [];
        
        for (let i = 1; i < wormSegments; i++) { // Skip the first segment (the card itself)
          const segment = document.createElement('div');
          segment.id = `worm-segment-${itemIndex}-${i}`;
          segment.classList.add('worm-segment');
          
          // Style the segment
          segment.style.position = 'absolute';
          segment.style.width = `${cardWidth * (1 - i * 0.1)}px`; // Gradually smaller
          segment.style.height = `${cardHeight * 0.6}px`;
          segment.style.borderRadius = '40% 40% 40% 40% / 50% 50% 50% 50%';
          segment.style.backgroundColor = `hsl(${(Math.random() * 60) + 180}, 70%, ${65 - i * 3}%)`; // Blueish, gradually darker
          segment.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
          segment.style.opacity = '0.9';
          segment.style.zIndex = `${10 - i}`; // Ensure proper stacking
          segment.style.pointerEvents = 'none';
          
          // Position the segment initially at the card's position
          segment.style.transform = `translate(${currentX}px, ${currentY}px)`;
          
          // Add the segment to the grid
          cardElement.parentNode.parentNode.appendChild(segment);
          segmentElements.push(segment);
        }
        
        // Animate the segments to follow the worm path with delay
        segmentElements.forEach((segmentElement, i) => {
          const segmentIndex = i + 1; // Skip the first segment (the card itself)
          
          gsap.to(segmentElement, {
            x: (t) => segments[segmentIndex]?.x || 0,
            y: (t) => segments[segmentIndex]?.y || 0,
            rotation: (t) => {
              // Calculate rotation based on the angle between this segment and the next
              if (segmentIndex < segments.length - 1) {
                const dx = segments[segmentIndex + 1].x - segments[segmentIndex].x;
                const dy = segments[segmentIndex + 1].y - segments[segmentIndex].y;
                return Math.atan2(dy, dx) * (180 / Math.PI);
              }
              return 0;
            },
            duration: wiggleDuration,
            ease: "none",
            onComplete: () => {
              // Remove the segment element when animation is complete
              if (segmentElement.parentNode) {
                segmentElement.parentNode.removeChild(segmentElement);
              }
            }
          });
        });
      }
    }, [], transformDuration); // Call after the initial transformation
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
