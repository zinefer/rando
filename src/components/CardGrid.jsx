import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useLayoutEffect, createRef } from 'react';
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
  const prevItemsRef = useRef([]); // Store previous items for FLIP animations
  const cardPositionsRef = useRef({}); // Store card positions for FLIP animations
  const isFlipAnimationPending = useRef(false); // Flag to track if FLIP animation is pending
  const pendingAnimationOrderRef = useRef(null); // Store the animation order for pending FLIP animation
  const cardRefs = useRef({}); // Store refs to all card components

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
  
  // Store previous items when they change
  useEffect(() => {
    // Only store previous items if we're already mounted
    if (isMounted.current) {
      prevItemsRef.current = [...items];
    }
  }, [items]);
  
  // Capture card positions before update
  const captureCardPositions = () => {
    const positions = {};
    items.forEach((_, index) => {
      const cardElement = document.getElementById(`card-${index}`);
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        positions[index] = { 
          rect,
          x: gsap.getProperty(cardElement, "x") || 0,
          y: gsap.getProperty(cardElement, "y") || 0
        };
      }
    });
    return positions;
  };
  
  // Check if we need to run a FLIP animation after render
  useLayoutEffect(() => {
    // Skip on initial render or if no animation is pending
    if (!isMounted.current || !isFlipAnimationPending.current) return;
    
    // Reset the flag
    isFlipAnimationPending.current = false;
    
    // Get the animation order
    const newOrder = pendingAnimationOrderRef.current;
    if (!newOrder) return;
    
    // Clear the pending animation order
    pendingAnimationOrderRef.current = null;
    
    // Run the FLIP animation
    performFlipAnimation(newOrder);
  });
  
  // Log when positions state changes AFTER initial mount
  useEffect(() => {
    if (isMounted.current) {
      console.log('[CardGrid] Positions state updated:', positions);
    }
  }, [positions]);
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    animateShuffle,
    prepareFlipAnimation,
    getPositions: () => positions,
    getGridDimensions: () => gridDimensions,
    cardRefs // Expose cardRefs to parent component
  }));
  
  // Prepare for a FLIP animation - called before React state update
  const prepareFlipAnimation = (newOrder) => {
    console.log('[CardGrid] Preparing for FLIP animation with newOrder:', newOrder);
    
    // Capture current positions before React updates the DOM
    cardPositionsRef.current = captureCardPositions();
    
    // Set the flag and store the animation order
    isFlipAnimationPending.current = true;
    pendingAnimationOrderRef.current = newOrder;
  };
  
  // Initialize or update card refs when items change
  useEffect(() => {
    // Create refs for all cards
    items.forEach((_, index) => {
      if (!cardRefs.current[index]) {
        cardRefs.current[index] = createRef();
      }
    });
    
    // Clean up refs for removed cards
    Object.keys(cardRefs.current).forEach(key => {
      const index = parseInt(key);
      if (index >= items.length) {
        delete cardRefs.current[index];
      }
    });
  }, [items]);

  // Perform the FLIP animation after React has updated the DOM
  const performFlipAnimation = (newOrder) => {
    console.log('[CardGrid] Performing FLIP animation with newOrder:', newOrder);
    
    // Set animating state to true
    setIsAnimating(true);
    
    // Create a context for this animation
    const context = gsap.context(() => {
      // Store references to all card elements
      const cardElements = {};
      
      // Get the current positions of all cards after React has updated the DOM
      items.forEach((_, index) => {
        const cardElement = document.getElementById(`card-${index}`);
        if (cardElement) {
          cardElements[index] = cardElement;
        }
      });
      
      // Get the bounding rect for the grid
      const gridRect = gridRef.current.getBoundingClientRect();
      
      // Create a timeline for the entire animation
      const mainTimeline = gsap.timeline({
        onComplete: () => {
          console.log('[CardGrid] FLIP animation timeline complete.');
          
          // Turn off animation state
          setTimeout(() => {
            console.log('[CardGrid] Setting isAnimating to false');
            setIsAnimating(false);
          }, 20);
        }
      });
      
      // For each card in the new order, calculate how it needs to move
      newOrder.forEach((oldIndex, newIndex) => {
        const cardElement = cardElements[newIndex];
        if (!cardElement) return;
        
        // Get the old position from our captured positions
        const oldPosition = cardPositionsRef.current[oldIndex];
        if (!oldPosition) return;
        
        // Get the new position after React has updated the DOM
        const newRect = cardElement.getBoundingClientRect();
        
        // Calculate the difference between old and new positions
        const deltaX = oldPosition.rect.left - newRect.left;
        const deltaY = oldPosition.rect.top - newRect.top;
        
        // Immediately move the card back to its old position
        gsap.set(cardElement, {
          x: deltaX,
          y: deltaY
        });
      });
      
      // Select and execute random animation
      const selectedAnimation = getRandomAnimation();
      
      if (selectedAnimation) {
        console.log('[CardGrid] Executing selected animation...');
        try {
          selectedAnimation({
            elements: cardElements,
            newOrder,
            positions,
            gridDimensions,
            gridRect,
            sticky,
            timeline: mainTimeline
          });
        } catch (error) {
          console.error("[CardGrid] Error executing animation function:", error);
        }
      } else {
        console.warn("[CardGrid] No animation function selected or available. Using default animation.");
        
        // Default animation if no animation is selected
        newOrder.forEach((oldIndex, newIndex) => {
          const cardElement = cardElements[newIndex];
          if (!cardElement) return;
          
          // Animate to final position (which is 0,0 since we're using transforms)
          mainTimeline.to(cardElement, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
            force3D: true
          }, 0);
        });
      }
    }, gridRef);
  };
  
  // Legacy shuffle animation method - now just prepares for FLIP and returns a resolved promise
  const animateShuffle = (newOrder) => {
    console.log('[CardGrid] Legacy animateShuffle called, using FLIP technique instead');
    
    // Prepare for FLIP animation
    prepareFlipAnimation(newOrder);
    
    // Return a resolved promise since the actual animation will happen after React updates
    return Promise.resolve();
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
            ref={cardRefs.current[index]}
            item={item}
            index={index}
            isSticky={isSticky(index, sticky)}
            onToggleSticky={() => onToggleSticky(index)}
          />
        </div>
      ))}
    </div>
  );
});

export default CardGrid;
