import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Card from './Card';
import { isSticky } from '../utils/URLManager';

/**
 * CardGrid component for displaying and managing the grid of cards
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Array} props.sticky - Array of sticky item indices
 * @param {Function} props.onReorder - Callback for when items are reordered
 * @param {Function} props.onToggleSticky - Callback for toggling sticky status
 */
const CardGrid = ({ items, sticky = [], onReorder, onToggleSticky }) => {
  const gridRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
  
  // Calculate grid dimensions and initial positions
  useEffect(() => {
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
      
      setPositions(newPositions);
    }
  }, [items, gridDimensions]);
  
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
  
  // Shuffle animation
  const animateShuffle = (newOrder) => {
    // Animate each card to its new position
    newOrder.forEach((itemIndex, newIndex) => {
      // Skip sticky items
      if (!isSticky(itemIndex, sticky)) {
        gsap.to(`#card-${itemIndex}`, {
          x: positions[newIndex].x,
          y: positions[newIndex].y,
          rotation: gsap.utils.random(-5, 5),
          duration: 0.8,
          ease: 'back.out(1.2)',
          delay: gsap.utils.random(0, 0.3)
        });
      }
    });
  };
  
  return (
    <div 
      id="card-grid"
      ref={gridRef}
      className="card-grid relative w-full min-h-[400px] p-4 bg-gray-50 rounded-lg"
    >
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          id={`card-${index}`}
          className="absolute"
          style={{
            transform: `translate(${positions[index]?.x || 0}px, ${positions[index]?.y || 0}px)`
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
};

export default CardGrid;
