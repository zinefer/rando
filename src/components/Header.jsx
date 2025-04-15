import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { getRandomMessage } from '../constants/randomizeMessages';

/**
 * Header component with title and randomize button
 * 
 * @param {Object} props
 * @param {Function} props.onRandomize - Callback for when the randomize button is clicked
 * @param {Function} props.onToggleSettings - Callback to toggle settings panel
 * @param {boolean} props.isAnimating - Whether the randomize animation is currently running
 */
const Header = ({ onRandomize, onToggleSettings, isAnimating }) => {
  const randomizeButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const titleRef = useRef(null);
  const [randomMessage, setRandomMessage] = useState('Shuffling...');
  
  // Update random message when animation starts
  useEffect(() => {
    if (isAnimating) {
      setRandomMessage(getRandomMessage());
    }
  }, [isAnimating]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if the active element is an input, textarea, or other form element
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || 
                           document.activeElement.isContentEditable;
      
      // Only process keyboard shortcuts if no input element is focused
      if (!isInputActive) {
        // Randomize on 'R' key
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && !isAnimating) {
          if (onRandomize) {
            onRandomize();
            
            // Add visual feedback for the keyboard shortcut
            if (randomizeButtonRef.current) {
              gsap.to(randomizeButtonRef.current, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1
              });
            }
          }
        }
        
        // Toggle settings on 'S' key
        if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (onToggleSettings) {
            onToggleSettings();
            
            // Add visual feedback for the keyboard shortcut
            if (settingsButtonRef.current) {
              gsap.to(settingsButtonRef.current, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1
              });
            }
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRandomize, onToggleSettings, isAnimating]);
  
  // Add title animation on mount
  useGSAP(() => {
    if (titleRef.current) {
      gsap.from(titleRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      });
    }
  }, []);
  
  const handleRandomizeClick = () => {
    // Prevent multiple clicks during animation (check prop)
    if (isAnimating) return;
    
    // Call the randomize callback (parent now handles state)
    if (onRandomize) {
      onRandomize();
    }
  };
  
  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-6 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl shadow-xl mb-6 border border-indigo-700 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.1) 2px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div ref={titleRef} className="flex items-center mb-4 md:mb-0 z-10">
        <div className="relative">
          <h1 className="text-4xl font-bold text-white">
            Rando
          </h1>
        </div>
        <div className="ml-3 flex flex-col">
          <span className="text-sm text-indigo-300 font-medium">List Randomizer</span>
          <span className="text-xs text-indigo-400 mt-0.5 hidden md:inline-block">Shuffle with style</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 z-10">
        <button
          ref={randomizeButtonRef}
          className={`
            px-6 py-2.5
            ${isAnimating 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse' 
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-pink-700/30 active:scale-95'}
            text-white font-medium
            rounded-lg
            shadow-lg
            transition-all duration-200
            relative
            overflow-hidden
            ${isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={handleRandomizeClick}
          disabled={isAnimating}
          aria-label="Randomize list"
        >
          {/* Button background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 w-full transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
          
          {/* Button content */}
          <div className="flex items-center justify-center">
            <span className={`mr-2 ${isAnimating ? 'font-medium' : ''}`}>
              {isAnimating ? randomMessage : 'Randomize'}
            </span>
            {!isAnimating && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
            {isAnimating && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
          </div>
          
          {/* Keyboard shortcut hint */}
          <div className="absolute bottom-0.5 right-1 text-xs text-pink-200 opacity-70">R</div>
        </button>
        
        <button
          ref={settingsButtonRef}
          className="
            px-5 py-2.5
            bg-gray-800
            text-gray-200 font-medium
            rounded-lg
            shadow-lg
            hover:bg-gray-700
            hover:shadow-gray-900/30
            active:scale-95
            transition-all duration-200
            border border-gray-700
            relative
          "
          onClick={onToggleSettings}
          aria-label="Open settings"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Settings
          </div>
          
          {/* Keyboard shortcut hint */}
          <div className="absolute bottom-0.5 right-1 text-xs text-gray-400 opacity-70">S</div>
        </button>
      </div>
    </header>
  );
};

export default Header;
