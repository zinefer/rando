import { useState } from 'react';

/**
 * SettingsPanel component for configuring the application
 * 
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether the panel is open
 * @param {Array} props.items - Array of items
 * @param {Array} props.sticky - Array of sticky item indices
 * @param {String} props.template - Template string for clipboard copy
 * @param {Function} props.onUpdateItems - Callback for updating items
 * @param {Function} props.onUpdateSticky - Callback for updating sticky items
 * @param {Function} props.onUpdateTemplate - Callback for updating template
 * @param {Function} props.onClose - Callback for closing the panel
 */
const SettingsPanel = ({
  isOpen,
  items,
  sticky,
  template,
  onUpdateItems,
  onUpdateSticky,
  onUpdateTemplate,
  onClose
}) => {
  const [itemsText, setItemsText] = useState(items.join('\n'));
  const [templateText, setTemplateText] = useState(template);
  
  // Handle saving changes
  const handleSave = () => {
    // Parse items from textarea
    const newItems = itemsText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    // Update items
    if (onUpdateItems) {
      onUpdateItems(newItems);
    }
    
    // Update template
    if (onUpdateTemplate && templateText !== template) {
      onUpdateTemplate(templateText);
    }
    
    // Close panel
    if (onClose) {
      onClose();
    }
  };
  
  // Handle sticky toggle for an item
  const handleStickyToggle = (index) => {
    if (onUpdateSticky) {
      const newSticky = [...sticky];
      const stickyIndex = newSticky.indexOf(index);
      
      if (stickyIndex === -1) {
        newSticky.push(index);
      } else {
        newSticky.splice(stickyIndex, 1);
      }
      
      onUpdateSticky(newSticky);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          {/* Template Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Template</h3>
            <p className="text-sm text-gray-600 mb-2">
              Use {'{item}'} as a placeholder for each item when copying to clipboard.
            </p>
            <input
              type="text"
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Template (e.g. {item})"
            />
          </div>
          
          {/* Sticky Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Sticky Items</h3>
            <p className="text-sm text-gray-600 mb-2">
              Sticky items won't move when randomizing. Click to toggle.
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <button
                  key={index}
                  className={`
                    px-3 py-1 text-sm rounded-full
                    ${sticky.includes(index)
                      ? 'bg-yellow-200 border-yellow-400'
                      : 'bg-gray-100 border-gray-300'}
                    border
                    hover:bg-yellow-100
                    transition-colors
                  `}
                  onClick={() => handleStickyToggle(index)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          
          {/* List Editor */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Edit List</h3>
            <p className="text-sm text-gray-600 mb-2">
              One item per line. Changes will update the URL.
            </p>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="Enter items, one per line"
            />
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
