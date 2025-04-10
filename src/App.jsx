import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
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
  
  // Set up clipboard shortcut
  useEffect(() => {
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
  
  // Randomize items
  const handleRandomize = () => {
    // Create a copy of the items array
    const newItems = [...items];
    
    // Get non-sticky items
    const nonStickyIndices = newItems.map((_, index) => index)
      .filter(index => !sticky.includes(index));
    
    // Shuffle non-sticky items using Fisher-Yates algorithm
    for (let i = nonStickyIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = nonStickyIndices[i];
      nonStickyIndices[i] = nonStickyIndices[j];
      nonStickyIndices[j] = temp;
    }
    
    // Create a new array with shuffled non-sticky items
    const shuffledItems = [];
    let nonStickyCounter = 0;
    
    for (let i = 0; i < newItems.length; i++) {
      if (sticky.includes(i)) {
        // Keep sticky items in place
        shuffledItems[i] = newItems[i];
      } else {
        // Place non-sticky items in shuffled order
        const newIndex = nonStickyIndices[nonStickyCounter];
        shuffledItems[i] = newItems[newIndex];
        nonStickyCounter++;
      }
    }
    
    // Update items state and URL
    setItems(shuffledItems);
    updateURL(shuffledItems, sticky, template);
    
    // Animate the shuffle
    gsap.from('#card-grid div', {
      scale: 0.8,
      opacity: 0.5,
      duration: 0.5,
      stagger: 0.05,
      ease: 'back.out(1.7)'
    });
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Header 
          onRandomize={handleRandomize} 
          onToggleSettings={() => setIsSettingsOpen(true)} 
        />
        
        {items.length > 0 ? (
          <CardGrid 
            items={items} 
            sticky={sticky} 
            onReorder={handleReorder} 
            onToggleSticky={handleToggleSticky} 
          />
        ) : (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No items to display. Add some in settings.</p>
          </div>
        )}
        
        <div className="mt-4 text-center text-sm text-gray-500">
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
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg">
            List copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
