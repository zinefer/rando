import { useState, useEffect, useCallback } from 'react';

import { getEnabledAnimations, setEnabledAnimations } from '../animations';

import { UI_CONSTANTS } from '../constants/appConstants';

import {  
  saveTabSwitchAnimation,
  saveAutoCopy,
  saveAnimateStickyCards
} from '../utils/LocalStorageManager';

import {
  ListEditorTab,
  GeneralTab,
  AnimationsTab
} from './settings';

// Tab constants
const TABS = {
  LIST_EDITOR: 'list_editor',
  GENERAL: 'general',
  ANIMATIONS: 'animations'
};

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
      return `${item.name}${UI_CONSTANTS.NAME_EXPORT_SEPARATOR}${item.export}`;
    }).join('\n');
  };
  
  const [activeTab, setActiveTab] = useState(TABS.LIST_EDITOR);
  const [itemsText, setItemsText] = useState(itemsToText(items));
  const [templateText, setTemplateText] = useState(template);
  const [enabledAnimations, setEnabledAnimationsState] = useState(getEnabledAnimations());
  const [isTabSwitchAnimationEnabled, setIsTabSwitchAnimationEnabled] = useState(tabSwitchAnimation);
  const [isAutoCopyEnabled, setIsAutoCopyEnabled] = useState(autoCopy);
  const [isAnimateStickyCardsEnabled, setIsAnimateStickyCardsEnabled] = useState(animateStickyCards);
  const [animationSearchTerm, setAnimationSearchTerm] = useState('');
  
  // Handle ESC key to close settings
  const handleEscKey = useCallback((e) => {
    if (e.key === 'Escape' && isOpen && onClose) {
      onClose();
    }
  }, [isOpen, onClose]);
  
  // Add ESC key event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, handleEscKey]);
  
  // Update state when props change.
  // Note: we also explicitly reset local state when the panel opens so that
  // any unsaved changes are discarded if the user closed the panel without saving.
  useEffect(() => {
    // Keep in sync while the panel is open or when props change externally
    setItemsText(itemsToText(items));
    setTemplateText(template);
    setIsTabSwitchAnimationEnabled(tabSwitchAnimation);
    setIsAutoCopyEnabled(autoCopy);
    setIsAnimateStickyCardsEnabled(animateStickyCards);
  }, [items, template, tabSwitchAnimation, autoCopy, animateStickyCards]);

  // When the panel is opened, explicitly reset local editable state from props
  // This ensures any unsaved edits from a previous open are discarded.
  useEffect(() => {
    if (isOpen) {
      setItemsText(itemsToText(items));
      setTemplateText(template);
      setIsTabSwitchAnimationEnabled(tabSwitchAnimation);
      setIsAutoCopyEnabled(autoCopy);
      setIsAnimateStickyCardsEnabled(animateStickyCards);
      setEnabledAnimationsState(getEnabledAnimations());
    }
  }, [isOpen]);
  
  // Handle saving changes
  const handleSave = () => {
    // Parse items from textarea
    const newItems = itemsText
      .split('\n')
      .map(line => {
        const line_trim = line.trim();
        if (line_trim.length === 0) return null;
        
        // Check if the line has the format "name->export"
        const arrowMatch = line_trim.match(UI_CONSTANTS.NAME_EXPORT_SEPARATOR_PATTERN);
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

  // Sort items alphabetically
  const handleSortItems = () => {
    const lines = itemsText.split('\n').filter(line => line.trim() !== '');
    const sortedLines = [...lines].sort((a, b) => {
      // Extract display names for comparison
      const aMatch = a.match(UI_CONSTANTS.NAME_EXPORT_SEPARATOR_PATTERN);
      const bMatch = b.match(UI_CONSTANTS.NAME_EXPORT_SEPARATOR_PATTERN);
      
      const aName = aMatch ? aMatch[1].trim() : a.trim();
      const bName = bMatch ? bMatch[1].trim() : b.trim();
      
      return aName.localeCompare(bName);
    });
    
    setItemsText(sortedLines.join('\n'));
  };

  // Clear all items
  const handleClearItems = () => {
    if (window.confirm('Are you sure you want to clear all items?')) {
      setItemsText('');
    }
  };

  // Add a new item
  const handleAddItem = () => {
    const newItem = 'New Item';
    setItemsText(prev => {
      const currentItems = prev.trim();
      return currentItems ? `${currentItems}\n${newItem}` : newItem;
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button
              className="text-gray-400 hover:text-gray-200 transition-colors"
              onClick={onClose}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === TABS.LIST_EDITOR
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(TABS.LIST_EDITOR)}
            >
              List Editor
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === TABS.GENERAL
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(TABS.GENERAL)}
            >
              General
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === TABS.ANIMATIONS
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(TABS.ANIMATIONS)}
            >
              Animations
            </button>
          </div>
          
          {/* List Editor Tab */}
          {activeTab === TABS.LIST_EDITOR && (
            <ListEditorTab
              items={items}
              sticky={sticky}
              itemsText={itemsText}
              setItemsText={setItemsText}
              handleStickyToggle={handleStickyToggle}
              handleSortItems={handleSortItems}
              handleAddItem={handleAddItem}
              handleClearItems={handleClearItems}
              onUpdateSticky={onUpdateSticky}
              onUpdateItems={onUpdateItems}
            />
          )}
          
          {/* General Tab */}
          {activeTab === TABS.GENERAL && (
            <GeneralTab
              items={items}
              templateText={templateText}
              setTemplateText={setTemplateText}
              isTabSwitchAnimationEnabled={isTabSwitchAnimationEnabled}
              setIsTabSwitchAnimationEnabled={setIsTabSwitchAnimationEnabled}
              isAutoCopyEnabled={isAutoCopyEnabled}
              setIsAutoCopyEnabled={setIsAutoCopyEnabled}
              isAnimateStickyCardsEnabled={isAnimateStickyCardsEnabled}
              setIsAnimateStickyCardsEnabled={setIsAnimateStickyCardsEnabled}
            />
          )}
          
          {/* Animations Tab */}
          {activeTab === TABS.ANIMATIONS && (
            <AnimationsTab
              enabledAnimations={enabledAnimations}
              setEnabledAnimationsState={setEnabledAnimationsState}
              animationSearchTerm={animationSearchTerm}
              setAnimationSearchTerm={setAnimationSearchTerm}
            />
          )}
          
          {/* Save Button */}
          <div className="flex justify-end mt-6">
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
