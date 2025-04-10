// Import GSAP for animations
import gsap from 'gsap';

// Export available animation functions
import { flyAndSpin } from './flyAndSpin';
import { elasticBounce } from './elasticBounce';
import { swirlVortex } from './swirlVortex';
import { matrixRain } from './matrixRain';
import { chainJuggle } from './chainJuggle';
import { swingChain } from './swingChain';
import { tornado } from './tornado';
import { fireworks } from './fireworks';
import { melt } from './melt';
import { rollerCoaster } from './rollerCoaster';
import { splash } from './splash';
import { tumbleweed } from './tumbleweed'; // Import the new animation
import { loadEnabledAnimations, saveEnabledAnimations } from '../utils/LocalStorageManager';

// Animation definitions with metadata
export const animationDefinitions = {
  flyAndSpin: {
    name: 'Fly and Spin',
    function: flyAndSpin,
    description: 'Cards fly around and spin before settling'
  },
  elasticBounce: {
    name: 'Elastic Bounce',
    function: elasticBounce,
    description: 'Cards bounce with elastic motion'
  },
  swirlVortex: {
    name: 'Swirl Vortex',
    function: swirlVortex,
    description: 'Cards swirl in a vortex pattern'
  },
  matrixRain: {
    name: 'Matrix Rain',
    function: matrixRain,
    description: 'Cards fall like in the Matrix movie'
  },
  chainJuggle: {
    name: 'Chain Juggle',
    function: chainJuggle,
    description: 'Cards juggle in a chain-like pattern'
  },
  swingChain: {
    name: 'Swing Chain',
    function: swingChain,
    description: 'Cards swing in a chain-like motion'
  },
  tornado: {
    name: 'Tornado',
    function: tornado,
    description: 'Cards swirl in a tornado pattern'
  },
  fireworks: {
    name: 'Fireworks',
    function: fireworks,
    description: 'Cards explode like fireworks'
  },
  melt: {
    name: 'Melt',
    function: melt,
    description: 'Cards melt away and reform'
  },
  rollerCoaster: {
    name: 'Roller Coaster',
    function: rollerCoaster,
    description: 'Cards follow a roller coaster path'
  },
  splash: {
    name: 'Splash',
    function: splash,
    description: 'Cards splash outward and back'
  },
  tumbleweed: { // Add the new animation definition
    name: 'Tumbleweed',
    function: tumbleweed,
    description: 'Cards roll like tumbleweeds off-screen and back on'
  }
  // Add other animations here as they are created
};

// Export animations object for backward compatibility
export const animations = Object.entries(animationDefinitions).reduce((acc, [key, def]) => {
  acc[key] = def.function;
  return acc;
}, {});

// Get enabled animations from local storage or use all by default
export const getEnabledAnimations = () => {
  const storedEnabledAnimations = loadEnabledAnimations();
  
  // If no stored preferences, enable all animations by default
  if (!storedEnabledAnimations) {
    const allEnabled = Object.keys(animationDefinitions).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    return allEnabled;
  }
  
  return storedEnabledAnimations;
};

// Save enabled animations to local storage
export const setEnabledAnimations = (enabledAnimations) => {
  saveEnabledAnimations(enabledAnimations);
};

// Function to get a random animation function from enabled animations
export const getRandomAnimation = () => {
  const enabledAnimations = getEnabledAnimations();
  const enabledKeys = Object.keys(enabledAnimations).filter(key => enabledAnimations[key]);
  
  if (enabledKeys.length === 0) {
    console.warn('[Animations] No animations enabled!');
    return null; // Or a default fallback function
  }
  
  const randomKey = enabledKeys[Math.floor(Math.random() * enabledKeys.length)];
  console.log(`[Animations] Selected random animation: ${randomKey}`);
  return animationDefinitions[randomKey].function;
};

// Function to run a specific animation by key
export const getAnimationByKey = (key) => {
  if (!animationDefinitions[key]) {
    console.warn(`[Animations] Animation "${key}" not found!`);
    return null;
  }
  return animationDefinitions[key].function;
};

// Function to run a tab switch animation
export const runTabSwitchAnimation = (elements, positions, gridDimensions, gridRect, sticky = []) => {
  // Get a random animation to run
  const animation = getRandomAnimation();
  if (!animation) return;
  
  // Create a timeline for the animation
  const timeline = gsap.timeline();
  
  // If gridRect is not provided, create a default one
  const defaultGridRect = gridRect || {
    left: 0,
    top: 0,
    width: gridDimensions.width,
    height: gridDimensions.height
  };
  
  // Create a mapping where each card stays in its current position
  const sameOrderMapping = Object.keys(elements).map(Number);
  
  // Run the animation with the same order (no shuffling)
  animation({
    elements,
    newOrder: sameOrderMapping, // Same order, no shuffling
    positions,
    gridDimensions,
    gridRect: defaultGridRect,
    sticky, // Pass the sticky array
    timeline
  });
  
  return timeline;
};
