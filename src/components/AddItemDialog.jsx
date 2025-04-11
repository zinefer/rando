import { useState, useEffect, useRef } from 'react';

/**
 * AddItemDialog component for adding new items
 * 
 * @param {Object} props
 * @param {Function} props.onAdd - Callback for when an item is added
 * @param {Function} props.onCancel - Callback for when the dialog is cancelled
 */
const AddItemDialog = ({ onAdd, onCancel }) => {
  const [itemName, setItemName] = useState('');
  const inputRef = useRef(null);
  
  // Focus the input when the dialog opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Add escape key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (itemName.trim()) {
      onAdd(itemName.trim());
    } else {
      onCancel();
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 w-full max-w-md mx-4 relative z-10 animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Add New Item</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-2">
              Item Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="itemName"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemDialog;
