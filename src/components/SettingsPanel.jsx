import { useState, useEffect } from 'react';
import { animationDefinitions, getEnabledAnimations, setEnabledAnimations } from '../animations';
import { getDisplayName, getExportValue } from '../utils/URLManager';
import { 
  loadTabSwitchAnimation, 
  saveTabSwitchAnimation,
  loadAutoCopy,
  saveAutoCopy,
  loadAnimateStickyCards,
  saveAnimateStickyCards
} from '../utils/LocalStorageManager';

/**
 * SettingsPanel component for configuring the application
 * 
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether the panel is open
 * @param {Array} props.items - Array of items
 * @param {Array} props.sticky - Array of sticky item indices
 * @param {String} props.template - Template string for clipboard copy
 * @param {Boolean} props.tabSwitchAnimation - Whether tab switch animation is enabled
 * @param {Boolean} props.autoCopy - Whether auto copy is enabled
 * @param {Boolean} props.animateStickyCards - Whether sticky cards should be animated
 * @param {Function} props.onUpdateItems - Callback for updating items
 * @param {Function} props.onUpdateSticky - Callback for updating sticky items
 * @param {Function} props.onUpdateTemplate - Callback for updating template
 * @param {Function} props.onUpdateTabSwitchAnimation - Callback for updating tab switch animation
 * @param {Function} props.onUpdateAutoCopy - Callback for updating auto copy
 * @param {Function} props.onUpdateAnimateStickyCards - Callback for updating animate sticky cards
 * @param {Function} props.onClose - Callback for closing the panel
 */
