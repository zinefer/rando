import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Register the useGSAP plugin
gsap.registerPlugin(useGSAP);

import Card from './Card';
import { isSticky } from '../utils/URLManager';
import { getRandomAnimation } from '../animations'; // Import the random animation getter

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
  
  // Calculate initial positions for cards in a grid layout
  useEffect(() => {
    console.log('[CardGrid] Positions Effect running. Grid Width:', gridDimensions.width, 'Items Length:', items.length);
    if (gridDimensions.width > 0 && items.length > 0) {
      // Card dimensions (including margin)
      const cardWidth = 140; // 132px + margins
      const cardHeight = 140; // 132px + margins
      
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
      
      console.log('[CardGrid] Calculated new positions:', newPositions);
      setPositions(newPositions);
      isMounted.current = true; // Mark as mounted after first position calculation
    }
  }, [items, gridDimensions]); // Rerun when items or grid dimensions change
  
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
  
  // Expose the animateShuffle method to parent component via ref
  useImperativeHandle(ref, () => ({
    animateShuffle
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
        } else {
          console.warn(`[CardGrid] Could not find card element for index: ${itemIndex}`);
        }
      });

      // Get the bounding rect for the grid *once*
      const gridRect = gridRef.current.getBoundingClientRect();

      // Create a timeline for the entire animation
      const mainTimeline = gsap.timeline({
        onComplete: () => {
          console.log('[CardGrid] Main animation timeline complete.');
          
          // Ensure all cards are precisely at their final calculated positions
          newOrder.forEach((itemIndex, newIndex) => {
            const cardElement = cardElements[itemIndex];
            if (!cardElement) return;
            
            if (positions[newIndex]) {
              const finalX = positions[newIndex].x;
              const finalY = positions[newIndex].y;
              
              // Use gsap.set for immediate placement without animation
              gsap.set(cardElement, { 
                x: finalX, 
                y: finalY,
                rotation: 0, // Reset rotation if needed
                scale: 1,    // Reset scale if needed
                force3D: true // Maintain GPU acceleration
              });
              
              console.log(`[CardGrid] Card ${itemIndex} - Final position forced to: X=${finalX}, Y=${finalY}`);
            } else {
               console.warn(`[CardGrid] No final position found for newIndex: ${newIndex}`);
            }
          });
          
          // Turn off animation state
          console.log('[CardGrid] Setting isAnimating to false');
          setIsAnimating(false);
          
          // Resolve the promise
          console.log('[CardGrid] Resolving animation promise.');
          resolve(); 
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
            pointerEvents: isAnimating ? 'none' : 'auto'
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
