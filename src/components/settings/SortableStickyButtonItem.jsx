import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { getDisplayName } from '../../utils/URLManager';

/**
 * SortableStickyButtonItem component for displaying and reordering StickyButtonItems using dnd-kit
 * 
 * @param {Object} props
 * @param {Object|String} props.item - The item to display
 * @param {Number} props.index - The index of the item
 * @param {Boolean} props.isSticky - Whether the item is sticky
 * @param {Function} props.onToggle - Callback for toggling sticky status
 * @param {String} props.id - Unique identifier for the sortable item
 */
const SortableStickyButtonItem = ({ 
  item, 
  index, 
  isSticky, 
  onToggle,
  id
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
  } = useSortable({ 
    id,
    disabled: isSticky,
    data: {
      index,
      item,
      isSticky
    }
  });

  // Apply the transform and transition styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    touchAction: 'none', // Prevents touch scrolling while dragging
    boxShadow: isDragging ? '0 5px 15px rgba(0, 0, 0, 0.3)' : 'none',
    scale: isDragging ? '1.05' : '1', // Slightly scale up when dragging for better feedback
  };

  // Track if we've started a drag operation
  const [hasDragged, setHasDragged] = useState(false);
  
  // Reset hasDragged when drag ends
  useEffect(() => {
    if (!isDragging && hasDragged) {
      // Use a small timeout to ensure this happens after the click event
      const timeout = setTimeout(() => {
        setHasDragged(false);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [isDragging, hasDragged]);
  
  // Update hasDragged when drag starts
  useEffect(() => {
    if (isDragging) {
      setHasDragged(true);
    }
  }, [isDragging]);
  
  // Handle click to toggle sticky status
  const handleClick = (e) => {
    // Only toggle if it's a click, not a drag
    if (!hasDragged && !isDragging && !active) {
      onToggle();
    }
  };

  return (
    <button
      ref={setNodeRef}
      data-index={index}
      className={`
        px-3 py-1 text-sm rounded-full
        ${isSticky
          ? 'bg-gray-700 border-gray-600 text-white'
          : 'bg-gray-800 border-gray-700 text-gray-300'}
        border
        hover:bg-opacity-80
        transition-colors
        flex items-center
        cursor-pointer
        ${isDragging ? 'cursor-grabbing shadow-lg' : ''}
        ${isDragging ? 'border-indigo-400' : ''}
      `}
      onClick={handleClick}
      style={style}
      title={`Click to ${isSticky ? 'unstick' : 'stick'} this item`}
      {...attributes}
    >
      {/* Conditionally render drag handle */}
      {!isSticky && (
        <span 
          className="mr-1 text-xs text-gray-400 transition-colors hover:text-indigo-400 cursor-grab"
          title="Drag to reorder"
          {...listeners}
        >
          ⠿
        </span>
      )}
      
      {isSticky && (
        <span className="mr-1 text-xs">📌</span>
      )}
      {getDisplayName(item)}
    </button>
  );
};

export default SortableStickyButtonItem;