const SettingsPanel = ({
  isOpen,
  items,
  sticky,
  template,
  tabSwitchAnimation,
  autoCopy,
  animateStickyCards,
  onUpdateItems,
  onUpdateSticky,
  onUpdateTemplate,
  onUpdateTabSwitchAnimation,
  onUpdateAutoCopy,
  onUpdateAnimateStickyCards,
  onClose
}) => {
  // Convert items to text for textarea
  const itemsToText = (items) => {
    return items.map(item => {
      if (typeof item === 'string') {
        return item;
      }
      // If it's an object with name and export properties
      if (item.name === item.export) {
        return item.name;
      }
      return `${item.name} -> ${item.export}`;
    }).join('\n');
  };
  
  const [itemsText, setItemsText] = useState(itemsToText(items));
  const [templateText, setTemplateText] = useState(template);
  const [enabledAnimations, setEnabledAnimationsState] = useState(getEnabledAnimations());
  const [isTabSwitchAnimationEnabled, setIsTabSwitchAnimationEnabled] = useState(tabSwitchAnimation);
  const [isAutoCopyEnabled, setIsAutoCopyEnabled] = useState(autoCopy);
  const [isAnimateStickyCardsEnabled, setIsAnimateStickyCardsEnabled] = useState(animateStickyCards);
  
  // Update state when props change
  useEffect(() => {
    setItemsText(itemsToText(items));
    setTemplateText(template);
    setIsTabSwitchAnimationEnabled(tabSwitchAnimation);
    setIsAutoCopyEnabled(autoCopy);
    setIsAnimateStickyCardsEnabled(animateStickyCards);
  }, [items, template, tabSwitchAnimation, autoCopy, animateStickyCards]);
  
  // Handle saving changes
  const handleSave = () => {
    // Parse items from textarea
    const newItems = itemsText
      .split('\n')
      .map(line => {
        const line_trim = line.trim();
        if (line_trim.length === 0) return null;
        
        // Check if the line has the format "name -> export"
        const arrowMatch = line_trim.match(/^(.+?)\s*->\s*(.+)$/);
        if (arrowMatch) {
          const name = arrowMatch[1].trim();
          const exportValue = arrowMatch[2].trim();
          return { name, export: exportValue };
        }
        
        // Otherwise, it's a simple string item
        return line_trim;
      })
      .filter(item => item !== null);
    
    // Update items
    if (onUpdateItems) {
      onUpdateItems(newItems);
    }
    
    // Update template
    if (onUpdateTemplate && templateText !== template) {
      onUpdateTemplate(templateText);
    }
    
    // Update enabled animations
    setEnabledAnimations(enabledAnimations);
    
    // Update tab switch animation
    if (onUpdateTabSwitchAnimation && isTabSwitchAnimationEnabled !== tabSwitchAnimation) {
      saveTabSwitchAnimation(isTabSwitchAnimationEnabled);
      onUpdateTabSwitchAnimation(isTabSwitchAnimationEnabled);
    }
    
    // Update auto copy
    if (onUpdateAutoCopy && isAutoCopyEnabled !== autoCopy) {
      saveAutoCopy(isAutoCopyEnabled);
      onUpdateAutoCopy(isAutoCopyEnabled);
    }
    
    // Update animate sticky cards
    if (onUpdateAnimateStickyCards && isAnimateStickyCardsEnabled !== animateStickyCards) {
      saveAnimateStickyCards(isAnimateStickyCardsEnabled);
      onUpdateAnimateStickyCards(isAnimateStickyCardsEnabled);
    }
    
    // Close panel
    if (onClose) {
      onClose();
    }
  };
  
  // Handle toggling an animation
  const handleToggleAnimation = (key) => {
    setEnabledAnimationsState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button
              className="text-gray-400 hover:text-gray-200 transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          {/* Template Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Template</h3>
            <p className="text-sm text-gray-400 mb-2">
              Use {'{'}<span className="font-mono">item</span>{'}'} as a placeholder for each item when copying to clipboard.
              You can also use {'{'}<span className="font-mono">pad:N</span>{'}'} to add padding spaces (e.g., {'{'}<span className="font-mono">pad:10</span>{'}'} adds spaces to make the item 10 characters long).
            </p>
            <input
              type="text"
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Template (e.g. {item} or {pad:10}{item})"
            />
          </div>
          
          {/* Behavior Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Behavior</h3>
            
            {/* Tab Switch Animation */}
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="tabSwitchAnimation"
                checked={isTabSwitchAnimationEnabled}
                onChange={() => setIsTabSwitchAnimationEnabled(!isTabSwitchAnimationEnabled)}
                className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
              />
              <label htmlFor="tabSwitchAnimation" className="ml-2 text-sm text-gray-300">
                Run animation when switching back to this tab (keeps current order)
              </label>
            </div>
            
            {/* Auto Copy */}
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="autoCopy"
                checked={isAutoCopyEnabled}
                onChange={() => setIsAutoCopyEnabled(!isAutoCopyEnabled)}
                className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
              />
              <label htmlFor="autoCopy" className="ml-2 text-sm text-gray-300">
                Automatically copy list to clipboard when randomizing
              </label>
            </div>
            
            {/* Animate Sticky Cards */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="animateStickyCards"
                checked={isAnimateStickyCardsEnabled}
                onChange={() => setIsAnimateStickyCardsEnabled(!isAnimateStickyCardsEnabled)}
                className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
              />
              <label htmlFor="animateStickyCards" className="ml-2 text-sm text-gray-300">
                Animate sticky cards (when disabled, sticky cards stay in place)
              </label>
            </div>
          </div>
          
          {/* Animation Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Animations</h3>
            <p className="text-sm text-gray-400 mb-2">
              Select which animations to include in the random pool.
            </p>
            
            <div className="flex gap-4">
              {/* Available Animations Column */}
              <div className="flex-1 border border-gray-700 rounded-md bg-gray-800 p-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-300">Available</h4>
                  <button 
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                    onClick={() => {
                      // Add all available animations to selected
                      const allEnabled = Object.keys(animationDefinitions).reduce((acc, key) => {
                        acc[key] = true;
                        return acc;
                      }, {});
                      setEnabledAnimationsState(allEnabled);
                    }}
                  >
                    Add All →
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {Object.entries(animationDefinitions).map(([key, def]) => {
                    // Only show if not enabled
                    if (enabledAnimations[key]) return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-center p-1 hover:bg-gray-700 rounded">
                        <span className="text-sm text-gray-300">{def.name}</span>
                        <button 
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                          onClick={() => handleToggleAnimation(key)}
                        >
                          →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Selected Animations Column */}
              <div className="flex-1 border border-gray-700 rounded-md bg-gray-800 p-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-300">Selected</h4>
                  <button 
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                    onClick={() => {
                      // Remove all selected animations
                      const allDisabled = Object.keys(animationDefinitions).reduce((acc, key) => {
                        acc[key] = false;
                        return acc;
                      }, {});
                      setEnabledAnimationsState(allDisabled);
                    }}
                  >
                    ← Remove All
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {Object.entries(animationDefinitions).map(([key, def]) => {
                    // Only show if enabled
                    if (!enabledAnimations[key]) return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-center p-1 hover:bg-gray-700 rounded">
                        <button 
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                          onClick={() => handleToggleAnimation(key)}
                        >
                          ←
                        </button>
                        <span className="text-sm text-gray-300">{def.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sticky Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Sticky Items</h3>
            <p className="text-sm text-gray-400 mb-2">
              Sticky items won't move when randomizing. Click to toggle.
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <button
                  key={index}
                  className={`
                    px-3 py-1 text-sm rounded-full
                    ${sticky.includes(index)
                      ? 'bg-yellow-900 border-yellow-600 text-yellow-300'
                      : 'bg-gray-800 border-gray-700 text-gray-300'}
                    border
                    hover:bg-opacity-80
                    transition-colors
                  `}
                  onClick={() => handleStickyToggle(index)}
                >
                  {getDisplayName(item)}
                </button>
              ))}
            </div>
          </div>
          
          {/* List Editor */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Edit List</h3>
            <p className="text-sm text-gray-400 mb-2">
              One item per line. For different display and export values, use: "Display Name {'->'} Export Value"
            </p>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              className="w-full h-40 p-2 bg-gray-800 border border-gray-700 rounded-md font-mono text-sm text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder={`Enter items, one per line
Example:
Item 1
Display Name -> Export Value
🎉`}
            />
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg"
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
