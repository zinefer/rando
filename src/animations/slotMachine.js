import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';

/**
 * slotMachine Animation: Cards behave like reels on a slot machine,
 * rapidly spinning vertically before settling into position.
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
export function slotMachine({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[slotMachine] Animating cards...');

  // Calculate vertical bounds for the slot machine effect
  const topBound = -gridDimensions.height * 1.5;  // Far above the grid
  const bottomBound = gridDimensions.height * 1.5; // Far below the grid

  // Animation parameters
  const totalDuration = 2.5;
  const spinDuration = 1.2;
  const spinEase = "power1.in";
  const settleEase = "elastic.out(1, 0.7)";
  
  // Create staggered delays for columns
  // Cards in the same column should spin together like a slot machine reel
  const columnMap = {};
  newOrder.forEach((itemIndex, newIndex) => {
    // Use x position to determine column
    const finalX = positions[newIndex]?.x ?? 0;
    // Round to nearest 10px to group cards in the same approximate column
    const columnKey = Math.round(finalX / 10) * 10;
    
    if (!columnMap[columnKey]) {
      columnMap[columnKey] = [];
    }
    
    columnMap[columnKey].push({ itemIndex, newIndex });
  });
  
  // Sort columns from left to right
  const sortedColumns = Object.keys(columnMap).sort((a, b) => Number(a) - Number(b));
  
  // Maximum delay between columns
  const maxColumnDelay = 0.3;
  
  // Store all dummy cards for later cleanup
  const dummyCards = [];
  
  // Process each column
  sortedColumns.forEach((columnKey, columnIndex) => {
    const columnDelay = columnIndex * (maxColumnDelay / sortedColumns.length);
    const cardsInColumn = columnMap[columnKey];
    
    // Add dummy cards to each column
    // First, find template cards for this column that we can clone
    const availableCards = [];
    for (const { itemIndex } of cardsInColumn) {
      if (elements[itemIndex] && shouldAnimateCard(itemIndex, sticky)) {
        availableCards.push(elements[itemIndex]);
      }
    }
    
    // If we have at least one template card, proceed
    if (availableCards.length > 0) {
      // Get column x position
      const columnX = Number(columnKey);
      
      // Find all real cards in the grid to use as varied templates
      const allAnimatableCards = [];
      for (const [index, element] of Object.entries(elements)) {
        if (element && shouldAnimateCard(parseInt(index), sticky)) {
          allAnimatableCards.push(element);
        }
      }
      
      // Create 5 dummy cards for this column using different card designs
      for (let i = 0; i < 5; i++) {
        // Choose a different template for each dummy card to ensure variety
        // Either from all cards or from the available templates if we have enough
        let templateIndex;
        if (allAnimatableCards.length >= 5) {
          // Use a different real card for each dummy (avoiding repeats)
          templateIndex = (i + columnIndex) % allAnimatableCards.length;
        } else {
          // If not enough variety, at least alternate between available cards
          templateIndex = i % allAnimatableCards.length;
        }
        
        const templateCard = allAnimatableCards[templateIndex];
        const dummyCard = templateCard.cloneNode(true);
        
        // Ensure dummy card has an appropriate style
        dummyCard.style.position = 'absolute';
        dummyCard.style.zIndex = '1000';
        dummyCard.style.opacity = '1'; // Ensure dummy cards are fully visible
        dummyCard.removeAttribute('id'); // Remove any IDs to avoid conflicts
        dummyCard.classList.add('dummy-slot-card'); // Add class for identifying dummy cards
        dummyCard.dataset.column = columnKey; // Track which column this belongs to
        
        // Add visual indicator to make it obvious this is a different card
        // Apply a slight hue rotation to make it visually distinct but similar
        const hueRotation = (i * 20) + (columnIndex * 30); // Different hue for each dummy
        dummyCard.style.filter = `hue-rotate(${hueRotation}deg)`;
        
        // Add to DOM - use the parent of the first template card to maintain proper context
        availableCards[0].parentNode.appendChild(dummyCard);
        
        // Keep track of dummy cards
        dummyCards.push(dummyCard);
        
        // Position at the right x, but off-screen initially
        gsap.set(dummyCard, {
          x: columnX,
          y: topBound - (i * templateCard.offsetHeight * 1.1), // Stagger positions
          rotation: 0,
          scale: 1,
          force3D: true
        });
        
        // Animate this dummy card just like the real cards
        const dummyTimeline = gsap.timeline({
          delay: columnDelay
        });
        
        // Number of spins before settling
        const numSpins = 2 + Math.floor(Math.random() * 3);
        
        // Create rapid spinning effect with multiple passes
        for (let j = 0; j < numSpins; j++) {
          // Alternate top and bottom positions
          const fromY = j % 2 === 0 ? topBound : bottomBound;
          const toY = j % 2 === 0 ? bottomBound : topBound;
          
          // Speed increases as we approach the end of spins
          const spinSegmentDuration = spinDuration / numSpins * (1 - (j / (numSpins * 2)));
          
          dummyTimeline.fromTo(dummyCard, 
            { y: fromY },
            { 
              y: toY, 
              duration: spinSegmentDuration, 
              ease: spinEase,
              force3D: true
            }
          );
        }
        
        // Add this dummy card's timeline to the main timeline
        timeline.add(dummyTimeline, 0);
      }
    }
    
    // Process each real card in this column
    cardsInColumn.forEach(({ itemIndex, newIndex }) => {
      const cardElement = elements[itemIndex];
      
      // Skip if element doesn't exist or should not be animated
      if (!cardElement || !shouldAnimateCard(itemIndex, sticky)) {
        return;
      }
      
      console.log(`[slotMachine] Animating card original index: ${itemIndex} to new index: ${newIndex} in column: ${columnKey}`);
      
      // Get final position from calculated positions state
      const finalX = positions[newIndex]?.x ?? 0;
      const finalY = positions[newIndex]?.y ?? 0;
      
      // Create a timeline for this card
      const cardTimeline = gsap.timeline();
      
      // Initial move to correct x-position but off-screen (above or below based on final position)
      const startOffsetY = finalY > gridDimensions.height / 2 ? topBound : bottomBound;
      
      // Position card at the correct horizontal position but off-screen
      cardTimeline.set(cardElement, {
        x: finalX,
        y: startOffsetY,
        rotation: 0,
        scale: 1,
        force3D: true
      });
      
      // Number of spins before settling (randomize slightly for more realistic effect)
      const numSpins = 2 + Math.floor(Math.random() * 3);
      
      // Create rapid spinning effect with multiple passes through the visible area
      for (let i = 0; i < numSpins; i++) {
        // Alternate top and bottom positions
        const fromY = i % 2 === 0 ? topBound : bottomBound;
        const toY = i % 2 === 0 ? bottomBound : topBound;
        
        // Speed increases as we approach the end of spins
        const spinSegmentDuration = spinDuration / numSpins * (1 - (i / (numSpins * 2)));
        
        cardTimeline.fromTo(cardElement, 
          { y: fromY },
          { 
            y: toY, 
            duration: spinSegmentDuration, 
            ease: spinEase,
            force3D: true
          }
        );
      }
      
      // Slow down and land at final position
      cardTimeline.to(cardElement, {
        y: finalY,
        duration: 0.8,
        ease: settleEase,
        force3D: true
      });
      
      // Add a slight bounce when settling
      cardTimeline.to(cardElement, {
        scale: 1.1,
        duration: 0.1,
        ease: "power1.out",
        force3D: true
      });
      
      cardTimeline.to(cardElement, {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1, 0.3)",
        force3D: true
      });
      
      // Add this card's timeline to the main timeline with column-based delay
      timeline.add(cardTimeline, columnDelay);
    });
  });
  
  // Add a final "ka-chunk" effect at the end where all cards do a quick bounce
  timeline.to(Object.values(elements), {
    y: "+=10",
    duration: 0.1,
    stagger: 0.02,
    ease: "power1.in",
    force3D: true
  }, totalDuration - 0.3);
  
  timeline.to(Object.values(elements), {
    y: "-=10",
    duration: 0.2,
    stagger: 0.02,
    ease: "elastic.out(1, 0.3)",
    force3D: true
  }, totalDuration - 0.2);
  
  // Clean up dummy cards at the end of the animation
  timeline.call(() => {
    dummyCards.forEach(card => {
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
    });
  }, null, totalDuration);
}