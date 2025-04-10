import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

// Register the Draggable plugin
gsap.registerPlugin(Draggable);

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
  
  // Set up draggable functionality
  useEffect(() => {
    if (cardRef.current) {
      // Clean up previous draggable instance if it exists
      if (draggableRef.current) {
        draggableRef.current.kill();
      }
      
      // Create new draggable instance
      draggableRef.current = Draggable.create(cardRef.current, {
        type: 'x,y',
        bounds: '.card-grid',
        edgeResistance: 0.65,
        onDragEnd: function() {
          if (onDragEnd) {
            onDragEnd(index, this.x, this.y);
          }
        }
      })[0];
    }
    
    return () => {
      if (draggableRef.current) {
        draggableRef.current.kill();
      }
    };
  }, [index, onDragEnd]);
  
  return (
    <div 
      ref={cardRef}
      className={`
        relative
        w-32 h-32
        flex items-center justify-center
        bg-white
        rounded-lg
        shadow-lg
        cursor-grab
        transition-transform
        hover:shadow-xl
        hover:scale-105
        active:cursor-grabbing
        overflow-hidden
        select-none
      `}
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      {/* Sticky indicator */}
      {isSticky && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-400 rounded-full" />
      )}
      
      {/* Card content */}
      <p className="text-center p-2 text-gray-800 font-medium break-words">
        {item}
      </p>
      
      {/* Sticky toggle button */}
      <button
        className="absolute bottom-1 right-1 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity"
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
