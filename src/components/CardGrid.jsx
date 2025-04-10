import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Register the useGSAP plugin
gsap.registerPlugin(useGSAP);

import Card from './Card';
import { isSticky } from '../utils/URLManager';
import { getRandomAnimation } from '../animations'; // Import the random animation getter
import { EFFECTIVE_CARD_WIDTH, EFFECTIVE_CARD_HEIGHT } from '../constants';

/**
 * CardGrid component for displaying and managing the grid of cards
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Array} props.sticky - Array of sticky item indices
 * @param {Function} props.onReorder - Callback for when items are reordered
 * @param {Function} props.onToggleSticky - Callback for toggling sticky status
 * @param {Object} ref - Forwarded ref for parent component to access methods
 */
const CardGrid = forwardRef(({ items, sticky = [], onReorder, onToggleSticky }, ref) => {
  const gridRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false); // State to track animation status
  const isMounted = useRef(false); // Track initial mount

  console.log('[CardGrid] Rendering. Items:', items, 'Is Animating:', isAnimating);

  // Calculate grid dimensions and initial positions
  useEffect(() => {
    console.log('[CardGrid] Grid Dimensions Effect running.');
    if (gridRef.current) {
      const updateDimensions = () => {
        const { width, height } = gridRef.current.getBoundingClientRect();
        setGridDimensions({ width, height });
      };
      
      updateDimensions();
      
      // Update dimensions on window resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);
  
  // Calculate positions for cards in a grid layout
  const calculatePositions = () => {
    console.log('[CardGrid] Calculating positions. Grid Width:', gridDimensions.width, 'Items Length:', items.length);
    if (gridDimensions.width > 0 && items.length > 0) {
      // Use effective dimensions from constants (including margin)
      const cardWidth = EFFECTIVE_CARD_WIDTH; 
      const cardHeight = EFFECTIVE_CARD_HEIGHT; 
      
      // Calculate how many cards can fit in a row
      const cardsPerRow = Math.max(1, Math.floor(gridDimensions.width / cardWidth));
      
      // Calculate positions for each card
      const newPositions = items.map((_, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        return {
          x: col * cardWidth,
          y: row * cardHeight
        };
      });
      
      // Check for and resolve any overlapping positions
      const positionMap = new Map(); // Map to track positions
      const adjustedPositions = newPositions.map((pos, index) => {
        const posKey = `${pos.x},${pos.y}`;
        
        // If this position is already taken, adjust it slightly
        if (positionMap.has(posKey)) {
          console.warn(`[CardGrid] Detected overlapping position at ${posKey} for card ${index}`);
          
          // Add a small offset to avoid overlap
          const adjustedPos = {
            x: pos.x + 5,
            y: pos.y + 5
          };
          
          console.log(`[CardGrid] Adjusted position for card ${index} to x:${adjustedPos.x}, y:${adjustedPos.y}`);
          positionMap.set(`${adjustedPos.x},${adjustedPos.y}`, index);
          return adjustedPos;
        }
        
        // Record this position as taken
        positionMap.set(posKey, index);
        return pos;
      });
      
      console.log('[CardGrid] Calculated new positions:', adjustedPositions);
      console.log('[CardGrid] Position map:', Object.fromEntries(positionMap));
      return adjustedPositions;
    }
    return [];
  };
  
  // Update positions when grid dimensions or items change
  useEffect(() => {
    if (gridDimensions.width > 0 && items.length > 0 && !isAnimating) {
      const newPositions = calculatePositions();
      if (newPositions.length > 0) {
        setPositions(newPositions);
        isMounted.current = true; // Mark as mounted after first position calculation
      }
    }
  }, [items.length, gridDimensions, isAnimating]); // Only depend on items.length, not the entire items array
  
  // Log when positions state changes AFTER initial mount
  useEffect(() => {
    if (isMounted.current) {
      console.log('[CardGrid] Positions state updated:', positions);
    }
  }, [positions]);

  // Handle card drag end
  const handleDragEnd = (index, x, y) => {
    // Create a copy of current positions
    const newPositions = [...positions];
    
    // Update the position of the dragged card
    newPositions[index] = { x, y };
    
    // Find the closest position to determine new order
    const draggedCenter = {
      x: x + 66, // half of card width
      y: y + 66  // half of card height
    };
    
    // Find the closest position
    let closestIndex = index;
    let closestDistance = Infinity;
    
    positions.forEach((pos, i) => {
      if (i !== index) {
        const centerX = pos.x + 66;
        const centerY = pos.y + 66;
        
        const distance = Math.sqrt(
          Math.pow(draggedCenter.x - centerX, 2) + 
          Math.pow(draggedCenter.y - centerY, 2)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
    });
    
    // If the card was dragged close enough to another position, reorder
    if (closestDistance < 100 && closestIndex !== index) {
      // Create a new array with the reordered items
      const newItems = [...items];
      const [movedItem] = newItems.splice(index, 1);
      newItems.splice(closestIndex, 0, movedItem);
      
      // Update sticky indices if needed
      const newSticky = sticky.map(stickyIndex => {
        if (stickyIndex === index) return closestIndex;
        if (stickyIndex > index && stickyIndex <= closestIndex) return stickyIndex - 1;
        if (stickyIndex < index && stickyIndex >= closestIndex) return stickyIndex + 1;
        return stickyIndex;
      });
      
      // Call the onReorder callback with the new order
      if (onReorder) {
        onReorder(newItems, newSticky);
      }
    } else {
      // Animate the card back to its original position
      gsap.to(`#card-${index}`, {
        x: positions[index].x,
        y: positions[index].y,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  };
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    animateShuffle,
    getPositions: () => positions,
    getGridDimensions: () => gridDimensions
  }));
  
  // Shuffle animation using gsap.context, returns a Promise
  const animateShuffle = (newOrder) => {
    return new Promise((resolve) => { // Wrap in a Promise
      console.log('[CardGrid] animateShuffle called with newOrder:', newOrder);
      console.log('[CardGrid] Current positions state:', positions);
    console.log('[CardGrid] Grid dimensions:', gridDimensions);
    
    // Set animating state to true
    console.log('[CardGrid] Setting isAnimating to true');
    setIsAnimating(true);
    
    // Create a context for this animation
    const context = gsap.context(() => {
      // Store references to all card elements
      const cardElements = {};
      newOrder.forEach((itemIndex) => {
        const cardElement = document.getElementById(`card-${itemIndex}`);
        if (cardElement) {
          cardElements[itemIndex] = cardElement;
          
          // Reset any existing transforms to ensure clean animation
          console.log(`[CardGrid] Resetting Card ${itemIndex} for animation`);
          
          // Store the current position for animation
          const currentX = gsap.getProperty(cardElement, "x") || 0;
          const currentY = gsap.getProperty(cardElement, "y") || 0;
          
          // Log the current position
          console.log(`[CardGrid] Card ${itemIndex} starting position: X=${currentX}, Y=${currentY}`);
        } else {
          console.warn(`[CardGrid] Could not find card element for index: ${itemIndex}`);
        }
      });

      // Get the bounding rect for the grid *once*
      const gridRect = gridRef.current.getBoundingClientRect();

      // Calculate final positions once before animation
      const finalPositions = calculatePositions();
      
      // Create a timeline for the entire animation
      const mainTimeline = gsap.timeline({
        onComplete: () => {
          console.log('[CardGrid] Main animation timeline complete.');
          
          // Log the current positions of all cards before forcing final positions
          console.log('[CardGrid] Card positions before forcing final positions:');
          newOrder.forEach((itemIndex) => {
            const cardElement = cardElements[itemIndex];
            if (!cardElement) return;
            
            const currentX = gsap.getProperty(cardElement, "x");
            const currentY = gsap.getProperty(cardElement, "y");
            console.log(`[CardGrid] Card ${itemIndex} - Current position: X=${currentX}, Y=${currentY}`);
          });
          
          // Ensure all cards are precisely at their final calculated positions
          newOrder.forEach((itemIndex, newIndex) => {
            const cardElement = cardElements[itemIndex];
            if (!cardElement) return;
            
            if (finalPositions[newIndex]) {
              const finalX = finalPositions[newIndex].x;
              const finalY = finalPositions[newIndex].y;
              
              // Get current position before setting final position
              const currentX = gsap.getProperty(cardElement, "x");
              const currentY = gsap.getProperty(cardElement, "y");
              
              // Calculate the difference between current and final positions
              const diffX = Math.abs(currentX - finalX);
              const diffY = Math.abs(currentY - finalY);
              
              // Skip GSAP and use direct DOM manipulation to ensure positions are applied correctly
              console.log(`[CardGrid] Setting Card ${itemIndex} position directly via DOM: X=${finalX}, Y=${finalY}`);
              
              // Get the actual DOM element (not the GSAP wrapper)
              const actualElement = cardElement.querySelector ? cardElement : document.getElementById(`card-${itemIndex}`);
              
              if (actualElement) {
                // Apply transform directly to the element's style
                actualElement.style.transform = `translate(${finalX}px, ${finalY}px)`;
                actualElement.style.rotate = "0deg";
                actualElement.style.scale = "1";
                
                // Also update any GSAP properties to keep them in sync
                gsap.set(actualElement, { 
                  x: finalX, 
                  y: finalY,
                  rotation: 0,
                  scale: 1,
                  clearProps: "z,rotationX,rotationY",
                  force3D: true
                });
              } else {
                console.error(`[CardGrid] Could not find actual DOM element for Card ${itemIndex}`);
              }
              
              console.log(`[CardGrid] Card ${itemIndex} - Final position forced to: X=${finalX}, Y=${finalY} (Diff: X=${diffX.toFixed(2)}, Y=${diffY.toFixed(2)})`);
              
              // Verify the position was actually set correctly
              const verifyX = gsap.getProperty(cardElement, "x");
              const verifyY = gsap.getProperty(cardElement, "y");
              
              if (Math.abs(verifyX - finalX) > 0.1 || Math.abs(verifyY - finalY) > 0.1) {
                console.error(`[CardGrid] Position verification failed for Card ${itemIndex}! Expected: (${finalX}, ${finalY}), Got: (${verifyX}, ${verifyY})`);
              }
            } else {
               console.warn(`[CardGrid] No final position found for newIndex: ${newIndex}`);
            }
          });
          
          // Final verification of all card positions
          console.log('[CardGrid] Final verification of card positions:');
          const positionMap = new Map(); // Map to track positions
          
          newOrder.forEach((itemIndex, newIndex) => {
            const cardElement = cardElements[itemIndex];
            if (!cardElement) return;
            
            const finalX = gsap.getProperty(cardElement, "x");
            const finalY = gsap.getProperty(cardElement, "y");
            const posKey = `${finalX.toFixed(1)},${finalY.toFixed(1)}`;
            
            console.log(`[CardGrid] Card ${itemIndex} - Final verified position: X=${finalX}, Y=${finalY}`);
            
            // Check if this position is already taken
            if (positionMap.has(posKey)) {
              const otherCard = positionMap.get(posKey);
              console.error(`[CardGrid] OVERLAP DETECTED! Cards ${itemIndex} and ${otherCard} are at the same position: ${posKey}`);
            }
            
            // Record this position as taken
            positionMap.set(posKey, itemIndex);
          });
          
          // Create a new positions array based on the actual final positions of the cards
          const actualFinalPositions = newOrder.map((itemIndex, newIndex) => {
            const cardElement = cardElements[itemIndex];
            if (!cardElement) {
              // If element not found, use calculated position
              return finalPositions[newIndex] || { x: 0, y: 0 };
            }
            
            // Get the actual final position from the DOM element
            const actualElement = cardElement.querySelector ? cardElement : document.getElementById(`card-${itemIndex}`);
            if (actualElement) {
              // Try to get computed style transform
              const style = window.getComputedStyle(actualElement);
              const transform = style.transform || style.webkitTransform || style.mozTransform;
              
              if (transform && transform !== 'none') {
                console.log(`[CardGrid] Card ${itemIndex} computed transform: ${transform}`);
              }
            }
            
            // Use the calculated position as the source of truth
            return finalPositions[newIndex];
          });
          
          console.log('[CardGrid] Actual final positions:', actualFinalPositions);
          
          // Update positions state with actual final positions
          //setPositions(actualFinalPositions);
          
          // Turn off animation state after a small delay to ensure all DOM updates are complete
          setTimeout(() => {
            console.log('[CardGrid] Setting isAnimating to false');
            setIsAnimating(false);
            
            // Do one final check to ensure cards are at their correct positions
            // But only update positions that are significantly off
            newOrder.forEach((itemIndex, newIndex) => {
              const cardElement = document.getElementById(`card-${itemIndex}`);
              if (cardElement && actualFinalPositions[newIndex]) {
                const finalX = actualFinalPositions[newIndex].x;
                const finalY = actualFinalPositions[newIndex].y;
                
                // Get current transform
                const style = window.getComputedStyle(cardElement);
                const transform = style.transform || style.webkitTransform || style.mozTransform;
                
                // Only update if transform is missing or significantly different
                if (!transform || transform === 'none' || transform.includes('matrix') || transform.includes('translate(0px, 0px)')) {
                  // Force the position one last time
                  cardElement.style.transform = `translate(${finalX}px, ${finalY}px)`;
                  console.log(`[CardGrid] Final position correction for Card ${itemIndex}: X=${finalX}, Y=${finalY}`);
                }
              }
            });
            
            // Resolve the promise
            console.log('[CardGrid] Resolving animation promise.');
            resolve();
          }, 20); // Keep the original timeout value
        }
      });

      // --- Select and Execute Random Animation ---
      const selectedAnimation = getRandomAnimation();

      if (selectedAnimation) {
        console.log('[CardGrid] Executing selected animation...');
        try {
          selectedAnimation({
            elements: cardElements,
            newOrder,
            positions,
            gridDimensions,
            gridRect, // Pass the calculated gridRect
            sticky,
            timeline: mainTimeline // Pass the timeline for the animation to add to
          });
        } catch (error) {
           console.error("[CardGrid] Error executing animation function:", error);
           // Potentially resolve the promise here if animation fails critically
           // resolve(); // Or handle error differently
        }
      } else {
        console.warn("[CardGrid] No animation function selected or available. Skipping animation.");
        // If no animation runs, we still need to resolve the promise
        // We can do this immediately or after a minimal delay
        gsap.delayedCall(0.1, () => {
           console.log('[CardGrid] No animation ran, resolving promise.');
           resolve();
        });
      }
      // --- End Animation Execution ---

    }, gridRef); // Scope GSAP context to gridRef
    }); // End of Promise
    
    // Note: The context cleanup is handled implicitly by useGSAP when the component unmounts
    // or dependencies change, so explicitly returning context.revert() might not be necessary
    // unless specific cleanup timing is required outside the component lifecycle.
  };
  
  return (
    <div 
      id="card-grid"
      ref={gridRef}
      className="card-grid relative w-full min-h-[400px] p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
    >
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          id={`card-${index}`}
          className="absolute"
          // Always maintain the transform style, but let GSAP override it during animation
          // This prevents the cards from jumping to origin (0,0) when animation starts
          style={{
            transform: `translate(${positions[index]?.x || 0}px, ${positions[index]?.y || 0}px)`,
            // Add a pointer-events property to prevent interaction during animation
            pointerEvents: isAnimating ? 'none' : 'auto',
            // Ensure each card has a unique z-index to prevent overlapping
            zIndex: isAnimating ? 10 : index + 1
          }}
        >
          <Card
            item={item}
            index={index}
            isSticky={isSticky(index, sticky)}
            onDragEnd={handleDragEnd}
            onToggleSticky={() => onToggleSticky(index)}
          />
        </div>
      ))}
    </div>
  );
});

export default CardGrid;
