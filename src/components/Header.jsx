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
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };
  
  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg shadow-sm mb-4">
      <div className="flex items-center mb-4 md:mb-0">
        <h1 className="text-3xl font-bold text-gray-800">
          Rando
        </h1>
        <span className="ml-2 text-sm text-gray-600">List Randomizer</span>
      </div>
      
      <div className="flex space-x-3">
        <button
          className={`
            px-4 py-2
            bg-gradient-to-r from-purple-500 to-indigo-600
            text-white font-medium
            rounded-lg
            shadow-md
            hover:shadow-lg
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
            px-4 py-2
            bg-gray-200
            text-gray-700 font-medium
            rounded-lg
            shadow-md
            hover:bg-gray-300
            transition-all
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
