import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useLayoutEffect, createRef, useCallback } from 'react';
import gsap from 'gsap';

import { getRandomAnimation } from '../animations';

import AddItemDialog from './AddItemDialog';
import Card from './Card';

import { isSticky } from '../utils/URLManager';

import { EFFECTIVE_CARD_WIDTH, EFFECTIVE_CARD_HEIGHT } from '../constants';

/**
 * CardGrid component for displaying and managing the grid of cards
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Array} props.sticky - Array of sticky item indices
 * @param {Function} props.onReorder - Callback for when items are reordered
 * @param {Function} props.onToggleSticky - Callback for toggling sticky status
 * @param {Function} props.onAnimationComplete - Callback for when the FLIP animation completes
 * @param {Function} props.onRemoveItem - Callback for removing an item
 * @param {Function} props.onAddItem - Callback for adding a new item
 * @param {Function} props.onReorderItem - Callback for reordering an item
 * @param {Object} ref - Forwarded ref for parent component to access methods
 */
const CardGridComponent = forwardRef(({ 
  items, 
  sticky = [], 
  onReorder, 
  onToggleSticky, 
  onAnimationComplete,
  onRemoveItem,
  onAddItem,
  onReorderItem
}, ref) => {
  const gridRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false); // State to track animation status
  const [showAddDialog, setShowAddDialog] = useState(false); // State to control add item dialog
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
        // Prefer clientWidth/clientHeight to avoid fractional subpixel layout issues
        const width = Math.max(0, Math.floor(gridRef.current.clientWidth));
        const height = Math.max(0, Math.floor(gridRef.current.clientHeight));
        setGridDimensions({ width, height });
      };
      
      updateDimensions();
      
      // Update dimensions on window resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);
  
  // Calculate positions for cards in a grid layout
  const calculatePositions = useCallback(() => {
    console.log('[CardGrid] Calculating positions. Grid Width:', gridDimensions.width, 'Items Length:', items.length);
    if (gridDimensions.width > 0 && items.length > 0) {
      // Use effective dimensions from constants (including margin)
      const cardWidth = EFFECTIVE_CARD_WIDTH; 
      const cardHeight = EFFECTIVE_CARD_HEIGHT; 
      
      // Calculate how many cards can fit in a row
  // Add a tiny horizontal buffer to ensure we don't clip due to rounding or borders
  const effectiveWidth = Math.max(0, gridDimensions.width - 6);
  const cardsPerRow = Math.max(1, Math.floor(effectiveWidth / cardWidth));
      
      // Calculate positions for each card
      const newPositions = items.map((_, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        return {
          x: col * cardWidth,
          y: row * cardHeight
        };
      });

  // Determine required height to contain all rows of cards. Use EFFECTIVE_CARD_HEIGHT
  const numRows = Math.ceil(items.length / cardsPerRow);
  const requiredHeight = numRows * cardHeight;

  // Account for vertical padding on the container (Tailwind p-8 = 2rem = 32px per side)
  // so add the top+bottom padding so the inline minHeight truly contains cards.
  const containerVerticalPadding = 32 * 2; // px
  const totalRequiredHeight = requiredHeight + containerVerticalPadding;

  // Expose the calculated height via state so the component can set an inline style
  // on the container. Use the totalRequiredHeight which includes padding.
  setGridDimensions(prev => ({ ...prev, requiredHeight: totalRequiredHeight }));
      
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
  }, [gridDimensions.width, items]);
  
  // Update positions when grid dimensions or items change
  useEffect(() => {
    if (gridDimensions.width > 0 && items.length > 0 && !isAnimating) {
      const newPositions = calculatePositions();
      if (newPositions.length > 0) {
        setPositions(newPositions);
        isMounted.current = true; // Mark as mounted after first position calculation
      }
    }
  }, [items.length, gridDimensions, isAnimating, calculatePositions]);
  
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
      
      // Create a reverse mapping: oldIndex -> newIndex
      const reverseMapping = {};
      newOrder.forEach((oldIndex, newIndex) => {
        reverseMapping[oldIndex] = newIndex;
      });
      
      // Get the current positions of all cards after React has updated the DOM
      // But index them by their original indices for the animation
      items.forEach((_, newIndex) => {
        const cardElement = document.getElementById(`card-${newIndex}`);
        if (cardElement) {
          // Find the oldIndex that corresponds to this newIndex
          const oldIndex = newOrder[newIndex];
          // Store the element with its oldIndex as the key
          cardElements[oldIndex] = cardElement;
        }
      });
      
      // Get the bounding rect for the grid
      const gridRect = gridRef.current.getBoundingClientRect();
      
      // Create a timeline for the entire animation
      const mainTimeline = gsap.timeline({
        onComplete: () => {
          console.log('[CardGrid] FLIP animation timeline complete.');
          
          // Turn off internal animation state
          setIsAnimating(false);
          
          // Notify parent component that animation is complete
          if (onAnimationComplete) {
            console.log('[CardGrid] Calling onAnimationComplete callback');
            onAnimationComplete();
          }
        }
      });
      
      // For each card in the new order, calculate how it needs to move
      // and move it back to its old position
      newOrder.forEach((oldIndex, newIndex) => {
        const cardElement = cardElements[oldIndex];
        if (!cardElement) return;
        
        // Get the old position from our captured positions
        const oldPosition = cardPositionsRef.current[oldIndex];
        if (!oldPosition) return;
        
        // Immediately move the card back to its old position
        gsap.set(cardElement, {
          x: oldPosition.x,
          y: oldPosition.y,
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
          const cardElement = cardElements[oldIndex];
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
  
  // Handle double-click on empty space to add a new item
  const handleDoubleClick = (e) => {
    // Only trigger if clicking directly on the grid, not on a card
    if (e.target === gridRef.current || e.target.id === 'card-grid') {
      setShowAddDialog(true);
    }
  };

  return (
    <div 
      id="card-grid"
      ref={gridRef}
      className="card-grid relative w-full min-h-[400px] p-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700 z-1"
      style={{
        // Only override the CSS min-h when our calculated requiredHeight is
        // larger than the design min (400px). This prevents shrinking below
        // the intended minimum and avoids the spurious scrollbar the user saw.
        minHeight: (gridDimensions.requiredHeight && gridDimensions.requiredHeight > 400)
          ? `${gridDimensions.requiredHeight}px`
          : undefined,
  // Allow the container to grow with content; avoid internal scrollbars when full
  overflowY: 'visible',
        // Keep horizontal overflow hidden to prevent layout shift
        overflowX: 'hidden'
      }}
      aria-label="Card grid containing randomizable items"
      role="region"
      onDoubleClick={handleDoubleClick}
    >
      {/* Grid background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: `${EFFECTIVE_CARD_WIDTH}px ${EFFECTIVE_CARD_HEIGHT}px`
        }}></div>
      </div>
      
      {/* Animation status indicator removed */}
      
      {/* Empty state */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium">No items to display</p>
            <p className="text-sm mt-2">Add some items in settings to get started</p>
          </div>
        </div>
      )}
      
      {/* Cards */}
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          id={`card-${index}`}
          className="absolute transition-opacity"
          // Always maintain the transform style, but let GSAP override it during animation
          // This prevents the cards from jumping to origin (0,0) when animation starts
          style={{
            transform: `translate(${positions[index]?.x || 0}px, ${positions[index]?.y || 0}px)`,
            // Add a pointer-events property to prevent interaction during animation
            pointerEvents: isAnimating ? 'none' : 'auto',
            // Ensure each card has a unique z-index to prevent overlapping
            zIndex: isAnimating ? (isSticky(index, sticky) ? 20 : 10) : index + 1,
            // Add a subtle opacity transition during animation
            opacity: isAnimating ? 0.95 : 1
          }}
        >
          <Card
            ref={cardRefs.current[index]}
            item={item}
            index={index}
            isSticky={isSticky(index, sticky)}
            onToggleSticky={() => onToggleSticky(index)}
            onRemoveItem={onRemoveItem}
            onReorderItem={onReorderItem}
            totalItems={items.length}
          />
        </div>
      ))}
      
      {/* Add Item Dialog */}
      {showAddDialog && (
        <AddItemDialog 
          onAdd={(itemName) => {
            onAddItem(itemName);
            setShowAddDialog(false);
          }}
          onCancel={() => setShowAddDialog(false)}
        />
      )}
      
      {/* Card count indicator */}
      <div className="absolute bottom-3 right-3 bg-gray-800 bg-opacity-60 backdrop-blur-sm text-xs text-gray-300 px-2 py-1 rounded-full flex items-center space-x-1.5 border border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
        <span>{items.length} items</span>
        {sticky.length > 0 && (
          <span className="flex items-center ml-1">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></span>
            {sticky.length} sticky
          </span>
        )}
      </div>
    </div>
  );
});

export default React.memo(CardGridComponent);
