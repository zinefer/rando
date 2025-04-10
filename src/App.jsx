import { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Register the useGSAP plugin
gsap.registerPlugin(useGSAP);
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import SettingsPanel from './components/SettingsPanel';
import { parseURLParams, updateURL, toggleSticky } from './utils/URLManager';
import { setupClipboardShortcut, showNotification } from './utils/ClipboardManager';

function App() {
  // State for items, sticky indices, and template
  const [items, setItems] = useState([]);
  const [sticky, setSticky] = useState([]);
  const [template, setTemplate] = useState('{item}');
  
  // State for settings panel
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State for copy notification
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  
  // Load items from URL on mount
  useEffect(() => {
    console.log('[App] Mounting & Loading from URL');
    const { items: urlItems, sticky: urlSticky, template: urlTemplate } = parseURLParams();
    
    // If no items in URL, set default items
    if (urlItems.length === 0) {
      const defaultItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
      setItems(defaultItems);
      updateURL(defaultItems, [], '{item}');
    } else {
      setItems(urlItems);
      setSticky(urlSticky);
      setTemplate(urlTemplate);
    }
  }, []);
  
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
  
  // Reference to CardGrid component
  const cardGridRef = useRef(null);
  
  // Randomize items (async to wait for animation)
  const handleRandomize = async () => { // Make the function async
    console.log('[App] handleRandomize triggered. Current items:', items);
    console.log('[App] Current sticky indices:', sticky);
    
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
    
    // Create the correct mapping for animateShuffle: newOrder[newIndex] = oldIndex
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
    console.log('[App] Used indices:', Array.from(usedIndices));
    
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
      
      // Log the problematic mappings
      newOrderForAnimation.forEach((oldIndex, newIndex) => {
        if (duplicates.includes(oldIndex)) {
          console.error(`[App] Duplicate mapping: newIndex ${newIndex} -> oldIndex ${oldIndex}`);
        }
      });
    }
    
    // Use the enhanced animation in CardGrid component
    if (cardGridRef.current && cardGridRef.current.animateShuffle) {
      console.log('[App] Calling cardGridRef.animateShuffle with:', newOrderForAnimation);
      
      try {
        // Await the animation promise before updating state
        await cardGridRef.current.animateShuffle(newOrderForAnimation); // Add await
        console.log('[App] Animation completed successfully');
        
        // Update items state and URL *after* animation completes
        console.log('[App] Setting items state with shuffled items:', shuffledItems);
        setItems(shuffledItems);
        updateURL(shuffledItems, sticky, template);
        
      } catch (error) {
        console.error('[App] Error during animation or state update:', error);
        // Optionally reset state or handle error appropriately
      }
    } else {
      console.warn('[App] cardGridRef or animateShuffle not available. Updating state immediately.');
      // Fallback: Update state immediately if animation cannot run
      setItems(shuffledItems);
      updateURL(shuffledItems, sticky, template);
      if (!cardGridRef.current) {
        console.error('[App] cardGridRef.current is null');
      } else if (!cardGridRef.current.animateShuffle) {
        console.error('[App] cardGridRef.current.animateShuffle is not a function');
      }
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
  
  console.log('[App] Rendering...');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 p-4 md:p-8 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <Header 
          onRandomize={handleRandomize} 
          onToggleSettings={() => setIsSettingsOpen(true)} 
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
        </div>
        
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          items={items} 
          sticky={sticky} 
          template={template} 
          onUpdateItems={handleUpdateItems} 
          onUpdateSticky={setSticky} 
          onUpdateTemplate={handleUpdateTemplate} 
          onClose={() => setIsSettingsOpen(false)} 
        />
        
        {showCopyNotification && (
          <div className="fixed bottom-4 right-4 bg-indigo-900 bg-opacity-90 text-white px-4 py-2 rounded-lg shadow-lg border border-indigo-700">
            List copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
