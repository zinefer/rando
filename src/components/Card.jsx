import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

// Register the plugins
gsap.registerPlugin(Draggable, useGSAP);

/**
 * Card component for displaying an individual item
 * 
 * @param {Object} props
 * @param {String} props.item - The item text to display
 * @param {Number} props.index - The index of the item in the list
 * @param {Boolean} props.isSticky - Whether the item is sticky (won't shuffle)
 * @param {Function} props.onDragEnd - Callback for when dragging ends
 * @param {Function} props.onToggleSticky - Callback for toggling sticky status
 */
const Card = ({ item, index, isSticky, onDragEnd, onToggleSticky }) => {
  const cardRef = useRef(null);
  const draggableRef = useRef(null);
  
  // Generate a complementary color based on the item text
  const generateColor = (text) => {
    // Simple hash function to generate a number from text
    const hash = text.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Convert to HSL color (using hue only, with fixed saturation and lightness)
    // This ensures colors are always vibrant but not too dark or light
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 65%)`;
  };
  
  const borderColor = generateColor(item);
  
  // Set up draggable functionality using useEffect
  useEffect(() => {
    console.log(`[Card ${index}] Setting up draggable functionality`);
    
    if (cardRef.current) {
      // Clean up previous draggable instance if it exists
      if (draggableRef.current) {
        console.log(`[Card ${index}] Killing previous draggable instance`);
        draggableRef.current.kill();
      }
      
      // Create new draggable instance
      console.log(`[Card ${index}] Creating new draggable instance`);
      draggableRef.current = Draggable.create(cardRef.current, {
        type: 'x,y',
        bounds: '.card-grid',
        edgeResistance: 0.65,
        onDragStart: function() {
          console.log(`[Card ${index}] Drag started at x:${this.x}, y:${this.y}`);
        },
        onDrag: function() {
          // Uncomment for more verbose logging (can be noisy)
          // console.log(`[Card ${index}] Dragging at x:${this.x}, y:${this.y}`);
        },
        onDragEnd: function() {
          console.log(`[Card ${index}] Drag ended at x:${this.x}, y:${this.y}`);
          
          // Get the element's computed transform to verify position
          const transform = window.getComputedStyle(cardRef.current).transform;
          console.log(`[Card ${index}] Final computed transform: ${transform}`);
          
          // Get GSAP's internal tracking of the element position
          const gsapX = gsap.getProperty(cardRef.current, "x");
          const gsapY = gsap.getProperty(cardRef.current, "y");
          console.log(`[Card ${index}] GSAP position tracking: x:${gsapX}, y:${gsapY}`);
          
          // Compare with Draggable's position tracking
          console.log(`[Card ${index}] Draggable position tracking: x:${this.x}, y:${this.y}`);
          
          // Check for discrepancies
          if (Math.abs(gsapX - this.x) > 0.1 || Math.abs(gsapY - this.y) > 0.1) {
            console.warn(`[Card ${index}] Position tracking discrepancy between GSAP and Draggable!`);
          }
          
          if (onDragEnd) {
            console.log(`[Card ${index}] Calling onDragEnd callback with index:${index}, x:${this.x}, y:${this.y}`);
            onDragEnd(index, this.x, this.y);
          }
        }
      })[0];
      
      // Log the initial state of the draggable
      console.log(`[Card ${index}] Draggable created with initial position x:${draggableRef.current.x}, y:${draggableRef.current.y}`);
      console.log(`[Card ${index}] Draggable bounds:`, draggableRef.current.bounds);
    } else {
      console.error(`[Card ${index}] cardRef.current is null, cannot create draggable`);
    }
    
    return () => {
      if (draggableRef.current) {
        console.log(`[Card ${index}] Cleaning up draggable instance on unmount`);
        draggableRef.current.kill();
      }
    };
  }, [index, onDragEnd]);
  
  return (
    <div 
      ref={cardRef}
      data-card-index={index}
      className={`
        relative
        w-32 h-32
        flex items-center justify-center
        bg-gray-900
        rounded-lg
        shadow-[0_0_15px_rgba(0,0,0,0.3)]
        cursor-grab
        transition-all
        hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]
        hover:scale-105
        active:cursor-grabbing
        overflow-hidden
        select-none
        border border-gray-700
      `}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: isSticky ? '0 0 15px rgba(234, 179, 8, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Sticky indicator */}
      {isSticky && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
      )}
      
      {/* Card content */}
      <p className="text-center p-2 text-gray-100 font-medium break-words">
        {item}
      </p>
      
      {/* Sticky toggle button */}
      <button
        className="absolute bottom-1 right-1 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity border border-gray-700"
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleSticky) {
            onToggleSticky(index);
          }
        }}
        title={isSticky ? "Make non-sticky" : "Make sticky"}
      >
        <span className="text-xs">📌</span>
      </button>
    </div>
  );
};

export default Card;
