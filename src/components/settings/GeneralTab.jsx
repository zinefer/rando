import React from 'react';

import ToggleSwitch from './ToggleSwitch';
import { formatWithTemplate } from '../../utils/ClipboardManager';

/**
 * GeneralTab component for template settings and behavior toggles
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items
 * @param {String} props.templateText - Template text
 * @param {Function} props.setTemplateText - Callback for updating template text
 * @param {Boolean} props.isTabSwitchAnimationEnabled - Whether tab switch animation is enabled
 * @param {Function} props.setIsTabSwitchAnimationEnabled - Callback for updating tab switch animation
 * @param {Boolean} props.isAutoCopyEnabled - Whether auto copy is enabled
 * @param {Function} props.setIsAutoCopyEnabled - Callback for updating auto copy
 * @param {Boolean} props.isAnimateStickyCardsEnabled - Whether animate sticky cards is enabled
 * @param {Function} props.setIsAnimateStickyCardsEnabled - Callback for updating animate sticky cards
 */
const GeneralTab = ({
  items,
  templateText,
  setTemplateText,
  isTabSwitchAnimationEnabled,
  setIsTabSwitchAnimationEnabled,
  isAutoCopyEnabled,
  setIsAutoCopyEnabled,
  isAnimateStickyCardsEnabled,
  setIsAnimateStickyCardsEnabled
}) => {
  return (
    <div>
      {/* Template Settings */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-indigo-300 mb-2">Template</h3>
        <p className="text-sm text-gray-400 mb-2">
          Use {'{'}<span className="font-mono">item</span>{'}'} as a placeholder for each item when copying to clipboard.
        </p>
        <input
          type="text"
          value={templateText}
          onChange={(e) => setTemplateText(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Template (e.g. {item} or {pad:10}{item})"
        />
        
        <div className="mt-3 p-2 bg-gray-700 rounded border border-gray-600">
          <h4 className="text-sm font-medium text-gray-300 mb-1">Preview (first 5 items):</h4>
          {/* Use pre for better formatting of multi-line output */}
          <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap break-words">
            {formatWithTemplate(items, templateText).split('\n').slice(0, 5).join('\n')}
          </pre>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-300 mb-1">Quick Templates:</h4>
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              onClick={() => setTemplateText('{item}')}
            >
              Basic
            </button>
            <button 
              className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              onClick={() => setTemplateText('{index}. {item}')}
            >
              Numbered
            </button>
            <button 
              className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              onClick={() => setTemplateText('• {item}')}
            >
              Bulleted
            </button>
            <button 
              className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              onClick={() => setTemplateText('{pad:20}{item}')}
            >
              Padded
            </button>
          </div>
        </div>
      </div>
      
      {/* Behavior Settings */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-indigo-300 mb-2">Behavior</h3>
        
        <div className="space-y-2">
          {/* Tab Switch Animation */}
          <ToggleSwitch
            id="tabSwitchAnimation"
            checked={isTabSwitchAnimationEnabled}
            onChange={() => setIsTabSwitchAnimationEnabled(!isTabSwitchAnimationEnabled)}
            label="Run animation when switching back to this tab (will not reorder)"
          />
          
          {/* Auto Copy */}
          <ToggleSwitch
            id="autoCopy"
            checked={isAutoCopyEnabled}
            onChange={() => setIsAutoCopyEnabled(!isAutoCopyEnabled)}
            label="Automatically copy list to clipboard when randomizing"
          />
          
          {/* Animate Sticky Cards */}
          <ToggleSwitch
            id="animateStickyCards"
            checked={isAnimateStickyCardsEnabled}
            onChange={() => setIsAnimateStickyCardsEnabled(!isAnimateStickyCardsEnabled)}
            label="Animate sticky cards (when disabled, sticky cards stay in place)"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
