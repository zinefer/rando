import { useRef, forwardRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getDisplayName, shouldStretch } from '../utils/URLManager';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

// Register the plugins
gsap.registerPlugin(useGSAP);

/**
 * Card component for displaying an individual item
 * 
 * @param {Object} props
 * @param {String|Object} props.item - The item (string or object with name/export properties)
 * @param {Number} props.index - The index of the item in the list
 * @param {Boolean} props.isSticky - Whether the item is sticky (won't shuffle)
 * @param {Function} props.onToggleSticky - Callback for toggling sticky status
 * @param {Object} ref - Forwarded ref for parent component to access methods
 */
const Card = forwardRef(({ item, index, isSticky, onToggleSticky }, ref) => {
  const cardRef = useRef(null);
  
  // Get the display name for the item
  const displayName = getDisplayName(item);
  
  // Check if the display name should be stretched (emoji or two characters)
  const shouldStretchDisplay = shouldStretch(displayName);
  
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
  
  const borderColor = generateColor(displayName);
  
  return (
    <div 
      ref={cardRef}
      data-card-index={index}
      className={`
        relative
        flex items-center justify-center
        bg-gray-900
        rounded-lg
        shadow-[0_0_15px_rgba(0,0,0,0.3)]
        transition-all
        hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]
        hover:scale-105
        overflow-hidden
        select-none
        border border-gray-700
      `}
      style={{
        width: `${BASE_CARD_WIDTH}px`,
        height: `${BASE_CARD_HEIGHT}px`,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: isSticky ? '0 0 15px rgba(234, 179, 8, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Sticky indicator */}
      {isSticky && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
      )}
      
      {/* Card content */}
      {shouldStretchDisplay ? (
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-6xl" style={{ fontSize: '5rem', lineHeight: '1' }}>
            {displayName}
          </span>
        </div>
      ) : (
        <p className="text-center p-2 text-gray-100 font-medium break-words">
          {displayName}
        </p>
      )}
      
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
});

export default Card;
