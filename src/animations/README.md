# Animation System

This document provides an overview of the animation system used in the Rando application and serves as a guide for creating new animations.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating a New Animation](#creating-a-new-animation)
- [Animation Function Parameters](#animation-function-parameters)
- [Overflow Control](#overflow-control)
- [Animation Lifecycle](#animation-lifecycle)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Architecture Overview

The animation system is built on top of [GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/) and provides a framework for creating card animations that run during randomization or tab switching.

Key components:

1. **Animation Functions**: Individual animation implementations (e.g., `flyAndSpin.js`, `elasticBounce.js`)
2. **Animation Definitions**: Metadata about each animation in `index.js`
3. **Animation Helper**: Utilities for managing animations in `AnimationHelper.js`
4. **Card Grid Component**: Manages the card layout and triggers animations

## Creating a New Animation

To create a new animation:

1. Create a new file in the `src/animations` directory (e.g., `myAnimation.js`)
2. Implement the animation function following the standard interface
3. Import and register the animation in `index.js`

### Basic Template

```javascript
import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';

/**
 * MyAnimation: Brief description of what the animation does
 * 
 * @param {object} options - Animation options
 * @param {object} options.elements - Object mapping itemIndex to the card DOM element
 * @param {Array<number>} options.newOrder - Array where newOrder[newIndex] = oldIndex
 * @param {Array<{x: number, y: number}>} options.positions - Array of final calculated {x, y} positions
 * @param {{width: number, height: number}} options.gridDimensions - Dimensions of the grid container
 * @param {DOMRect} options.gridRect - Bounding client rect of the grid container
 * @param {Array<number>} options.sticky - Array of sticky item indices (old indices)
 * @param {gsap.core.Timeline} options.timeline - The main GSAP timeline to add tweens to
 */
export function myAnimation({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[myAnimation] Animating cards...');

  // Loop through each card
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    
    // Skip if element doesn't exist or should not be animated
    if (!cardElement || !shouldAnimateCard(itemIndex, sticky)) {
      return;
    }

    // Get final position from calculated positions
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    // Create animation for this card
    timeline.to(cardElement, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: 1,
      ease: "power2.out",
      force3D: true
    }, 0); // The '0' means all animations start at the same time
  });
}
```

### Registering Your Animation

In `src/animations/index.js`, add your animation to the `animationDefinitions` object:

```javascript
import { myAnimation } from './myAnimation';

export const animationDefinitions = {
  // ... existing animations
  myAnimation: {
    name: 'My Animation',
    function: myAnimation,
    description: 'Brief description of what your animation does',
    overflow: true // Set to true if your animation needs overflow visible
  },
};
```

## Animation Function Parameters

Each animation function receives a single `options` object with the following properties:

| Parameter | Type | Description |
|-----------|------|-------------|
| `elements` | `Object` | Mapping of original item indices to their DOM elements |
| `newOrder` | `Array<number>` | Array where `newOrder[newIndex] = oldIndex` |
| `positions` | `Array<{x,y}>` | Array of final calculated positions for each card |
| `gridDimensions` | `{width, height}` | Dimensions of the grid container |
| `gridRect` | `DOMRect` | Bounding client rect of the grid container |
| `sticky` | `Array<number>` | Array of sticky item indices (old indices) |
| `timeline` | `gsap.core.Timeline` | The main GSAP timeline to add tweens to |

### Understanding `newOrder`

The `newOrder` array maps new positions to original positions:
- `newOrder[newIndex] = oldIndex`
- This tells you which card (by its original index) should end up at each new position

## Overflow Control

Some animations may need cards to move outside the grid container's boundaries. The animation system provides automatic overflow control:

1. Each animation definition includes an `overflow` property:
   - `true`: The grid's overflow will be set to `visible` during the animation
   - `false`: The grid's overflow will remain `hidden` during the animation

2. The `runAnimationWithOverflowControl` function automatically:
   - Sets the grid's overflow based on the animation's needs
   - Restores the previous overflow state when the animation completes

## Animation Lifecycle

1. **Preparation**: The app captures current card positions before state updates
2. **State Update**: React updates the DOM with the new card order
3. **Animation**: After the DOM update, the animation runs:
   - Cards are initially positioned at their old locations
   - The animation transitions them to their new locations
4. **Completion**: When the animation finishes, callbacks are triggered

## Best Practices

1. **Performance**:
   - Use `force3D: true` for hardware acceleration
   - Animate transform properties (x, y, rotation, scale) instead of top/left
   - Use appropriate easing functions for smooth motion

2. **Sticky Cards**:
   - Always check `shouldAnimateCard(itemIndex, sticky)` to respect sticky card settings

3. **Logging**:
   - Include descriptive console logs for debugging
   - Use the animation name as a prefix, e.g., `[myAnimation] Message`

4. **Randomness**:
   - Use `gsap.utils.random()` for controlled randomness
   - Seed randomness based on card indices for consistency

5. **Timeline Management**:
   - Add all animations to the provided `timeline` parameter
   - Use position parameters (0, "+=0.1", etc.) to control timing

## Examples

Here are some examples of different animation techniques:

### Basic Animation (from elasticBounce.js)

```javascript
newOrder.forEach((itemIndex, newIndex) => {
  const cardElement = elements[itemIndex];
  if (!cardElement || !shouldAnimateCard(itemIndex, sticky)) return;

  const finalX = positions[newIndex]?.x ?? 0;
  const finalY = positions[newIndex]?.y ?? 0;

  timeline.to(cardElement, {
    x: finalX,
    y: finalY,
    rotation: 0,
    scale: 1,
    duration: 1.2,
    ease: "elastic.out(1, 0.5)",
    force3D: true
  }, 0);
});
```

### Complex Path Animation (simplified from rollerCoaster.js)

```javascript
newOrder.forEach((itemIndex, newIndex) => {
  const cardElement = elements[itemIndex];
  if (!cardElement || !shouldAnimateCard(itemIndex, sticky)) return;

  const finalX = positions[newIndex]?.x ?? 0;
  const finalY = positions[newIndex]?.y ?? 0;
  
  // Create a path with control points
  const path = [
    {x: currentX, y: currentY},                      // Start
    {x: currentX + 100, y: currentY - 200},          // Control point 1
    {x: finalX - 100, y: finalY - 200},              // Control point 2
    {x: finalX, y: finalY}                           // End
  ];
  
  // Animate along the path
  const cardTl = gsap.timeline();
  cardTl.to(cardElement, {
    motionPath: {
      path: path,
      curviness: 1.5
    },
    duration: 2,
    ease: "power2.inOut"
  });
  
  // Add to main timeline
  timeline.add(cardTl, 0);
});
```

### Staggered Animation (simplified from matrixRain.js)

```javascript
// Sort cards by column for a rain effect
const sortedIndices = newOrder.map((oldIndex, newIndex) => ({oldIndex, newIndex}))
  .sort((a, b) => {
    const posA = positions[a.newIndex];
    const posB = positions[b.newIndex];
    return posA.x - posB.x; // Sort by x position (column)
  });

// Animate each card with staggered timing
sortedIndices.forEach(({oldIndex, newIndex}, i) => {
  const cardElement = elements[oldIndex];
  if (!cardElement || !shouldAnimateCard(oldIndex, sticky)) return;

  const finalX = positions[newIndex]?.x ?? 0;
  const finalY = positions[newIndex]?.y ?? 0;
  
  // Stagger the start time based on column
  const staggerTime = i * 0.1;
  
  timeline.fromTo(cardElement,
    { y: -100, opacity: 0 },
    { 
      x: finalX, 
      y: finalY,
      opacity: 1,
      duration: 1.5,
      ease: "bounce.out"
    }, 
    staggerTime // Each card starts at a different time
  );
});
```

For more examples, explore the existing animation files in the `src/animations` directory.
