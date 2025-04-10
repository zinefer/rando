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

export const animations = {
  flyAndSpin,
  elasticBounce,
  swirlVortex,
  matrixRain,
  chainJuggle,
  swingChain,
  tornado,
  fireworks,
  melt,
  rollerCoaster,
  splash,
  // Add other animations here as they are created
  // e.g., simpleSwap, fadeInOut
};

// Function to get a random animation function
export const getRandomAnimation = () => {
  const animationKeys = Object.keys(animations);
  if (animationKeys.length === 0) {
    console.warn('[Animations] No animations available!');
    return null; // Or a default fallback function
  }
  const randomKey = animationKeys[Math.floor(Math.random() * animationKeys.length)];
  console.log(`[Animations] Selected random animation: ${randomKey}`);
  return animations[randomKey];
};
