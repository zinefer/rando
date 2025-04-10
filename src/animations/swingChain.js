import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * swingChain Animation: Cards swing underneath to their positions, hitting other cards
 * up in a chain reaction of swinging motions.
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
export function swingChain({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[swingChain] Animating cards...');

  // Card dimensions from constants
  const cardWidth = BASE_CARD_WIDTH; 
  const cardHeight = BASE_CARD_HEIGHT;

  // Create a map to track which positions are occupied and when they'll be vacated
  const positionOccupancy = {};
  
  // Initialize with current positions
  newOrder.forEach((oldIndex, newIndex) => {
    const finalPos = positions[newIndex];
    if (finalPos) {
      const posKey = `${Math.round(finalPos.x)},${Math.round(finalPos.y)}`;
      positionOccupancy[posKey] = {
        occupiedBy: oldIndex,
        vacatedAt: 0, // Will be updated as we plan animations
        nextOccupiedBy: oldIndex // Initially the same card
      };
    }
  });

  // Create a mapping of which card goes to which position
  const cardDestinations = {};
  newOrder.forEach((oldIndex, newIndex) => {
    cardDestinations[oldIndex] = newIndex;
  });

  // Create a mapping of final positions by oldIndex
  const finalPositionsByOldIndex = {};
  newOrder.forEach((oldIndex, newIndex) => {
    finalPositionsByOldIndex[oldIndex] = positions[newIndex];
  });

  // Determine the swing chain order
  // We'll start with a random card that should be animated
  const animatableIndices = newOrder.filter(index => shouldAnimateCard(index, sticky));
  
  if (animatableIndices.length === 0) {
    console.log('[swingChain] No cards to animate based on settings');
    return;
  }

  // Start with a random card
  const startIndex = animatableIndices[Math.floor(Math.random() * animatableIndices.length)];
  
  // Build the swing chain
  const swingChain = [];
  let currentIndex = startIndex;
  const processedIndices = new Set();
  
  // Follow the chain until we've processed all cards or hit a cycle
  while (currentIndex !== undefined && !processedIndices.has(currentIndex)) {
    swingChain.push(currentIndex);
    processedIndices.add(currentIndex);
    
    // Find the next card in the chain (the one currently at this card's destination)
    const destIndex = cardDestinations[currentIndex];
    const destPosition = positions[destIndex];
    const destPosKey = `${Math.round(destPosition.x)},${Math.round(destPosition.y)}`;
    
    // Find which card is currently at this position
    const nextCard = positionOccupancy[destPosKey]?.occupiedBy;
    
    // If the next card should not be animated or already processed, break the chain
    if (nextCard === undefined || !shouldAnimateCard(nextCard, sticky) || processedIndices.has(nextCard)) {
      currentIndex = undefined;
    } else {
      currentIndex = nextCard;
    }
  }
  
  console.log('[swingChain] Swing chain:', swingChain);
  
  // If we have a very short chain, add some random cards to make it more interesting
  if (swingChain.length < 3 && animatableIndices.length > 3) {
    const remainingCards = animatableIndices.filter(idx => !swingChain.includes(idx));
    const additionalCards = remainingCards.slice(0, Math.min(3, remainingCards.length));
    swingChain.push(...additionalCards);
    console.log('[swingChain] Added additional cards to chain:', additionalCards);
  }
  
  // If we still don't have enough cards for a good animation, just animate all animatable cards
  if (swingChain.length < 3 && animatableIndices.length > 0) {
    swingChain.length = 0; // Clear the chain
    swingChain.push(...animatableIndices); // Use all animatable cards
    console.log('[swingChain] Using all animatable cards:', swingChain);
  }

  // Animation timing parameters
  const swingDuration = 0.7; // Duration of each swing
  const chainDelay = 0.15; // Delay between each card in the chain
  const swingHeight = gridDimensions.height * 0.4; // How high cards swing
  const swingDepth = gridDimensions.height * 0.3; // How low cards swing
  
  // Process each card in the swing chain
  swingChain.forEach((itemIndex, chainIndex) => {
    const cardElement = elements[itemIndex];
    if (!cardElement) {
      console.warn(`[swingChain] Card element not found for index ${itemIndex}`);
      return;
    }
    
    console.log(`[swingChain] Animating card ${itemIndex} in chain position ${chainIndex}`);
    
    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get destination index and position
    const destIndex = cardDestinations[itemIndex];
    const finalX = positions[destIndex]?.x ?? 0;
    const finalY = positions[destIndex]?.y ?? 0;
    
    // Calculate the delay for this card in the chain
    const delay = chainIndex * chainDelay;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Determine if this card swings up or down first based on its position in the chain
    const swingsDownFirst = chainIndex % 2 === 0;
    
    if (swingsDownFirst) {
      // Phase 1: Initial anticipation (slight movement in opposite direction)
      cardTimeline.to(cardElement, {
        y: currentY - 15, // Slight upward movement
        scale: 0.95,
        duration: 0.15,
        delay: delay,
        ease: "power1.in",
        force3D: true
      });
      
      // Phase 2: Swing down and under
      cardTimeline.to(cardElement, {
        x: (currentX + finalX) / 2, // Halfway to destination
        y: currentY + swingDepth, // Swing below
        rotation: -30, // Rotate backward
        scale: 0.9,
        duration: swingDuration * 0.4,
        ease: "power1.out",
        force3D: true
      });
      
      // Phase 3: Swing up to final position
      cardTimeline.to(cardElement, {
        x: finalX,
        y: finalY,
        rotation: 0,
        scale: 1,
        duration: swingDuration * 0.6,
        ease: "back.out(1.5)",
        force3D: true
      });
      
      // Phase 4: Impact effect (slight bounce)
      cardTimeline.to(cardElement, {
        y: finalY - 10,
        duration: 0.1,
        ease: "power1.out",
        force3D: true
      });
      
      // Phase 5: Settle
      cardTimeline.to(cardElement, {
        y: finalY,
        duration: 0.2,
        ease: "bounce.out",
        force3D: true
      });
    } else {
      // Phase 1: Initial anticipation (slight movement in opposite direction)
      cardTimeline.to(cardElement, {
        y: currentY + 15, // Slight downward movement
        scale: 0.95,
        duration: 0.15,
        delay: delay,
        ease: "power1.in",
        force3D: true
      });
      
      // Phase 2: Swing up and over
      cardTimeline.to(cardElement, {
        x: (currentX + finalX) / 2, // Halfway to destination
        y: currentY - swingHeight, // Swing above
        rotation: 30, // Rotate forward
        scale: 0.9,
        duration: swingDuration * 0.4,
        ease: "power1.out",
        force3D: true
      });
      
      // Phase 3: Swing down to final position
      cardTimeline.to(cardElement, {
        x: finalX,
        y: finalY,
        rotation: 0,
        scale: 1,
        duration: swingDuration * 0.6,
        ease: "back.out(1.5)",
        force3D: true
      });
      
      // Phase 4: Impact effect (slight bounce)
      cardTimeline.to(cardElement, {
        y: finalY + 10,
        duration: 0.1,
        ease: "power1.out",
        force3D: true
      });
      
      // Phase 5: Settle
      cardTimeline.to(cardElement, {
        y: finalY,
        duration: 0.2,
        ease: "bounce.out",
        force3D: true
      });
    }
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
  
  // Now handle all other cards that weren't part of the main swing chain
  newOrder.forEach((itemIndex, newIndex) => {
    // Skip if card should not be animated, already in the swing chain, or element doesn't exist
    if (!shouldAnimateCard(itemIndex, sticky) || swingChain.includes(itemIndex) || !elements[itemIndex]) {
      return;
    }
    
    const cardElement = elements[itemIndex];
    
    // Get current position relative to the grid container
    const rect = cardElement.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    
    // Get final position
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;
    
    // Calculate a random delay
    const randomDelay = Math.random() * 0.5 + 0.2;
    
    // Create a timeline for this card
    const cardTimeline = gsap.timeline();
    
    // Simple swing animation for non-chain cards
    // Randomly choose between swinging up or down
    const swingUp = Math.random() > 0.5;
    
    if (swingUp) {
      // Swing up and over
      cardTimeline.to(cardElement, {
        y: currentY - 40, // Swing up
        scale: 0.9,
        rotation: 15,
        duration: 0.3,
        delay: randomDelay,
        ease: "power1.out",
        force3D: true
      });
      
      cardTimeline.to(cardElement, {
        x: finalX,
        y: finalY - 20, // Approach from above
        rotation: -5,
        duration: 0.5,
        ease: "power1.inOut",
        force3D: true
      });
    } else {
      // Swing down and under
      cardTimeline.to(cardElement, {
        y: currentY + 40, // Swing down
        scale: 0.9,
        rotation: -15,
        duration: 0.3,
        delay: randomDelay,
        ease: "power1.out",
        force3D: true
      });
      
      cardTimeline.to(cardElement, {
        x: finalX,
        y: finalY + 20, // Approach from below
        rotation: 5,
        duration: 0.5,
        ease: "power1.inOut",
        force3D: true
      });
    }
    
    // Final settle
    cardTimeline.to(cardElement, {
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: 0.3,
      ease: "back.out(1.5)",
      force3D: true
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
