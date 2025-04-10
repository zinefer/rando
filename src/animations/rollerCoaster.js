import gsap from 'gsap';
import { isSticky } from '../utils/URLManager';

/**
 * rollerCoaster Animation: Cards follow a roller coaster track with loops, drops, and climbs
 * before settling into their final positions.
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
export function rollerCoaster({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[rollerCoaster] Animating cards...');

  // Card dimensions
  const cardWidth = 132; 
  const cardHeight = 132;

  // Calculate grid center point
  const gridCenterX = gridDimensions.width / 2;
  const gridCenterY = gridDimensions.height / 2;

  // Roller coaster parameters
  const trackDuration = 2.5; // Duration of the roller coaster ride
  const carSpacing = 0.15; // Time spacing between each "car" (card)
  const loopHeight = gridDimensions.height * 0.7; // Height of the loop
  const dropHeight = gridDimensions.height * 0.5; // Height of the drop
  const trackWidth = gridDimensions.width * 0.8; // Width of the track
  
  // Get non-sticky cards
  const nonStickyIndices = newOrder.filter(index => !isSticky(index, sticky));
  
  if (nonStickyIndices.length === 0) {
    console.log('[rollerCoaster] No non-sticky cards to animate');
    return;
  }

  // Define the roller coaster track as a series of points
  // Each point is {x, y, rotation, scale, ease}
  const defineTrack = () => {
    // Start position (loading platform)
    const startX = gridCenterX - trackWidth/2;
    const startY = gridCenterY;
    
    // Define track segments
    return [
      // Starting point - loading platform
      {
        x: startX,
        y: startY,
        rotation: 0,
        scale: 1,
        ease: "none",
        duration: 0
      },
      // Initial climb
      {
        x: startX + trackWidth * 0.2,
        y: startY - dropHeight * 0.8,
        rotation: -30, // Tilted backward during climb
        scale: 0.9,
        ease: "power1.in",
        duration: 0.5
      },
      // First drop
      {
        x: startX + trackWidth * 0.4,
        y: startY + dropHeight * 0.3,
        rotation: 60, // Tilted forward during drop
        scale: 1.1,
        ease: "power2.out",
        duration: 0.4
      },
      // Bottom of drop, into loop approach
      {
        x: startX + trackWidth * 0.5,
        y: startY,
        rotation: 0,
        scale: 1,
        ease: "power1.inOut",
        duration: 0.2
      },
      // Loop - bottom entry
      {
        x: startX + trackWidth * 0.6,
        y: startY,
        rotation: 0,
        scale: 0.9,
        ease: "power1.in",
        duration: 0.1
      },
      // Loop - left side
      {
        x: startX + trackWidth * 0.55,
        y: startY - loopHeight * 0.5,
        rotation: -90, // Sideways
        scale: 0.8,
        ease: "none",
        duration: 0.2
      },
      // Loop - top
      {
        x: startX + trackWidth * 0.6,
        y: startY - loopHeight,
        rotation: -180, // Upside down
        scale: 0.7,
        ease: "none",
        duration: 0.2
      },
      // Loop - right side
      {
        x: startX + trackWidth * 0.65,
        y: startY - loopHeight * 0.5,
        rotation: -270, // Sideways
        scale: 0.8,
        ease: "none",
        duration: 0.2
      },
      // Loop - bottom exit
      {
        x: startX + trackWidth * 0.7,
        y: startY,
        rotation: -360, // Right-side up again
        scale: 0.9,
        ease: "power1.out",
        duration: 0.1
      },
      // Small hill
      {
        x: startX + trackWidth * 0.8,
        y: startY - dropHeight * 0.4,
        rotation: -330, // Slight backward tilt
        scale: 0.95,
        ease: "power1.inOut",
        duration: 0.3
      },
      // Final approach
      {
        x: startX + trackWidth * 0.9,
        y: startY,
        rotation: 0,
        scale: 1,
        ease: "power1.out",
        duration: 0.3
      }
    ];
  };
  
  // Get the track definition
  const track = defineTrack();
  
  // Process each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    // Skip if element doesn't exist or is sticky
    if (!cardElement || isSticky(itemIndex, sticky)) {
      if (isSticky(itemIndex, sticky)) {
        console.log(`[rollerCoaster] Card ${itemIndex} is sticky, skipping animation`);
      }
      return;
    }

    console.log(`[rollerCoaster] Animating card original index: ${itemIndex} to new index: ${newIndex}`);

    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position from calculated positions state
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Calculate delay based on position in the train
    // Cards will follow each other like a train of roller coaster cars
    const carPosition = newIndex % nonStickyIndices.length;
    const delay = carPosition * carSpacing;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline({
      delay: delay
    });
    
    // Move to starting position first
    cardTimeline.to(cardElement, {
      x: track[0].x,
      y: track[0].y,
      rotation: track[0].rotation,
      scale: track[0].scale,
      duration: 0.5,
      ease: "power1.inOut",
      force3D: true
    });
    
    // Add each track segment to the timeline
    let cumulativeTime = 0;
    for (let i = 1; i < track.length; i++) {
      const segment = track[i];
      
      cardTimeline.to(cardElement, {
        x: segment.x,
        y: segment.y,
        rotation: segment.rotation,
        scale: segment.scale,
        duration: segment.duration,
        ease: segment.ease,
        force3D: true
      });
      
      cumulativeTime += segment.duration;
    }
    
    // Add some "shaking" during the ride for realism
    // We'll use a modifer to add small random movements
    const shakeModifier = {
      x: 0,
      y: 0,
      rotation: 0
    };
    
    // Create a separate timeline for the shaking effect
    const shakeTL = gsap.timeline({
      paused: true,
      onUpdate: () => {
        // Apply the shake modifiers to the card's current transform
        gsap.set(cardElement, {
          x: "+="+shakeModifier.x,
          y: "+="+shakeModifier.y,
          rotation: "+="+shakeModifier.rotation
        });
      }
    });
    
    // Animate the shake modifiers
    shakeTL.to(shakeModifier, {
      x: "random(-5, 5, 1)", // Random x movement between -5 and 5
      y: "random(-5, 5, 1)", // Random y movement between -5 and 5
      rotation: "random(-3, 3, 0.5)", // Random rotation between -3 and 3 degrees
      duration: trackDuration,
      ease: "none",
      repeat: 0
    });
    
    // Start the shake timeline at the same time as the track timeline
    cardTimeline.add(() => shakeTL.play(), 0.5);
    
    // Final movement to the card's destination
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.inOut",
      force3D: true,
      onStart: () => {
        // Stop the shaking when we're heading to final position
        shakeTL.pause();
      }
    });
    
    // Add a little bounce at the end
    cardTimeline.to(cardElement, {
      y: finalY - 10,
      duration: 0.15,
      ease: "power1.out",
      force3D: true
    });
    
    cardTimeline.to(cardElement, {
      y: finalY,
      duration: 0.15,
      ease: "bounce.out",
      force3D: true
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
