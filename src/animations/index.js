import gsap from 'gsap';

import { flyAndSpin } from './flyAndSpin';
import { elasticBounce } from './elasticBounce';
import { swirlVortex } from './swirlVortex';
import { matrixRain } from './matrixRain';
import { chainJuggle } from './chainJuggle';
import { swingChain } from './swingChain';
import { tornado } from './tornado';
import { fireworks } from './fireworks';
import { rollerCoaster } from './rollerCoaster';
import { splash } from './splash';
import { tumbleweed } from './tumbleweed';
import { slotMachine } from './slotMachine';
import { fallAndReveal } from './fallAndReveal';
import { kaleidoscope } from './kaleidoscope';
import { craneMachine } from './craneMachine';
import { blastOff } from './blastOff';

import { runAnimationWithOverflowControl } from '../utils/AnimationHelper';
import { loadEnabledAnimations, saveEnabledAnimations } from '../utils/LocalStorageManager';

// Animation definitions with metadata
export const animationDefinitions = {
  chainJuggle: {
    name: 'Chain Juggle',
    function: chainJuggle,
    description: 'Cards juggle in a chain-like pattern',
    overflow: true
  },
  craneMachine: {
    name: 'Crane Machine',
    function: craneMachine,
    description: 'Cards are picked up by cranes and moved to their positions',
    overflow: true
  },
  elasticBounce: {
    name: 'Elastic Bounce',
    function: elasticBounce,
    description: 'Cards bounce with elastic motion',
    overflow: false
  },
  fallAndReveal: {
    name: 'Fall and Reveal',
    function: fallAndReveal,
    description: 'Cards shrink as if falling away, then grow back to reveal new order',
    overflow: true
  },
  fireworks: {
    name: 'Fireworks',
    function: fireworks,
    description: 'Cards explode like fireworks',
    overflow: true
  },
  flyAndSpin: {
    name: 'Fly and Spin',
    function: flyAndSpin,
    description: 'Cards fly around and spin before settling',
    overflow: true
  },
  kaleidoscope: {
    name: 'Kaleidoscope',
    function: kaleidoscope,
    description: 'Cards form a symmetrical pattern, rotate, and explode outward',
    overflow: true
  },
  matrixRain: {
    name: 'Matrix Rain',
    function: matrixRain,
    description: 'Cards fall with digital rain effects in Matrix style',
    overflow: true // Changed to true to allow digital rain characters and particles to be visible outside grid
  },
  rollerCoaster: {
    name: 'Roller Coaster',
    function: rollerCoaster,
    description: 'Cards follow a roller coaster path',
    overflow: true
  },
  slotMachine: {
    name: 'Slot Machine',
    function: slotMachine,
    description: 'Cards spin like a slot machine reel',
    overflow: false
  },
  splash: {
    name: 'Splash',
    function: splash,
    description: 'Cards splash outward and back',
    overflow: true
  },
  swingChain: {
    name: 'Swing Chain',
    function: swingChain,
    description: 'Cards swing in a chain-like motion',
    overflow: true
  },
  swirlVortex: {
    name: 'Swirl Vortex',
    function: swirlVortex,
    description: 'Cards swirl in a vortex pattern',
    overflow: true
  },
  tumbleweed: {
    name: 'Tumbleweed',
    function: tumbleweed,
    description: 'Cards roll like tumbleweeds off-screen and back on',
    overflow: true
  },
  tornado: {
    name: 'Tornado',
    function: tornado,
    description: 'Cards swirl in a tornado pattern',
    overflow: true
  }
  ,
  blastOff: {
    name: 'Blast Off',
    function: blastOff,
    description: 'Cards lift off like rockets',
    overflow: true
  }
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
  
  // Get the animation definition
  const animationDef = animationDefinitions[randomKey];
  
  // Return a wrapped function that handles overflow control
  return (options) => {
    return runAnimationWithOverflowControl(
      animationDef.function,
      animationDef.overflow,
      { ...options, animationName: animationDef.name }
    );
  };
};

// Function to run a specific animation by key
export const getAnimationByKey = (key) => {
  if (!animationDefinitions[key]) {
    console.warn(`[Animations] Animation "${key}" not found!`);
    return null;
  }
  
  const animationDef = animationDefinitions[key];
  
  // Return a wrapped function that handles overflow control
  return (options) => {
    return runAnimationWithOverflowControl(
      animationDef.function,
      animationDef.overflow,
      { ...options, animationName: animationDef.name }
    );
  };
};

// Function to run a tab switch animation
export const runTabSwitchAnimation = (elements, positions, gridDimensions, gridRect, sticky = [], onCompleteCallback) => {
  // Get a random animation to run
  const animation = getRandomAnimation();
  if (!animation) {
    // If no animation runs, call the callback immediately if provided
    if (onCompleteCallback) onCompleteCallback();
    return; 
  }
  
  // Create a timeline for the animation
  const timeline = gsap.timeline();

  // Attach the provided callback to the timeline's onComplete event
  if (onCompleteCallback) {
    timeline.eventCallback('onComplete', onCompleteCallback);
  }
  
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
  // No longer need to return the result of animation() as we attached the callback directly
  animation({
    elements,
    newOrder: sameOrderMapping,
    positions,
    gridDimensions,
    gridRect: defaultGridRect,
    sticky,
    timeline
  });
};
