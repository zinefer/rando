import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

// Helper function to clamp values
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Matrix character set for digital rain effect
const MATRIX_CHARS = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789:・.="*+-<>¦｜╌ﾘｸ';

// Generate a random Matrix character
const getRandomMatrixChar = () => {
  return MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
};

// Create a digital rain character element
const createDigitalRainChar = (gridRect, color = '#00FF41') => {
  const char = document.createElement('div');
  char.className = 'matrix-rain-char';
  char.textContent = getRandomMatrixChar();
  char.style.position = 'absolute';
  char.style.color = color;
  char.style.fontSize = `${Math.random() * 10 + 10}px`;
  char.style.fontFamily = 'monospace';
  char.style.opacity = Math.random() * 0.5 + 0.5;
  char.style.textShadow = `0 0 5px ${color}`;
  char.style.zIndex = '1';
  char.style.pointerEvents = 'none';
  
  // Position randomly across the grid width
  const x = Math.random() * gridRect.width;
  const y = -20; // Start above the grid
  
  char.style.left = `${x}px`;
  char.style.top = `${y}px`;
  
  return char;
};

// Create a particle element for effects
const createParticle = (x, y, color = '#00FF41') => {
  const particle = document.createElement('div');
  particle.className = 'matrix-rain-particle';
  particle.style.position = 'absolute';
  particle.style.width = `${Math.random() * 3 + 1}px`;
  particle.style.height = `${Math.random() * 3 + 1}px`;
  particle.style.backgroundColor = color;
  particle.style.borderRadius = '50%';
  particle.style.boxShadow = `0 0 ${Math.random() * 3 + 2}px ${color}`;
  particle.style.zIndex = '1';
  particle.style.pointerEvents = 'none';
  
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  
  return particle;
};

