/**
 * Array of cheeky messages to display on the randomize button while animations are running
 */
export const RANDOMIZE_MESSAGES = [
  "Shuffling...",
  "Magic happening...",
  "Mixing it up...",
  "Hold on tight...",
  "Randomizing...",
  "Chaos in progress...",
  "Shaking things up...",
  "Stirring the pot...",
  "Rearranging...",
  "Jumbling...",
  "Spinning the wheel...",
  "Working on it...",
  "Calculating...",
  "Processing...",
  "Doing the thing...",
  "Almost there...",
  "Hang tight...",
  "Just a sec...",
  "Mixing and matching...",
  "Sorting randomly...",
  "Shuffling the deck...",
  "Brewing randomness...",
  "Cooking up chaos...",
  "Generating entropy...",
  "Applying chaos theory...",
  "Consulting the oracle...",
  "Asking the universe...",
  "Rolling the dice...",
  "Flipping coins...",
  "Asking RNGesus...",
];

/**
 * Get a random message from the array
 * @returns {string} A random message
 */
export const getRandomMessage = () => {
  const randomIndex = Math.floor(Math.random() * RANDOMIZE_MESSAGES.length);
  return RANDOMIZE_MESSAGES[randomIndex];
};
