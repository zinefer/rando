import React from 'react';

import { animationDefinitions } from '../../animations';

/**
 * AnimationsTab component for selecting which animations to include
 * 
 * @param {Object} props
 * @param {Object} props.enabledAnimations - Object mapping animation keys to boolean enabled state
 * @param {Function} props.setEnabledAnimationsState - Callback for updating enabled animations
 * @param {String} props.animationSearchTerm - Search term for filtering animations
 * @param {Function} props.setAnimationSearchTerm - Callback for updating animation search term
 */
const AnimationsTab = ({
  enabledAnimations,
  setEnabledAnimationsState,
  animationSearchTerm,
  setAnimationSearchTerm
}) => {
  // Handle toggling an animation
  const handleToggleAnimation = (key) => {
    setEnabledAnimationsState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  return (
    <div>
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-indigo-300">Animations</h3>
          <div className="flex space-x-2">
            <button 
              className="px-2 py-1 bg-indigo-700 text-indigo-200 text-xs rounded hover:bg-indigo-600"
              onClick={() => {
                // Enable all animations
                const allEnabled = Object.keys(animationDefinitions).reduce((acc, key) => {
                  acc[key] = true;
                  return acc;
                }, {});
                setEnabledAnimationsState(allEnabled);
              }}
            >
              Select All
            </button>
            <button 
              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600"
              onClick={() => {
                // Disable all animations
                const allDisabled = Object.keys(animationDefinitions).reduce((acc, key) => {
                  acc[key] = false;
                  return acc;
                }, {});
                setEnabledAnimationsState(allDisabled);
              }}
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Animation search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-8 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="Search animations..."
              value={animationSearchTerm}
              onChange={(e) => setAnimationSearchTerm(e.target.value)}
            />
            <div className="absolute left-2.5 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-2">
          Select which animations to include in the random pool.
        </p>
        
        {/* Two-column layout with enhanced design */}
        <div className="flex gap-4">
          {/* Available Animations Column */}
          <div className="flex-1 border border-gray-700 rounded-md bg-gray-800 p-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-300">Available</h4>
              <button 
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center"
                onClick={() => {
                  // Add all available animations to selected
                  const allEnabled = Object.keys(animationDefinitions).reduce((acc, key) => {
                    acc[key] = true;
                    return acc;
                  }, {});
                  setEnabledAnimationsState(allEnabled);
                }}
              >
                <span>Add All</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(animationDefinitions)
                .filter(([key, def]) => {
                  // Filter by search term
                  if (!animationSearchTerm) return true;
                  const searchLower = animationSearchTerm.toLowerCase();
                  return (
                    def.name.toLowerCase().includes(searchLower) || 
                    def.description.toLowerCase().includes(searchLower)
                  );
                })
                .map(([key, def]) => {
                  // Only show if not enabled
                  if (enabledAnimations[key]) return null;
                
                return (
                  <div 
                    key={key} 
                    className="flex justify-between items-center p-2 hover:bg-gray-700 rounded mb-1 group transition-colors"
                  >
                    <div className="flex-grow">
                      <div className="text-sm text-gray-300 font-medium">{def.name}</div>
                      <div className="text-xs text-gray-400 line-clamp-1">{def.description}</div>
                    </div>
                    <button 
                      className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                      onClick={() => handleToggleAnimation(key)}
                      title="Add to selected animations"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              {Object.entries(animationDefinitions).filter(([key]) => !enabledAnimations[key]).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm italic">
                  All animations are selected
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {Object.entries(animationDefinitions).filter(([key]) => !enabledAnimations[key]).length} available
            </div>
          </div>
          
          {/* Selected Animations Column */}
          <div className="flex-1 border border-gray-700 rounded-md bg-gray-800 p-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-300">Selected</h4>
              <button 
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center"
                onClick={() => {
                  // Remove all selected animations
                  const allDisabled = Object.keys(animationDefinitions).reduce((acc, key) => {
                    acc[key] = false;
                    return acc;
                  }, {});
                  setEnabledAnimationsState(allDisabled);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Remove All</span>
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(animationDefinitions)
                .filter(([key, def]) => {
                  // Filter by search term
                  if (!animationSearchTerm) return true;
                  const searchLower = animationSearchTerm.toLowerCase();
                  return (
                    def.name.toLowerCase().includes(searchLower) || 
                    def.description.toLowerCase().includes(searchLower)
                  );
                })
                .map(([key, def]) => {
                  // Only show if enabled
                  if (!enabledAnimations[key]) return null;
                
                return (
                  <div 
                    key={key} 
                    className="flex justify-between items-center p-2 bg-indigo-900 bg-opacity-20 hover:bg-opacity-30 rounded mb-1 group transition-colors"
                  >
                    <button 
                      className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                      onClick={() => handleToggleAnimation(key)}
                      title="Remove from selected animations"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="flex-grow text-right">
                      <div className="text-sm text-gray-200 font-medium">{def.name}</div>
                      <div className="text-xs text-gray-400 line-clamp-1">{def.description}</div>
                    </div>
                  </div>
                );
              })}
              {Object.entries(animationDefinitions).filter(([key]) => enabledAnimations[key]).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm italic">
                  No animations selected
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Object.entries(animationDefinitions).filter(([key]) => enabledAnimations[key]).length} selected
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Tip: Click an animation to move it between columns
        </div>
      </div>
    </div>
  );
};

export default AnimationsTab;