/**
 * matrixRain Animation: Cards fall from top like digital rain with enhanced Matrix-style effects.
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

  // Enhanced Matrix rain parameters
  const maxFallHeight = -gridDimensions.height; // Start above the grid
  const waveAmplitude = 60; // Increased amplitude of the wave motion
  const waveFrequency = 3; // Increased frequency of the wave
  const secondaryWaveAmplitude = 30; // Secondary wave amplitude
  const secondaryWaveFrequency = 5; // Secondary wave frequency
  
  // Matrix color palette
  const matrixColors = {
    primary: '#00FF41', // Bright matrix green
    secondary: '#03A062', // Darker matrix green
    highlight: '#5CFF5C', // Lighter highlight green
    glow: 'rgba(0, 255, 65, 0.8)' // Glow color
  };
  
  // Create column assignments for cards (to create a matrix-like column effect)
  const numColumns = Math.ceil(Math.sqrt(newOrder.length * 1.5)); // More columns for a denser rain effect
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
  
  // Arrays to store digital rain elements and particles for cleanup
  const digitalRainElements = [];
  const particleElements = [];
  
  // Create digital rain background effect
  const gridElement = document.getElementById('card-grid');
  if (gridElement) {
    // Add digital rain characters
    const numRainChars = Math.min(50, Math.floor(gridDimensions.width / 15)); // Limit based on grid width
    
    for (let i = 0; i < numRainChars; i++) {
      // Create with varying colors for depth effect
      const colorVariant = Math.random() > 0.7 ? matrixColors.highlight : 
                          (Math.random() > 0.5 ? matrixColors.primary : matrixColors.secondary);
      
      const rainChar = createDigitalRainChar(gridRect, colorVariant);
      gridElement.appendChild(rainChar);
      digitalRainElements.push(rainChar);
      
      // Animate the falling character
      const speed = 1 + Math.random() * 2; // Random speed
      const delay = Math.random() * 2; // Random start time
      
      gsap.fromTo(rainChar, 
        { y: -20, opacity: 0 },
        { 
          y: gridRect.height + 20, 
          opacity: () => Math.random() * 0.7 + 0.3,
          duration: 3 / speed,
          delay: delay,
          ease: "none",
          onComplete: () => {
            // Change character and repeat animation
            rainChar.textContent = getRandomMatrixChar();
            gsap.fromTo(rainChar, 
              { y: -20, opacity: 0 },
              { 
                y: gridRect.height + 20, 
                opacity: () => Math.random() * 0.7 + 0.3,
                duration: 3 / speed,
                ease: "none",
                repeat: 1, // Repeat once more
                onComplete: () => {
                  // Remove after second animation
                  if (rainChar.parentNode) {
                    rainChar.parentNode.removeChild(rainChar);
                  }
                }
              }
            );
          }
        }
      );
      
      // Periodically change the character during animation
      gsap.timeline().to(rainChar, {
        duration: 0.1,
        onComplete: () => {
          rainChar.textContent = getRandomMatrixChar();
        },
        repeat: 5,
        repeatDelay: 0.3 + Math.random() * 0.5
      });
    }
  }

  // Process each card with enhanced effects
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
    
    // Calculate a delay based on column and a random factor with more variation
    // This creates the cascading effect of the matrix rain
    const baseDelay = column * 0.08; // Slightly faster base delay by column
    const randomDelay = Math.random() * 0.5; // More random component
    const delay = baseDelay + randomDelay;
    
    // Randomize fall speed for more natural effect
    const fallSpeed = 0.8 + Math.random() * 0.7; // Speed multiplier between 0.8 and 1.5
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Store the original border and box-shadow to restore later
    let originalBorder, originalBoxShadow, originalFilter;
    
    // Setup function to capture original styles and add enhanced glow effect
    cardTimeline.call(() => {
      // Capture original styles
      originalBorder = cardElement.style.border;
      originalBoxShadow = cardElement.style.boxShadow;
      originalFilter = cardElement.style.filter;
      
      // Add enhanced matrix-like glow effect
      cardElement.style.boxShadow = `0 0 20px ${matrixColors.glow}, 0 0 10px ${matrixColors.glow}`;
      cardElement.style.border = `1px solid ${matrixColors.primary}`;
      
      // Add subtle brightness filter for more glow
      cardElement.style.filter = 'brightness(1.2)';
      
      // Create trailing effect container if it doesn't exist
      if (!cardElement.querySelector('.matrix-trail-container')) {
        const trailContainer = document.createElement('div');
        trailContainer.className = 'matrix-trail-container';
        trailContainer.style.position = 'absolute';
        trailContainer.style.top = '0';
        trailContainer.style.left = '0';
        trailContainer.style.width = '100%';
        trailContainer.style.height = '100%';
        trailContainer.style.pointerEvents = 'none';
        trailContainer.style.zIndex = '-1';
        cardElement.appendChild(trailContainer);
      }
    });
    
    // Phase 1: Move to top of column with slight scale down and 3D rotation
    cardTimeline.to(cardElement, {
      x: fallX,
      y: maxFallHeight,
      rotationX: -15, // Slight 3D tilt
      rotationY: Math.random() * 10 - 5,
      scale: 0.8,
      opacity: 0.7,
      duration: 0.01, // Almost instant
      delay: delay,
      force3D: true
    });
    
    // Phase 2: Fall down with enhanced wave motion and trailing effect
    cardTimeline.to(cardElement, {
      x: (i, target) => {
        // Create a complex wave motion by combining two sine waves
        const progress = gsap.getProperty(target, "y") / finalY; // 0 to 1 as it falls
        const primaryWave = Math.sin(progress * waveFrequency * Math.PI) * waveAmplitude * (1 - progress * 0.8);
        const secondaryWave = Math.sin(progress * secondaryWaveFrequency * Math.PI) * secondaryWaveAmplitude * (1 - progress * 0.6);
        return fallX + primaryWave + secondaryWave;
      },
      y: finalY,
      rotationX: 0,
      rotationY: 0,
      rotation: () => (Math.random() - 0.5) * 30, // More pronounced random rotation
      scale: 1,
      opacity: 1,
      duration: 1.5 / fallSpeed, // Adjust duration by fall speed
      ease: "power2.in",
      force3D: true,
      onUpdate: function(self) {
        // Create trailing effect during fall
        if (Math.random() < 0.2 && cardElement.parentNode) { // Only create trails occasionally
          // Safely check if self exists and has a progress method
          const progress = self && typeof self.progress === 'function' ? self.progress() : 0.5;
          
          // Only create trails during middle of animation
          if (progress > 0.1 && progress < 0.9) {
            const trailContainer = cardElement.querySelector('.matrix-trail-container');
            if (trailContainer) {
              // Create a trail element
              const trail = document.createElement('div');
              trail.style.position = 'absolute';
              trail.style.top = '0';
              trail.style.left = '0';
              trail.style.width = '100%';
              trail.style.height = '100%';
              trail.style.backgroundColor = 'transparent';
              trail.style.border = `1px solid ${matrixColors.primary}`;
              trail.style.borderRadius = 'inherit';
              trail.style.opacity = '0.3';
              trail.style.pointerEvents = 'none';
              
              // Add to trail container
              trailContainer.appendChild(trail);
              
              // Animate and remove the trail
              gsap.to(trail, {
                opacity: 0,
                scale: 0.9,
                duration: 0.5,
                onComplete: () => {
                  if (trail.parentNode) {
                    trail.parentNode.removeChild(trail);
                  }
                }
              });
            }
          }
        }
        
        // Create particles during fall
        if (Math.random() < 0.1 && gridElement && cardElement.parentNode) {
          const cardRect = cardElement.getBoundingClientRect();
          const gridRect = gridElement.getBoundingClientRect();
          
          // Calculate position relative to grid
          const relX = cardRect.left - gridRect.left + Math.random() * cardRect.width;
          const relY = cardRect.top - gridRect.top + Math.random() * cardRect.height;
          
          // Create and add particle
          const particle = createParticle(relX, relY, matrixColors.primary);
          gridElement.appendChild(particle);
          particleElements.push(particle);
          
          // Animate particle
          gsap.to(particle, {
            x: '+=' + (Math.random() * 40 - 20),
            y: '+=' + (Math.random() * 40 + 20),
            opacity: 0,
            duration: 1,
            ease: 'power1.out',
            onComplete: () => {
              if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
                const index = particleElements.indexOf(particle);
                if (index > -1) {
                  particleElements.splice(index, 1);
                }
              }
            }
          });
        }
      }
    });
    
    // Phase 3: Settle into final position with enhanced bounce and ripple effect
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      ease: "elastic.out(1.2, 0.4)", // More pronounced elastic bounce
      force3D: true,
      onComplete: () => {
        // Create ripple effect when card lands
        if (gridElement) {
          const cardRect = cardElement.getBoundingClientRect();
          const gridRect = gridElement.getBoundingClientRect();
          
          // Calculate center position relative to grid
          const centerX = cardRect.left - gridRect.left + cardRect.width / 2;
          const centerY = cardRect.top - gridRect.top + cardRect.height / 2;
          
          // Create ripple element
          const ripple = document.createElement('div');
          ripple.className = 'matrix-ripple';
          ripple.style.position = 'absolute';
          ripple.style.left = `${centerX}px`;
          ripple.style.top = `${centerY}px`;
          ripple.style.width = '10px';
          ripple.style.height = '10px';
          ripple.style.borderRadius = '50%';
          ripple.style.border = `2px solid ${matrixColors.primary}`;
          ripple.style.boxShadow = `0 0 10px ${matrixColors.glow}`;
          ripple.style.transform = 'translate(-50%, -50%)';
          ripple.style.zIndex = '1';
          ripple.style.pointerEvents = 'none';
          
          gridElement.appendChild(ripple);
          
          // Animate ripple
          gsap.to(ripple, {
            width: cardRect.width * 2,
            height: cardRect.width * 2, // Keep it circular
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
              if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
              }
            }
          });
        }
      }
    });
    
    // Add pulsating glow effect during the animation
    cardTimeline.to(cardElement, {
      boxShadow: `0 0 30px ${matrixColors.glow}, 0 0 15px ${matrixColors.glow}`,
      duration: 0.4,
      repeat: 3,
      yoyo: true,
      ease: "sine.inOut"
    }, delay + 0.5);
    
    // Restore original styles with a smooth transition
    cardTimeline.call(() => {
      // Clean up any trail elements
      const trailContainer = cardElement.querySelector('.matrix-trail-container');
      if (trailContainer) {
        gsap.to(trailContainer.children, {
          opacity: 0,
          duration: 0.3,
          stagger: 0.05,
          onComplete: () => {
            if (trailContainer.parentNode) {
              trailContainer.innerHTML = '';
            }
          }
        });
      }
      
      // Gradually fade out the glow effect
      gsap.to(cardElement, {
        boxShadow: originalBoxShadow || "0 0 15px rgba(0, 0, 0, 0.3)",
        border: originalBorder,
        filter: originalFilter || "none",
        duration: 0.7,
        ease: "power2.out"
      });
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
  
  // Clean up all digital rain elements and particles when the animation completes
  timeline.call(() => {
    // Remove all digital rain characters
    digitalRainElements.forEach(element => {
      if (element.parentNode) {
        gsap.killTweensOf(element);
        element.parentNode.removeChild(element);
      }
    });
    
    // Remove all particles
    particleElements.forEach(element => {
      if (element.parentNode) {
        gsap.killTweensOf(element);
        element.parentNode.removeChild(element);
      }
    });
  });
}
