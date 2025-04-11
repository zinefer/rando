import React, { useCallback, useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import SortableStickyButtonItem from './SortableStickyButtonItem';
import { getDisplayName } from '../../utils/URLManager';
import { UI_CONSTANTS, TEMPLATE_SEPARATOR } from '../../constants/appConstants';

/**
 * ListEditorTab component for editing the list and managing sticky items
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items
 * @param {Array} props.sticky - Array of sticky item indices
 * @param {String} props.itemsText - Text representation of items
 * @param {Function} props.setItemsText - Callback for updating items text
 * @param {Function} props.handleStickyToggle - Callback for toggling sticky status
 * @param {Function} props.handleSortItems - Callback for sorting items
 * @param {Function} props.handleAddItem - Callback for adding a new item
 * @param {Function} props.handleClearItems - Callback for clearing all items
 * @param {Function} props.onUpdateSticky - Callback for updating sticky array
 * @param {Function} props.onUpdateItems - Callback for updating all items
 */
const ListEditorTab = ({
  items,
  sticky,
  itemsText,
  setItemsText,
  handleStickyToggle,
  handleSortItems,
  handleAddItem,
  handleClearItems,
  onUpdateSticky,
  onUpdateItems
}) => {
  // State for active drag item
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [activeIsSticky, setActiveIsSticky] = useState(false);
  const [isOverStickyTarget, setIsOverStickyTarget] = useState(false); // State for hover feedback

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Get the data from the active item
    const index = items.findIndex((_, i) => `item-${i}` === active.id);
    if (index !== -1) {
      setActiveItem(items[index]);
      setActiveIsSticky(sticky.includes(index));
    }
  }, [items, sticky]);

  // Handle drag over event for feedback
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    if (over) {
      const overIndex = items.findIndex((_, i) => `item-${i}` === over.id);
      setIsOverStickyTarget(sticky.includes(overIndex));
    } else {
      // Reset if not hovering over anything
      setIsOverStickyTarget(false);
    }
  }, [items, sticky]);

  // Handle drag end event
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    // Reset active states and hover feedback state
    setActiveId(null);
    setActiveItem(null);
    setActiveIsSticky(false);
    setIsOverStickyTarget(false); 
    
    // Only proceed if we have a valid drop target
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = items.findIndex((_, i) => `item-${i}` === over.id);
      
      // Don't allow moving items from sticky slots
      if (sticky.includes(oldIndex)) {
        return;
      }
      
      // Implement the custom move logic that preserves sticky slots
      function moveItemPreservingSticky(items, from, to, stickySlots) {
        // Create a new array for the result
        const result = new Array(items.length);
        
        // First, place all items from sticky slots
        stickySlots.forEach(index => {
          result[index] = items[index];
        });
        
        // Create an array of the non-sticky items in their original order
        const nonStickyItems = items.filter((_, index) => !stickySlots.includes(index));
        
        // If we're moving a non-sticky item
        if (!stickySlots.includes(from)) {
          // Get the item we're moving
          const movingItem = items[from];
          
          // Find its position in the nonStickyItems array
          const movingItemIndexInNonSticky = nonStickyItems.findIndex(item => 
            JSON.stringify(item) === JSON.stringify(movingItem));
          
          // Remove it from its current position
          nonStickyItems.splice(movingItemIndexInNonSticky, 1);
          
          // Calculate the adjusted target position in the nonStickyItems array
          let adjustedTo = to;
          
          // Count how many sticky slots are before the target position
          const stickySlotsBeforeTarget = stickySlots.filter(index => index < to).length;
          
          // Adjust the target position
          adjustedTo -= stickySlotsBeforeTarget;
          
          // Make sure the adjusted position is valid
          adjustedTo = Math.max(0, Math.min(adjustedTo, nonStickyItems.length));
          
          // Insert the item at the adjusted position
          nonStickyItems.splice(adjustedTo, 0, movingItem);
        }
        
        // Now place the non-sticky items in the remaining slots
        let nonStickyIndex = 0;
        for (let i = 0; i < result.length; i++) {
          // Skip slots that already have sticky items
          if (result[i] === undefined) {
            result[i] = nonStickyItems[nonStickyIndex++];
          }
        }
        
        return result;
      }
      
      // Apply our custom move function
      const newItems = moveItemPreservingSticky(items, oldIndex, newIndex, sticky);
      
      // Update all items with the new order
      if (onUpdateItems) {
        onUpdateItems(newItems);
        
        // Update the itemsText to reflect the new order
        const newItemsText = newItems
          .map(item => {
            if (typeof item === 'string') {
              return item;
            }
            // If it's an object with name and export properties
            if (item.name === item.export) {
              return item.name;
            }
            return `${item.name}${UI_CONSTANTS.NAME_EXPORT_SEPARATOR}${item.export}`;
          })
          .join('\n');
        
        setItemsText(newItemsText);
      }
    }
  }, [items, sticky, onUpdateItems, onUpdateSticky, setItemsText]);
  
  return (
    <div>
      {/* List Editor */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-indigo-300">Edit List</h3>
          <div className="flex space-x-2">
            <button
              className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded border border-gray-700 hover:bg-gray-700"
              onClick={handleSortItems}
              title="Sort alphabetically"
            >
              Sort A-Z
            </button>
            <button
              className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded border border-gray-700 hover:bg-gray-700"
              onClick={handleAddItem}
              title="Add new item"
            >
              Add Item
            </button>
            <button
              className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded border border-gray-700 hover:bg-gray-700"
              onClick={handleClearItems}
              title="Clear all items"
            >
              Clear All
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-2">
          One item per line. For different display and export values, use: "Display Name{TEMPLATE_SEPARATOR}Export Value"
        </p>
        
        <div className="relative font-mono text-sm">
          <div className="absolute top-0 left-0 w-8 bottom-1.5 bg-gray-800 border-r border-gray-700 flex flex-col items-center pt-2 text-gray-500 select-none">
            {itemsText.split('\n').map((_, i) => (
              <div key={i} className="w-full text-center text-xs leading-5">{i + 1}</div>
            ))}
          </div>
          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            className="w-full h-60 p-2 pl-10 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder={`Enter items, one per line
Example:
Item 1
Display Name${TEMPLATE_SEPARATOR}Export Value
🎉`}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Items: {itemsText.split('\n').filter(line => line.trim() !== '').length}</span>
          <span>Format: One item per line</span>
        </div>
      </div>
      
      {/* Sticky Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-indigo-300 mb-2">Sticky Items</h3>
        <p className="text-sm text-gray-400 mb-2">
          Sticky slots won't change when randomizing or reordering. Click an item to toggle sticky status for its position. Items in sticky slots can't be moved, but non-sticky items flow around them when reordered.
        </p>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: 'always' // Always measure to improve accuracy
            }
          }}
        >
          <SortableContext 
            items={items.map((_, index) => `item-${index}`)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-700 rounded-md bg-gray-800">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No items available</p>
              ) : (
                items.map((item, index) => (
                  <SortableStickyButtonItem 
                    key={`item-${index}`}
                    id={`item-${index}`}
                    item={item}
                    index={index}
                    isSticky={sticky.includes(index)}
                    onToggle={() => handleStickyToggle(index)}
                    isDraggable={!sticky.includes(index)} // Disable drag for items in sticky slots
                  />
                ))
              )}
            </div>
          </SortableContext>
          
          {/* Drag Overlay - shows a preview of the item being dragged */}
          <DragOverlay
            dropAnimation={{
              duration: 300, // Slightly longer animation for better visibility
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)', // Bounce-like effect
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.7', // Increased opacity for better visibility
                  },
                },
              }),
            }}
          >
            {activeId ? (
              <div
                className={`
                  px-3 py-1 text-sm rounded-full
                  ${activeIsSticky
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300'}
                  border ${isOverStickyTarget ? 'border-red-500' : 'border-indigo-400'} // Conditional border
                  flex items-center
                  shadow-lg
                  transition-colors duration-100 // Smooth border color transition
                `}
                style={{
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Drag handle icon */}
                <span className="mr-1 text-xs text-gray-400">⠿</span>
                
                {/* Sticky pin icon */}
                {activeIsSticky && (
                  <span className="mr-1 text-xs">📌</span>
                )}
                
                {/* Item name */}
                {activeItem && getDisplayName(activeItem)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default ListEditorTab;
