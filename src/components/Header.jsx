import { useState } from 'react';

/**
 * Header component with title and randomize button
 * 
 * @param {Object} props
 * @param {Function} props.onRandomize - Callback for when the randomize button is clicked
 * @param {Function} props.onToggleSettings - Callback to toggle settings panel
 */
const Header = ({ onRandomize, onToggleSettings }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleRandomizeClick = () => {
    // Prevent multiple clicks during animation
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Call the randomize callback
    if (onRandomize) {
      onRandomize();
    }
    
    // Reset animation state after animation completes (increased to match full animation duration)
    setTimeout(() => {
      setIsAnimating(false);
    }, 2600);
  };
  
  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-6 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg shadow-lg mb-6 border border-indigo-700">
      <div className="flex items-center mb-4 md:mb-0">
        <h1 className="text-3xl font-bold text-white">
          Rando
        </h1>
        <span className="ml-2 text-sm text-indigo-300">List Randomizer</span>
      </div>
      
      <div className="flex space-x-3">
        <button
          className={`
            px-5 py-2
            bg-gradient-to-r from-pink-600 to-purple-600
            text-white font-medium
            rounded-lg
            shadow-lg
            hover:from-pink-500 hover:to-purple-500
            transition-all
            ${isAnimating ? 'animate-pulse' : ''}
          `}
          onClick={handleRandomizeClick}
          disabled={isAnimating}
        >
          {isAnimating ? 'Shuffling...' : 'Randomize'}
        </button>
        
        <button
          className="
            px-5 py-2
            bg-gray-800
            text-gray-200 font-medium
            rounded-lg
            shadow-lg
            hover:bg-gray-700
            transition-all
            border border-gray-700
          "
          onClick={onToggleSettings}
        >
          Settings
        </button>
      </div>
    </header>
  );
};

export default Header;
