import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';

/**
 * Kaleidoscope: Cards converge to the center, form a symmetrical pattern,
 * rotate and transform in synchronized patterns, then explode outward
 * before settling into their new positions.
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
export function kaleidoscope({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[kaleidoscope] Animating cards with kaleidoscope effect...');

  // Calculate grid center
  const centerX = gridDimensions.width / 2;
  const centerY = gridDimensions.height / 2;
  
  // Animation durations
  const convergeDuration = 0.8;
  const patternDuration = 1.2;
  const rotateDuration = 1.5;
  const explodeDuration = 0.9;
  const settleDuration = 0.7;
  
  // Determine number of "spokes" in the kaleidoscope pattern
  // Use between 4-8 spokes depending on number of cards
  const numCards = Object.keys(elements).filter(index => 
    shouldAnimateCard(parseInt(index), sticky)
  ).length;
  
  const numSpokes = Math.min(8, Math.max(4, Math.floor(numCards / 3)));
  console.log(`[kaleidoscope] Using ${numSpokes} spokes for ${numCards} cards`);
  
  // Prepare cards for animation
  const animatableCards = [];
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    if (cardElement && shouldAnimateCard(itemIndex, sticky)) {
      animatableCards.push({
        element: cardElement,
        oldIndex: itemIndex,
        newIndex: newIndex,
        finalX: positions[newIndex]?.x ?? 0,
        finalY: positions[newIndex]?.y ?? 0
      });
    }
  });
  
  // Assign each card to a spoke in the kaleidoscope
  animatableCards.forEach((card, i) => {
    // Assign to a spoke (0 to numSpokes-1)
    card.spoke = i % numSpokes;
    
    // Calculate radial position within spoke
    card.radialPosition = Math.floor(i / numSpokes) + 1;
  });
  
  // Clear any initial position for consistent animation start
  timeline.addLabel("kaleidoscope-start", 0);
  
  // Set initial properties for all cards
  animatableCards.forEach(card => {
    timeline.set(card.element, {
      zIndex: 10,
      transformOrigin: "center center",
      transformStyle: "preserve-3d",
      backgroundColor: "transparent"
    }, "kaleidoscope-start");
  });
  
  // Phase 1: Converge to center
  console.log('[kaleidoscope] Starting Phase 1: converge to center');
  timeline.addLabel("kaleidoscope-converge", "kaleidoscope-start+=0");
  
  // Converge animation
  animatableCards.forEach((card, index) => {
    // Calculate staggered start time
    const staggerDelay = index * 0.05;
    
    timeline.to(card.element, {
      x: centerX - card.element.offsetWidth / 2,
      y: centerY - card.element.offsetHeight / 2,
      rotation: (Math.random() - 0.5) * 360,
      scale: 0.7,
      opacity: 0.9,
      backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`,
      duration: convergeDuration * 1.5,
      ease: "back.out(1.7)",
      force3D: true,
      onStart: () => console.log(`[kaleidoscope] Phase 1 converge started for card ${index}`),
    }, `kaleidoscope-converge+=${staggerDelay}`);
  });
  
  // Phase 2: Form kaleidoscope pattern
  // Add a clear transition point between phases
  timeline.addLabel("kaleidoscope-pattern", `kaleidoscope-converge+=${convergeDuration * 1.5 + 0.2}`);
  console.log('[kaleidoscope] Starting Phase 2: form kaleidoscope pattern');
  
  // Ensure z-indices are updated for phase transition
  animatableCards.forEach(card => {
    timeline.set(card.element, {
      zIndex: 15  // Update z-index for pattern phase
    }, "kaleidoscope-pattern-=0.1");
  });
  
  // Pattern formation
  animatableCards.forEach((card, index) => {
    // Calculate angle for this card's spoke
    const spokeAngle = (card.spoke / numSpokes) * Math.PI * 2;
    
    // Calculate distance from center based on radial position
    const distance = card.radialPosition * 60; // Pixels from center
    
    // Calculate position on the spoke
    const patternX = centerX + Math.cos(spokeAngle) * distance - card.element.offsetWidth / 2;
    const patternY = centerY + Math.sin(spokeAngle) * distance - card.element.offsetHeight / 2;
    
    // Calculate rotation to align with spoke
    const rotationAngle = (spokeAngle * 180 / Math.PI) + 90; // Convert to degrees and adjust
    
    // Staggered start time
    const staggerDelay = index * 0.05;
    
    // Apply kaleidoscope pattern position
    timeline.to(card.element, {
      x: patternX,
      y: patternY,
      rotation: rotationAngle,
      scale: 0.9,
      opacity: 1,
      backgroundColor: "transparent",
      duration: patternDuration,
      ease: "elastic.out(1, 0.7)",
      force3D: true,
      onStart: () => {
        console.log(`[kaleidoscope] Phase 2 pattern formation started for card ${index}`);
        gsap.set(card.element, {
          filter: `hue-rotate(${card.spoke * (360 / numSpokes)}deg) saturate(1.5)`
        });
      }
    }, `kaleidoscope-pattern+=${staggerDelay}`);
  });
  
  // Phase 3: Rotation - FLATTENED
  // Instead of creating a nested timeline, we'll directly add the rotation keyframes
  timeline.addLabel("kaleidoscope-rotate", `kaleidoscope-pattern+=${patternDuration + 0.2}`);
  console.log('[kaleidoscope] Starting Phase 3: rotate pattern');
  
  // Update z-indices for rotation phase
  animatableCards.forEach(card => {
    timeline.set(card.element, {
      zIndex: 20  // Update z-index for rotation phase
    }, "kaleidoscope-rotate-=0.1");
  });
  
  // Define rotation keyframes
  const rotationKeyframes = [
    { rotation: 0, progress: 0 },
    { rotation: 120, progress: 0.33 },
    { rotation: 240, progress: 0.66 },
    { rotation: 360, progress: 1 }
  ];
  
  // Apply rotation to each card - FLATTENED approach
  animatableCards.forEach(card => {
    // Calculate angle for this card's spoke
    const spokeAngle = (card.spoke / numSpokes) * Math.PI * 2;
    
    // Calculate distance from center based on radial position
    const distance = card.radialPosition * 60; // Pixels from center
    
    // Add each rotation keyframe directly to the main timeline
    rotationKeyframes.forEach((keyframe, i) => {
      if (i === 0) return; // Skip the first keyframe (starting position)
      
      const prevKeyframe = rotationKeyframes[i - 1];
      const segmentDuration = (keyframe.progress - prevKeyframe.progress) * rotateDuration;
      const segmentStartTime = prevKeyframe.progress * rotateDuration;
      
      // Calculate position on the spoke with rotation offset
      const rotationRad = keyframe.rotation * Math.PI / 180;
      const adjustedAngle = spokeAngle + rotationRad;
      
      const rotatedX = centerX + Math.cos(adjustedAngle) * distance - card.element.offsetWidth / 2;
      const rotatedY = centerY + Math.sin(adjustedAngle) * distance - card.element.offsetHeight / 2;
      
      // Calculate card's own rotation to maintain alignment with spoke
      const cardRotation = (adjustedAngle * 180 / Math.PI) + 90;
      
      // Add rotation keyframe directly to the main timeline
      timeline.to(card.element, {
        x: rotatedX,
        y: rotatedY,
        rotation: cardRotation,
        ease: "power1.inOut",
        duration: segmentDuration,
      }, `kaleidoscope-rotate+=${segmentStartTime}`);
      
      // Add scale pulse directly to the main timeline
      timeline.to(card.element, {
        scale: 0.9 + Math.sin(keyframe.progress * Math.PI) * 0.2,
        filter: `hue-rotate(${(card.spoke * (360 / numSpokes) + keyframe.rotation) % 360}deg) saturate(1.5)`,
        duration: segmentDuration / 2,
      }, `kaleidoscope-rotate+=${segmentStartTime}`);
      
      timeline.to(card.element, {
        scale: 0.9,
        duration: segmentDuration / 2,
      }, `kaleidoscope-rotate+=${segmentStartTime + segmentDuration / 2}`);
    });
  });
  
  // Phase 4: Explode outward
  timeline.addLabel("kaleidoscope-explode", `kaleidoscope-rotate+=${rotateDuration + 0.1}`);
  console.log('[kaleidoscope] Starting Phase 4: explode outward');
  
  // Update z-indices for explosion phase
  animatableCards.forEach(card => {
    timeline.set(card.element, {
      zIndex: 25  // Update z-index for explosion phase
    }, "kaleidoscope-explode-=0.1");
  });
  
  // Explode animation
  animatableCards.forEach((card, index) => {
    // Calculate angle for this card's spoke
    const spokeAngle = (card.spoke / numSpokes) * Math.PI * 2;
    
    // Calculate explosion distance (further than pattern distance)
    const explosionDistance = Math.max(gridDimensions.width, gridDimensions.height) * 0.6;
    
    // Calculate explosion position
    const explosionX = centerX + Math.cos(spokeAngle) * explosionDistance - card.element.offsetWidth / 2;
    const explosionY = centerY + Math.sin(spokeAngle) * explosionDistance - card.element.offsetHeight / 2;
    
    // Staggered start for more natural explosion
    const staggerDelay = index * 0.02;
    
    // Explode outward
    timeline.to(card.element, {
      x: explosionX,
      y: explosionY,
      rotation: (Math.random() - 0.5) * 360,
      scale: 1.2,
      opacity: 0.8,
      duration: explodeDuration,
      ease: "power3.out",
      force3D: true,
      onStart: () => {
        console.log(`[kaleidoscope] Phase 4 explosion started for card ${index}`);
        gsap.to(card.element, {
          filter: "none",
          duration: explodeDuration / 2
        });
      }
    }, `kaleidoscope-explode+=${staggerDelay}`);
    
    // Create explosion particles - timing adjusted for flattened timeline
    timeline.call(() => {
      if (typeof document !== 'undefined' && Math.random() < 0.7) { // 70% chance to create particles
        const numParticles = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < numParticles; i++) {
          // Create particle element
          const particle = document.createElement('div');
          particle.classList.add('kaleidoscope-particle');
          
          // Style the particle
          particle.style.position = 'absolute';
          particle.style.width = '8px';
          particle.style.height = '8px';
          particle.style.borderRadius = '50%';
          particle.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
          particle.style.opacity = '0.8';
          particle.style.zIndex = '5';
          
          // Position at the card's explosion position
          const particleX = explosionX + card.element.offsetWidth / 2;
          const particleY = explosionY + card.element.offsetHeight / 2;
          particle.style.transform = `translate(${particleX}px, ${particleY}px)`;
          
          // Add to DOM
          card.element.parentNode.appendChild(particle);
          
          // Random particle direction
          const particleAngle = Math.random() * Math.PI * 2;
          const particleDistance = 20 + Math.random() * 40;
          
          // Animate particle
          gsap.to(particle, {
            x: particleX + Math.cos(particleAngle) * particleDistance,
            y: particleY + Math.sin(particleAngle) * particleDistance,
            scale: 0,
            opacity: 0,
            duration: 0.8,
            ease: "power1.out",
            onComplete: () => {
              // Remove particle when animation completes
              if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
              }
            }
          });
        }
      }
    }, [], `kaleidoscope-explode+=${explodeDuration * 0.3 + staggerDelay}`);
  });
  
  // Phase 5: Settle into final positions
  timeline.addLabel("kaleidoscope-settle", `kaleidoscope-explode+=${explodeDuration + 0.1}`);
  console.log('[kaleidoscope] Starting Phase 5: settle to final positions');
  
  // Update z-indices for settle phase
  animatableCards.forEach(card => {
    timeline.set(card.element, {
      zIndex: 30  // Update z-index for settle phase
    }, "kaleidoscope-settle-=0.1");
  });
  
  // Settle animation
  animatableCards.forEach((card, index) => {
    // Staggered settle for more natural movement
    const staggerDelay = index * 0.03;
    
    // Settle to final position
    timeline.to(card.element, {
      x: card.finalX,
      y: card.finalY,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: settleDuration,
      ease: "elastic.out(1, 0.7)",
      force3D: true,
      onComplete: () => {
        // Reset all properties after animation completes
        gsap.set(card.element, {
          zIndex: "auto",
          filter: "none",
          transformStyle: "flat", // Reset to default
          backgroundColor: "transparent"
        });
      }
    }, `kaleidoscope-settle+=${staggerDelay}`);
  });
  
  // Return the timeline for chaining
  return timeline;
}