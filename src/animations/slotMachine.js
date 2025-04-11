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
  
  // Process each column
  sortedColumns.forEach((columnKey, columnIndex) => {
    const columnDelay = columnIndex * (maxColumnDelay / sortedColumns.length);
    const cardsInColumn = columnMap[columnKey];
    
    // Process each card in this column
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
}