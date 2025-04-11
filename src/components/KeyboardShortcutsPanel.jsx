import { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

/**
 * KeyboardShortcutsPanel component for displaying keyboard shortcuts in a compact or expanded view
 * 
 * @param {Object} props
 * @param {Boolean} props.autoCopy - Whether auto copy is enabled
 */
const KeyboardShortcutsPanel = ({ autoCopy }) => {
  // State for expanded/collapsed view
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Load expanded state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('keyboardShortcutsExpanded');
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
  }, []);
  
  // Save expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('keyboardShortcutsExpanded', isExpanded.toString());
  }, [isExpanded]);
  
  // Reference to the expanded content
  const expandedContentRef = useRef(null);
  
  // Reference to track if this is the first render
  const isFirstRender = useRef(true);
  
  // Reference to the copy text element for typing animation
  const copyTextRef = useRef(null);
  
  // Set up GSAP animations
  useGSAP(() => {
    if (expandedContentRef.current) {
      // Set initial state on first render
      if (isFirstRender.current) {
        gsap.set(expandedContentRef.current, { 
          height: isExpanded ? 'auto' : 0, 
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden'
        });
        isFirstRender.current = false;
        return;
      }
      
      // Create animation timeline
      const tl = gsap.timeline();
      
      if (isExpanded) {
        // First set initial state
        gsap.set(expandedContentRef.current, { 
          height: 0, 
          opacity: 0,
          overflow: 'hidden'
        });
        
        // Set initial text state
        if (copyTextRef.current) {
          gsap.set(copyTextRef.current, { text: 'Copy' });
        }
        
        // Animate the content height
        tl.to(expandedContentRef.current, { 
          height: 'auto', 
          duration: 0.3, 
          ease: 'power2.out' 
        });
        
        // Fade in the content
        tl.to(expandedContentRef.current, { 
          opacity: 1, 
          duration: 0.2, 
          ease: 'power1.inOut' 
        }, '-=0.1'); // Slight overlap for smoother transition
        
        // Add typing animation for "templated list" text
        if (copyTextRef.current) {
          tl.to(copyTextRef.current, {
            duration: 0.5,
            text: 'Copy templated list',
            ease: 'none',
            delay: 0.1
          });
        }
      } else {
        // Fade out content
        tl.to(expandedContentRef.current, { 
          opacity: 0, 
          duration: 0.2, 
          ease: 'power1.inOut' 
        });
        
        // Collapse height
        tl.to(expandedContentRef.current, { 
          height: 0, 
          duration: 0.3, 
          ease: 'power2.in' 
        }, '-=0.1');

        if (copyTextRef.current) {
          tl.to(copyTextRef.current, {
            duration: 0.5,
            text: { value: 'Copy', rtl: true },
            ease: 'none'
          });
        }
      }
    }
  }, [isExpanded]); // Re-run when isExpanded changes
  
  // Toggle expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  
  return (
    <div
      className={`mt-6 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 pt-3 pl-3 pr-3 text-xs text-gray-400 transition-all duration-300 relative ${
        isExpanded ? 'pb-3' : ''
      }`}
    >
      {/* Compact View */}
      <div className="flex flex-wrap justify-center items-center gap-3">
        {/* Essential shortcuts in compact view */}
        <div className="flex items-center">
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded mr-1.5">R</kbd>
          <span>Randomize</span>
        </div>
        
        <div className="flex items-center">
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded mr-1.5">S</kbd>
          <span>Settings</span>
        </div>
        
        <div className="flex items-center">
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded mr-1.5">Ctrl+C</kbd>
          <span ref={copyTextRef}>Copy</span>
        </div>
      </div>
      
      {/* Chevron toggle button - half overlapping bottom border */}
      <button 
        onClick={toggleExpanded}
        className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-1/2 w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 flex items-center justify-center transition-colors border border-gray-600 shadow-sm z-1"
        aria-expanded={isExpanded}
        aria-controls="expanded-shortcuts"
        aria-label={isExpanded ? "Show fewer keyboard shortcuts" : "Show more keyboard shortcuts"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Expanded View - Always rendered but controlled by GSAP */}
      <div 
        id="expanded-shortcuts"
        ref={expandedContentRef}
        className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
      >          
          <div className="flex items-center">
            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded mr-1.5">Del</kbd>
            <span>Delete card (when hovering)</span>
          </div>
          
          <div className="flex items-center">
            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded mr-1.5">↑/↓/←/→</kbd>
            <span>Move card (when hovering)</span>
          </div>
          
          <div className="flex items-center">
            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded mr-1.5">Home/End</kbd>
            <span>Move to first/last position</span>
          </div>
          
          {/* More compact double-click info with mouse icon instead of plus icon */}
          <div className="flex items-center col-span-1 sm:col-span-2">
            <div className="inline-flex items-center bg-gray-700 bg-opacity-40 px-2 py-1 rounded border border-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300 text-xs">Double-click to add item</span>
            </div>
          </div>
        </div>
      
      {/* Auto-copy notification - always visible if enabled */}
      {autoCopy && (
        <div className="mt-3 flex justify-center">
          <div className="bg-indigo-900 bg-opacity-40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-indigo-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
            </svg>
            <span className="text-indigo-300">Auto-copy enabled: List is automatically copied when randomized</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsPanel;
