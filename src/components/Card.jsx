import { useRef, forwardRef, useState, useEffect, useCallback } from 'react';
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
 * @param {Function} props.onRemoveItem - Callback for removing the item
 * @param {Function} props.onReorderItem - Callback for reordering the item
 * @param {Number} props.totalItems - Total number of items in the grid
 * @param {Object} ref - Forwarded ref for parent component to access methods
 */
const Card = forwardRef(({ item, index, isSticky, onToggleSticky, onRemoveItem, onReorderItem, totalItems }, ref) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Get the display name for the item
  const displayName = getDisplayName(item);
  
  // Check if the display name should be stretched (emoji or two characters)
  const shouldStretchDisplay = shouldStretch(displayName);
  
  // Check if text is long (more than 20 characters)
  const isLongText = !shouldStretchDisplay && displayName.length > 20;
  
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
  
  // Generate a gradient based on the border color
  const generateGradient = (color) => {
    // Extract the hue from the HSL color
    const hueMatch = color.match(/hsl\((\d+),\s*70%,\s*65%\)/);
    const hue = hueMatch ? parseInt(hueMatch[1]) : 0;
    
    // Create a gradient with the same hue but different saturation/lightness
    return `linear-gradient(135deg, 
      hsl(${hue}, 80%, 20%) 0%, 
      hsl(${hue}, 70%, 25%) 100%)`;
  };
  
  const backgroundGradient = generateGradient(borderColor);
  
  // Handle keyboard events for card interactions
  const handleKeyDown = useCallback(
    (e) => {
      if (isHovered) {
        if (e.key === 'Delete') {
          e.preventDefault();
          if (onRemoveItem) {
            onRemoveItem(index);
          }
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();

          let newIndex = index;

          // Calculate new position based on key pressed
          switch (e.key) {
            case 'ArrowUp':
              newIndex = Math.max(0, index - 1);
              break;
            case 'ArrowDown':
              newIndex = Math.min(totalItems - 1, index + 1);
              break;
            case 'ArrowLeft':
              newIndex = Math.max(0, index - 1);
              break;
            case 'ArrowRight':
              newIndex = Math.min(totalItems - 1, index + 1);
              break;
            case 'Home':
              newIndex = 0;
              break;
            case 'End':
              newIndex = totalItems - 1;
              break;
          }

          if (newIndex !== index && onReorderItem) {
            onReorderItem(index, newIndex);
          }
        }
      }
    },
    [isHovered, index, totalItems, onRemoveItem, onReorderItem]
  );

  // Add/remove keyboard event listeners when hover state changes
  useEffect(() => {
    if (isHovered) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isHovered, handleKeyDown]);
  
  // Handle mouse events for card interactions
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  
  // Use GSAP for hover effects
  useGSAP(() => {
    if (cardRef.current) {
      if (isHovered && !isPressed) {
        gsap.to(cardRef.current, {
          scale: 1.05,
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
          duration: 0.2,
          ease: 'power2.out'
        });
      } else if (isPressed) {
        gsap.to(cardRef.current, {
          scale: 0.98,
          boxShadow: '0 5px 15px rgba(79, 70, 229, 0.2)',
          duration: 0.1,
          ease: 'power2.out'
        });
      } else {
        gsap.to(cardRef.current, {
          scale: 1,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    }
  }, [isHovered, isPressed, isSticky]);

  return (
    <div 
      ref={cardRef}
      data-card-index={index}
      className={`
        relative
        flex items-center justify-center
        rounded-xl
        transition-colors
        overflow-hidden
        select-none
        border border-gray-700
        group
      `}
      style={{
        width: `${BASE_CARD_WIDTH}px`,
        height: `${BASE_CARD_HEIGHT}px`,
        borderLeft: `4px solid ${borderColor}`,
        background: 'rgba(17, 24, 39, 0.95)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-label={`Card: ${displayName}${isSticky ? ' (Sticky)' : ''}`}
    >
      {/* Card background gradient overlay */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: backgroundGradient }}
      />
      
      {/* Sticky indicator */}
      {isSticky && (
        <div className="absolute top-2 right-2 flex items-center">
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="text-base">📌</span>
          </div>
        </div>
      )}
      
      {/* Card content */}
      {shouldStretchDisplay ? (
        <div className="flex items-center justify-center w-full h-full z-10">
          <span className="text-6xl" style={{ fontSize: '5rem', lineHeight: '1' }}>
            {displayName}
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3 z-10">
          <p 
            className={`
              text-center text-gray-100 font-medium
              ${isLongText ? 'text-sm' : ''}
              ${isLongText && !isHovered ? 'line-clamp-3' : 'break-words'}
              transition-all duration-200
            `}
          >
            {displayName}
          </p>
        </div>
      )}
      
      {/* Sticky toggle button */}
      <button
        className="absolute bottom-2 right-2 w-7 h-7 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-100 border border-gray-700 z-20"
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleSticky) {
            onToggleSticky(index);
          }
        }}
        title={isSticky ? "Make non-sticky" : "Make sticky"}
        aria-label={isSticky ? "Remove sticky status" : "Make sticky"}
      >
        <span className="text-xs">{isSticky ? '📌' : '📌'}</span>
      </button>
      
      {/* Card index badge */}
      <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-60 backdrop-blur-sm text-xs text-gray-300 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {index + 1}
      </div>
    </div>
  );
});

export default Card;
