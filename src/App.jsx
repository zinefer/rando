import { useState, useEffect, useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { runTabSwitchAnimation } from './animations';

gsap.registerPlugin(useGSAP);

import Header from './components/Header';
import CardGrid from './components/CardGrid';
import SettingsPanel from './components/SettingsPanel';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';

import { 
  loadTemplate, 
  saveTemplate, 
  loadTabSwitchAnimation, 
  saveTabSwitchAnimation,
  loadAutoCopy,
  saveAutoCopy,
  loadAnimateStickyCards,
  saveAnimateStickyCards
} from './utils/LocalStorageManager';
import { parseURLParams, updateURL, toggleSticky, setupHashChangeListener } from './utils/URLManager';
import { showNotification, copyItemsToClipboard } from './utils/ClipboardManager'; // Removed setupClipboardShortcut

function App() {

  // State for items, sticky indices, and template
  const [items, setItems] = useState([]);
  const [sticky, setSticky] = useState([]);
  const [template, setTemplate] = useState('{item}');
  
  // State for settings panel
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State for header button animation
  const [isHeaderAnimating, setHeaderIsAnimating] = useState(false);
  
  // State for copy notification
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  
  // State for tab switch animation, auto copy, and animate sticky cards
  const [tabSwitchAnimation, setTabSwitchAnimation] = useState(false);
  const [autoCopy, setAutoCopy] = useState(false);
  const [animateStickyCards, setAnimateStickyCards] = useState(false);
  
  // Reference to CardGrid component
  const cardGridRef = useRef(null);

  // Refs for clipboard shortcut
  const itemsRef = useRef(items);
  const templateRef = useRef(template);
  const onCopyRef = useRef(null);

  // Update refs when state changes
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { templateRef.current = template; }, [template]);

  // Stable callback for showing notification
  const showCopyNotificationCallback = useCallback(() => {
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  }, []); // Empty dependency array ensures stable function identity
  useEffect(() => { onCopyRef.current = showCopyNotificationCallback; }, [showCopyNotificationCallback]);
  
  // Load items from URL and settings from local storage on mount
  useEffect(() => {
    console.log('[App] Mounting & Loading from URL and local storage');
    
    // Load from URL
    const { items: urlItems, sticky: urlSticky } = parseURLParams();
    
    // Load settings from local storage
    const storedTemplate = loadTemplate();
    const storedTabSwitchAnimation = loadTabSwitchAnimation();
    const storedAutoCopy = loadAutoCopy();
    const storedAnimateStickyCards = loadAnimateStickyCards();
    
    // Set template (from local storage)
    const finalTemplate = storedTemplate || '{item}';
    setTemplate(finalTemplate);
    
    // Set tab switch animation, auto copy, and animate sticky cards
    if (storedTabSwitchAnimation !== null) {
      setTabSwitchAnimation(storedTabSwitchAnimation);
    }
    
    if (storedAutoCopy !== null) {
      setAutoCopy(storedAutoCopy);
    }
    
    if (storedAnimateStickyCards !== null) {
      setAnimateStickyCards(storedAnimateStickyCards);
    }
    
    // If no items in URL, set default items
    if (urlItems.length === 0) {
      const defaultItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
      setItems(defaultItems);
      updateURL(defaultItems, []);
    } else {
      setItems(urlItems);
      setSticky(urlSticky);
    }
    
    // Set up hash change listener
    const cleanup = setupHashChangeListener((newItems, newSticky) => {
      console.log('[App] Hash changed, updating items and sticky');
      setItems(newItems);
      setSticky(newSticky);
    });
    
    return cleanup;
  }, []);
  
  // Save template to local storage when it changes
  useEffect(() => {
    saveTemplate(template);
  }, [template]);
  
  // Log when items state changes
  useEffect(() => {
    console.log('[App] Items state updated:', items);
  }, [items]);
  
  // Set up clipboard shortcut listener ONCE on mount
  useEffect(() => {
    console.log('[App] Setting up clipboard shortcut listener');
    const handleKeyDown = async (e) => {
      // Check for Ctrl+C (or Cmd+C on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Only handle if no text is selected
        const selection = window.getSelection().toString();
        if (!selection) {
          e.preventDefault();
          // Use refs to get current data and call the stable callback ref
          await copyItemsToClipboard(itemsRef.current, templateRef.current, onCopyRef.current);
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function to remove the single listener on unmount
    return () => {
      console.log('[App] Removing clipboard shortcut listener');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array means run only on mount/unmount
  
  // Show notification when items are copied (original commented out code)
  // useEffect(() => {
  //   if (showCopyNotification) {
  //     //showNotification('List copied to clipboard!');
  //   }
  // }, [showCopyNotification]);
  
  // Set up tab visibility change detection
  useEffect(() => {
    if (!tabSwitchAnimation) return;
    
    let isAnimating = false; // Local flag to prevent multiple animations
    
    const handleVisibilityChange = () => {
      // Only run animation if tab becomes visible and we're not already animating
      if (document.visibilityState === 'visible' && !isAnimating) {
        console.log('[App] Tab became visible, running animation');
        isAnimating = true; // Set flag to prevent multiple animations
        setHeaderIsAnimating(true);
        
        // Get all card elements
        const cardElements = {};
        items.forEach((_, index) => {
          const cardElement = document.getElementById(`card-${index}`);
          if (cardElement) {
            cardElements[index] = cardElement;
          }
        });
        
        // Run animation if we have card elements and positions
        if (Object.keys(cardElements).length > 0 && cardGridRef.current) {
          const positions = cardGridRef.current.getPositions?.() || [];
          const gridDimensions = cardGridRef.current.getGridDimensions?.() || { width: 0, height: 0 };
          
          // Get the grid element to calculate its rect
          const gridElement = document.getElementById('card-grid');
          const gridRect = gridElement ? gridElement.getBoundingClientRect() : null;
          
          if (positions.length > 0 && gridDimensions.width > 0) {              
            // Define the completion callback
            const onCompleteCallback = () => {
              // Add a small delay to ensure the message is visible
              setTimeout(() => {
                isAnimating = false;
                setHeaderIsAnimating(false);
                console.log('[App] Tab switch animation complete, resetting header animating state after delay.');
              }, 500); // 500ms delay
            };
            
            // Run the animation with the callback
            runTabSwitchAnimation(cardElements, positions, gridDimensions, gridRect, sticky, onCompleteCallback);
          } else {
            // Conditions not met, reset flags immediately
            isAnimating = false;
            setHeaderIsAnimating(false);
            console.log('[App] Conditions for tab switch animation not met, resetting header animating state immediately.');
          }
        } else {
          // Conditions not met, reset flags immediately
          isAnimating = false;
          setHeaderIsAnimating(false);
          console.log('[App] Card elements or grid ref not available for tab switch animation, resetting header animating state immediately.');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabSwitchAnimation, items, sticky]);
  
  // Randomize items using FLIP technique
  const handleRandomize = async () => {
    console.log('[App] handleRandomize triggered. Current items:', items);
    console.log('[App] Current sticky indices:', sticky);
    
    setHeaderIsAnimating(true); // Start header animation
    
    // Create a copy of the items array
    const newItems = [...items];
    console.log('[App] Original items array (copy):', newItems);
    
    // Get non-sticky items
    const nonStickyIndices = newItems.map((_, index) => index)
      .filter(index => !sticky.includes(index));
    console.log('[App] Non-sticky indices:', nonStickyIndices);
    
    // Shuffle non-sticky items using Fisher-Yates algorithm
    for (let i = nonStickyIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = nonStickyIndices[i];
      nonStickyIndices[i] = nonStickyIndices[j];
      nonStickyIndices[j] = temp;
    }
    console.log('[App] Shuffled non-sticky indices:', nonStickyIndices);
    
    // Create a new array with shuffled non-sticky items
    const shuffledItems = [];
    let nonStickyCounter = 0;
    
    for (let i = 0; i < newItems.length; i++) {
      if (sticky.includes(i)) {
        // Keep sticky items in place
        shuffledItems[i] = newItems[i];
        console.log(`[App] Item at index ${i} is sticky, keeping in place: "${newItems[i]}"`);
      } else {
        // Place non-sticky items in shuffled order
        const newIndex = nonStickyIndices[nonStickyCounter];
        shuffledItems[i] = newItems[newIndex];
        console.log(`[App] Item at index ${i} is not sticky, using item from index ${newIndex}: "${newItems[newIndex]}"`);
        nonStickyCounter++;
      }
    }
    console.log('[App] Final shuffled items array:', shuffledItems);
    
    // Create the correct mapping for animation: newOrder[newIndex] = oldIndex
    // We need to track which indices we've already used to handle duplicate items
    const newOrderForAnimation = Array(newItems.length);
    const usedIndices = new Set();
    
    console.log('[App] Building animation order mapping...');
    shuffledItems.forEach((item, newIndex) => {
      // Find all indices where this item appears in the original array
      const allIndices = newItems.map((oldItem, idx) => 
        oldItem === item ? idx : -1
      ).filter(idx => idx !== -1);
      
      console.log(`[App] Item "${item}" at new index ${newIndex} appears at original indices:`, allIndices);
      
      // Find the first unused index for this item
      const oldIndex = allIndices.find(idx => !usedIndices.has(idx));
      
      if (oldIndex !== undefined) {
        newOrderForAnimation[newIndex] = oldIndex;
        usedIndices.add(oldIndex);
        console.log(`[App] Mapping new index ${newIndex} to original index ${oldIndex}`);
      } else {
        // Fallback (should not happen if shuffledItems contains the same items as newItems)
        console.warn(`[App] Could not find unused index for item "${item}" at position ${newIndex}`);
        console.warn(`[App] Used indices so far:`, Array.from(usedIndices));
        console.warn(`[App] All indices for this item:`, allIndices);
        newOrderForAnimation[newIndex] = newIndex; // Default to same position
      }
    });
    
    console.log('[App] Final newOrderForAnimation:', newOrderForAnimation);
    
    // Verify the mapping is complete and valid
    const missingIndices = [];
    for (let i = 0; i < newOrderForAnimation.length; i++) {
      if (newOrderForAnimation[i] === undefined) {
        missingIndices.push(i);
      }
    }
    
    if (missingIndices.length > 0) {
      console.error('[App] Missing indices in newOrderForAnimation:', missingIndices);
    }
    
    // Check for duplicate mappings
    const valueCount = {};
    newOrderForAnimation.forEach(value => {
      valueCount[value] = (valueCount[value] || 0) + 1;
    });
    
    const duplicates = Object.entries(valueCount)
      .filter(([_, count]) => count > 1)
      .map(([value, _]) => parseInt(value));
    
    if (duplicates.length > 0) {
      console.error('[App] Duplicate values in newOrderForAnimation:', duplicates);
      console.error('[App] This means multiple cards will animate from the same starting position!');
    }
    
    // FLIP Animation Process:
    // 1. Prepare for animation (capture current positions)
    // 2. Update React state (this will cause a re-render with the new order)
    // 3. After render, the useLayoutEffect in CardGrid will run the animation
    
    if (cardGridRef.current && cardGridRef.current.prepareFlipAnimation) {
      // Step 1: Prepare for animation
      console.log('[App] Preparing for FLIP animation with:', newOrderForAnimation);
      cardGridRef.current.prepareFlipAnimation(newOrderForAnimation);
      
      // Step 2: Update state (this will trigger the animation after render)
      console.log('[App] Setting items state with shuffled items:', shuffledItems);
      setItems(shuffledItems);
      updateURL(shuffledItems, sticky);
      
      // Auto-copy to clipboard if enabled
      if (autoCopy) {
        console.log('[App] Auto-copying to clipboard');
        const success = await copyItemsToClipboard(shuffledItems, template, () => {
          setShowCopyNotification(true);
          setTimeout(() => setShowCopyNotification(false), 2000);
        });
        
        if (!success) {
          console.error('[App] Failed to auto-copy to clipboard');
        }
      }
    } else {
      console.warn('[App] cardGridRef or prepareFlipAnimation not available. Updating state immediately.');
      // Fallback: Update state immediately if animation cannot run
      setItems(shuffledItems);
      updateURL(shuffledItems, sticky);
      
      // Auto-copy to clipboard if enabled
      if (autoCopy) {
        console.log('[App] Auto-copying to clipboard');
        await copyItemsToClipboard(shuffledItems, template, () => {
          setShowCopyNotification(true);
          setTimeout(() => setShowCopyNotification(false), 2000);
        });
      }
      
      if (!cardGridRef.current) {
        console.error('[App] cardGridRef.current is null');
      } else if (!cardGridRef.current.prepareFlipAnimation) {
        console.error('[App] cardGridRef.current.prepareFlipAnimation is not a function');
      }
    }
  };
  
  // Handle reordering of items
  const handleReorder = (newItems, newSticky) => {
    setItems(newItems);
    setSticky(newSticky);
    updateURL(newItems, newSticky);
  };
  
  // Handle toggling sticky status
  const handleToggleSticky = (index) => {
    const newSticky = toggleSticky(index, sticky);
    setSticky(newSticky);
    updateURL(items, newSticky);
  };
  
  // Handle animation completion from CardGrid
  const handleAnimationComplete = () => {
    console.log('[App] CardGrid animation complete, setting header animating to false.');
    setHeaderIsAnimating(false);
    console.log('[App] Header animating state reset to false.');
  };
  
  // Handle updating items
  const handleUpdateItems = (newItems) => {
    // Filter sticky indices to only include valid indices
    const newSticky = sticky.filter(index => index < newItems.length);
    
    setItems(newItems);
    setSticky(newSticky);
    updateURL(newItems, newSticky);
  };
  
  // Handle updating template
  const handleUpdateTemplate = (newTemplate) => {
    setTemplate(newTemplate);
    // No need to update URL for template changes, as template is stored in localStorage
  };
  
  // Handle updating tab switch animation
  const handleUpdateTabSwitchAnimation = (enabled) => {
    setTabSwitchAnimation(enabled);
    saveTabSwitchAnimation(enabled);
  };
  
  // Handle updating auto copy
  const handleUpdateAutoCopy = (enabled) => {
    setAutoCopy(enabled);
    saveAutoCopy(enabled);
  };
  
  // Handle updating animate sticky cards
  const handleUpdateAnimateStickyCards = (enabled) => {
    setAnimateStickyCards(enabled);
    saveAnimateStickyCards(enabled);
  };
  
  // Handle removing a specific item by index
  const handleRemoveItem = (index) => {
    if (index >= 0 && index < items.length) {
      const newItems = [...items];
      newItems.splice(index, 1);
      
      // Filter sticky indices to only include valid indices and adjust them
      const newSticky = sticky
        .filter(stickyIndex => stickyIndex !== index) // Remove the deleted index
        .map(stickyIndex => stickyIndex > index ? stickyIndex - 1 : stickyIndex); // Adjust indices
      
      setItems(newItems);
      setSticky(newSticky);
      updateURL(newItems, newSticky);
      
      // Show notification
      showNotification(`Item "${items[index]}" removed`);
    }
  };
  
  // Handle adding a new item from dialog
  const handleAddItem = (itemName) => {
    const newItems = [...items, itemName || `Item ${items.length + 1}`];
    handleUpdateItems(newItems);
    
    // Show notification
    showNotification(`Item "${itemName || `Item ${items.length + 1}`}" added`);
  };
  
  // Handle reordering an item from one position to another
  const handleReorderItem = (oldIndex, newIndex) => {
    if (
      oldIndex >= 0 && 
      oldIndex < items.length && 
      newIndex >= 0 && 
      newIndex < items.length &&
      oldIndex !== newIndex
    ) {
      // Create a new array with the item moved to the new position
      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      // Adjust sticky indices
      const newSticky = sticky.map(stickyIndex => {
        if (stickyIndex === oldIndex) {
          return newIndex;
        } else if (oldIndex < stickyIndex && stickyIndex <= newIndex) {
          return stickyIndex - 1;
        } else if (newIndex <= stickyIndex && stickyIndex < oldIndex) {
          return stickyIndex + 1;
        }
        return stickyIndex;
      });
      
      setItems(newItems);
      setSticky(newSticky);
      updateURL(newItems, newSticky);
    }
  };
  
  console.log('[App] Rendering...');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 p-4 md:p-8 text-gray-100 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ 
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.4) 0%, transparent 40%)'
        }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative">
        <Header 
          onRandomize={handleRandomize} 
          onToggleSettings={() => setIsSettingsOpen(true)} 
          isAnimating={isHeaderAnimating} // Pass down animation state
        />
        
        <CardGrid 
          ref={cardGridRef}
          items={items} 
          sticky={sticky} 
          onReorder={handleReorder} 
          onToggleSticky={handleToggleSticky}
          onAnimationComplete={handleAnimationComplete}
          onRemoveItem={handleRemoveItem}
          onAddItem={handleAddItem}
          onReorderItem={handleReorderItem}
        />
        
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          items={items} 
          sticky={sticky} 
          template={template}
          tabSwitchAnimation={tabSwitchAnimation}
          autoCopy={autoCopy}
          animateStickyCards={animateStickyCards}
          onUpdateItems={handleUpdateItems} 
          onUpdateSticky={setSticky} 
          onUpdateTemplate={handleUpdateTemplate}
          onUpdateTabSwitchAnimation={handleUpdateTabSwitchAnimation}
          onUpdateAutoCopy={handleUpdateAutoCopy}
          onUpdateAnimateStickyCards={handleUpdateAnimateStickyCards}
          onClose={() => setIsSettingsOpen(false)} 
        />
        
        {/* Enhanced notification */}
        {showCopyNotification && (
          <div className="fixed bottom-4 right-4 bg-indigo-900 bg-opacity-90 text-white px-4 py-3 rounded-lg shadow-xl border border-indigo-700 flex items-center space-x-3 animate-fade-in-up z-50">
            <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">List copied to clipboard!</p>
              <p className="text-xs text-indigo-200 mt-0.5">{items.length} items copied using template: {template}</p>
            </div>
          </div>
        )}
        
        {/* Keyboard shortcuts panel */}
        <KeyboardShortcutsPanel autoCopy={autoCopy} />
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <a 
            href="https://github.com/zinefer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors flex items-center justify-center"
            aria-label="Visit Zinefer's GitHub profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V19c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10A10 10 0 0010 0z" clipRule="evenodd" />
            </svg>
            Made with 💖 by Zinefer
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
