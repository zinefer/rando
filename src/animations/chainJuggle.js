import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * chainJuggle Animation: Cards juggle in a chain reaction, with each card jumping up
 * when another card is about to land in its position.
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
export function chainJuggle({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[chainJuggle] Animating cards...');

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

  // Determine the juggling chain order
  // We'll start with a random card that should be animated
  const animatableIndices = newOrder.filter(index => shouldAnimateCard(index, sticky));
  
  if (animatableIndices.length === 0) {
    console.log('[chainJuggle] No cards to animate based on settings');
    return;
  }

  // Start with a random card
  const startIndex = animatableIndices[Math.floor(Math.random() * animatableIndices.length)];
  
  // Build the juggling chain
  const jugglingChain = [];
  let currentIndex = startIndex;
  const processedIndices = new Set();
  
  // Follow the chain until we've processed all cards or hit a cycle
  while (currentIndex !== undefined && !processedIndices.has(currentIndex)) {
    jugglingChain.push(currentIndex);
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
  
  console.log('[chainJuggle] Juggling chain:', jugglingChain);
  
  // If we have a very short chain, add some random cards to make it more interesting
  if (jugglingChain.length < 3 && animatableIndices.length > 3) {
    const remainingCards = animatableIndices.filter(idx => !jugglingChain.includes(idx));
    const additionalCards = remainingCards.slice(0, Math.min(3, remainingCards.length));
    jugglingChain.push(...additionalCards);
    console.log('[chainJuggle] Added additional cards to chain:', additionalCards);
  }
  
  // If we still don't have enough cards for a good animation, just animate all animatable cards
  if (jugglingChain.length < 3 && animatableIndices.length > 0) {
    jugglingChain.length = 0; // Clear the chain
    jugglingChain.push(...animatableIndices); // Use all animatable cards
    console.log('[chainJuggle] Using all animatable cards:', jugglingChain);
  }

  // Animation timing parameters
  const juggleHeight = gridDimensions.height * 0.6; // How high cards jump
  const flipRotations = 1.5; // Number of flips during jump
  const juggleDuration = 0.8; // Duration of each juggle
  const chainDelay = 0.2; // Delay between each card in the chain
  
  // Process each card in the juggling chain
  jugglingChain.forEach((itemIndex, chainIndex) => {
    const cardElement = elements[itemIndex];
    if (!cardElement) {
      console.warn(`[chainJuggle] Card element not found for index ${itemIndex}`);
      return;
    }
    
    console.log(`[chainJuggle] Animating card ${itemIndex} in chain position ${chainIndex}`);
    
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
    
    // Initial slight anticipation (card gets ready to jump)
    cardTimeline.to(cardElement, {
      y: currentY + 10, // Slight downward movement
      scale: 0.95, // Slight squish
      duration: 0.15,
      delay: delay,
      ease: "power1.in",
      force3D: true
    });
    
    // The main juggle - card jumps up with flips
    cardTimeline.to(cardElement, {
      x: (finalX + currentX) / 2, // Move halfway to destination
      y: currentY - juggleHeight, // Jump up
      rotation: 360 * flipRotations, // Do flips
      scale: 1.1, // Slightly larger during jump
      duration: juggleDuration / 2,
      ease: "power2.out",
      force3D: true
    });
    
    // Second half of juggle - card comes down to final position
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 360 * flipRotations * 2, // Continue rotation
      scale: 1, // Back to normal size
      duration: juggleDuration / 2,
      ease: "bounce.out", // Bouncy landing
      force3D: true
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
  
  // Now handle all other cards that weren't part of the main juggling chain
  newOrder.forEach((itemIndex, newIndex) => {
    // Skip if card should not be animated, already in the juggling chain, or element doesn't exist
    if (!shouldAnimateCard(itemIndex, sticky) || jugglingChain.includes(itemIndex) || !elements[itemIndex]) {
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
    
    // Simple jump animation for non-chain cards
    cardTimeline.to(cardElement, {
      y: currentY - 20, // Small jump
      scale: 0.9,
      duration: 0.2,
      delay: randomDelay,
      ease: "power1.out",
      force3D: true
    });
    
    cardTimeline.to(cardElement, {
      x: finalX,
      y: finalY - 100, // Jump up during movement
      rotation: (Math.random() - 0.5) * 180, // Random rotation
      duration: 0.6,
      ease: "power1.inOut",
      force3D: true
    });
    
    cardTimeline.to(cardElement, {
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: 0.4,
      ease: "bounce.out",
      force3D: true
    });
    
    // Add this card's timeline to the main timeline
    timeline.add(cardTimeline, 0);
  });
}
