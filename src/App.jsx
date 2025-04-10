import { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Register the useGSAP plugin
gsap.registerPlugin(useGSAP);
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import SettingsPanel from './components/SettingsPanel';
import { parseURLParams, updateURL, toggleSticky } from './utils/URLManager';
import { setupClipboardShortcut, showNotification, copyItemsToClipboard } from './utils/ClipboardManager';
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
import { runTabSwitchAnimation } from './animations';

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
  
  // Load items from URL and settings from local storage on mount
  useEffect(() => {
    console.log('[App] Mounting & Loading from URL and local storage');
    
    // Load from URL
    const { items: urlItems, sticky: urlSticky, template: urlTemplate } = parseURLParams();
    
    // Load settings from local storage
    const storedTemplate = loadTemplate();
    const storedTabSwitchAnimation = loadTabSwitchAnimation();
    const storedAutoCopy = loadAutoCopy();
    const storedAnimateStickyCards = loadAnimateStickyCards();
    
    // Set template (prioritize URL over local storage)
    const finalTemplate = urlTemplate || storedTemplate || '{item}';
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
      updateURL(defaultItems, [], finalTemplate);
    } else {
      setItems(urlItems);
      setSticky(urlSticky);
    }
  }, []);
  
  // Save template to local storage when it changes
  useEffect(() => {
    saveTemplate(template);
  }, [template]);
  
  // Log when items state changes
  useEffect(() => {
    console.log('[App] Items state updated:', items);
  }, [items]);

  // Set up clipboard shortcut
  useEffect(() => {
    console.log('[App] Setting up clipboard shortcut');
    const cleanup = setupClipboardShortcut(items, template, () => {
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    });
    
    return cleanup;
  }, [items, template]);
  
  // Show notification when items are copied
  useEffect(() => {
    if (showCopyNotification) {
      showNotification('List copied to clipboard!');
    }
  }, [showCopyNotification]);
  
  // Set up tab visibility change detection
  useEffect(() => {
    if (!tabSwitchAnimation) return;
    
    let isAnimating = false; // Local flag to prevent multiple animations
    
    const handleVisibilityChange = () => {
      // Only run animation if tab becomes visible and we're not already animating
      if (document.visibilityState === 'visible' && !isAnimating) {
        console.log('[App] Tab became visible, running animation');
        isAnimating = true; // Set flag to prevent multiple animations
        
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
            // Run the animation and reset the flag when done
            const timeline = runTabSwitchAnimation(cardElements, positions, gridDimensions, gridRect, sticky);
            if (timeline) {
              timeline.eventCallback('onComplete', () => {
                isAnimating = false;
              });
            } else {
              // If no timeline was returned, reset the flag
              isAnimating = false;
            }
          } else {
            isAnimating = false;
          }
        } else {
          isAnimating = false;
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
    
    try {
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
        updateURL(shuffledItems, sticky, template);
        
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
        updateURL(shuffledItems, sticky, template);
        
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
    } finally {
      setHeaderIsAnimating(false); // Stop header animation regardless of success/failure
    }
  };
  
  // Handle reordering of items
  const handleReorder = (newItems, newSticky) => {
    setItems(newItems);
    setSticky(newSticky);
    updateURL(newItems, newSticky, template);
  };
  
  // Handle toggling sticky status
  const handleToggleSticky = (index) => {
    const newSticky = toggleSticky(index, sticky);
    setSticky(newSticky);
    updateURL(items, newSticky, template);
  };
  
  // Handle updating items
  const handleUpdateItems = (newItems) => {
    // Filter sticky indices to only include valid indices
    const newSticky = sticky.filter(index => index < newItems.length);
    
    setItems(newItems);
    setSticky(newSticky);
    updateURL(newItems, newSticky, template);
  };
  
  // Handle updating template
  const handleUpdateTemplate = (newTemplate) => {
    setTemplate(newTemplate);
    updateURL(items, sticky, newTemplate);
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
  
  console.log('[App] Rendering...');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 p-4 md:p-8 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <Header 
          onRandomize={handleRandomize} 
          onToggleSettings={() => setIsSettingsOpen(true)} 
          isAnimating={isHeaderAnimating} // Pass down animation state
        />
        
        {items.length > 0 ? (
          <CardGrid 
            ref={cardGridRef}
            items={items} 
            sticky={sticky} 
            onReorder={handleReorder} 
            onToggleSticky={handleToggleSticky} 
          />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <p className="text-gray-400">No items to display. Add some in settings.</p>
          </div>
        )}
        
        <div className="mt-4 text-center text-sm text-gray-400">
          Press Ctrl+C to copy the list to clipboard
          {autoCopy && <span> (Auto-copy on randomize is enabled)</span>}
        </div>
        
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
        
        {showCopyNotification && (
          <div className="fixed bottom-4 right-4 bg-indigo-900 bg-opacity-90 text-white px-4 py-2 rounded-lg shadow-lg border border-indigo-700">
            List copied to clipboard!
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <a 
            href="https://github.com/zinefer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-indigo-400 transition-colors"
          >
            Made with 💖 by Zinefer
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
