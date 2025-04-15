import gsap from 'gsap';

/**
 * Tumbleweed Animation
 * Cards roll off the right side, teleport to the left, and roll into place.
 *
 * @param {object} context - The animation context.
 * @param {object} context.elements - The card elements participating in the animation.
 * @param {Array<object>} context.positions - Array of final {x, y} positions for each card.
 * @param {object} context.gridDimensions - Dimensions of the grid { width, height, cols, rows }.
 * @param {Array<number>} context.newOrder - Array where newOrder[newIndex] = oldIndex.
 * @param {object} context.gridRect - Bounding rectangle of the grid { left, top, width, height }.
 * @param {Array<number>} context.sticky - Array of sticky item indices (old indices).
 * @param {gsap.core.Timeline} context.timeline - The GSAP timeline to add the animation to.
 */
export const tumbleweed = ({ elements, newOrder, positions, gridDimensions, gridRect, sticky = [], timeline }) => {
  // Get all card elements involved initially for calculating width etc.
  const allCardElements = Object.values(elements);
  if (allCardElements.length === 0) return;
  const cardWidth = allCardElements[0].offsetWidth; // Assume all cards are the same width
  const offScreenRight = gridRect.right + cardWidth;
  const offScreenLeft = gridRect.left - cardWidth * 2; // Start further left for a better roll-in

  const durationRollOff = 1.0;
  const durationRollIn = 1.25;
  const staggerAmount = 0.03;
  const totalCards = newOrder.length;

  // --- Create sub-timelines for each phase ---
  const rollOffTl = gsap.timeline();
  const teleportTl = gsap.timeline();
  const rollInTl = gsap.timeline();

  // Iterate based on the new order to handle shuffling correctly
  newOrder.forEach((itemIndex, newIndex) => {
    const cardElement = elements[itemIndex];
    if (!cardElement) { // Only skip if the element doesn't exist
      return;
    }

    // 1. Roll Off Right (Add to rollOffTl)
    rollOffTl.to(cardElement, {
      x: offScreenRight,
      rotation: () => gsap.utils.random(720, 1080) * (gsap.utils.random() > 0.5 ? 1 : -1), // Random spins
      duration: durationRollOff,
      ease: 'power1.in',
      force3D: true
    }, 0); // Start all roll-offs at the same time within this sub-timeline

    // 2. Teleport Left (Add to teleportTl)
    teleportTl.set(cardElement, {
      x: offScreenLeft,
      // rotation: 0 // Optionally reset rotation
    }, 0); // Set all teleports at the same time within this sub-timeline

    // 3. Roll In From Left (Add to rollInTl)
    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;
    rollInTl.to(cardElement, {
      x: finalX, // Use the position corresponding to the newIndex
      y: finalY, // Use the position corresponding to the newIndex
      rotation: 0, // End rotation at 0 degrees (upright)
      duration: durationRollIn,
      ease: 'power2.out',
      force3D: true
    }, 0); // Start all roll-ins at the same time within this sub-timeline
  });

  // Add staggers to the sub-timelines themselves
  rollOffTl.staggerFromTo(
    newOrder.map(itemIndex => elements[itemIndex]).filter(el => el), // Target elements in newOrder
    durationRollOff, // This parameter seems misplaced in staggerFromTo, removing
    { /* fromVars - not needed here */ },
    { /* toVars - already handled in the .to() */
      stagger: {
        amount: staggerAmount * totalCards,
        from: "random"
      }
    },
    0 // Stagger starts at time 0 of the rollOffTl
  );

  rollInTl.staggerFromTo(
     newOrder.map(itemIndex => elements[itemIndex]).filter(el => el), // Target elements in newOrder
     durationRollIn,
     { /* fromVars - not needed here */ },
     { /* toVars - already handled in the .to() */
       stagger: {
         amount: staggerAmount * totalCards * 1.5,
         from: "random"
       }
     },
     0 // Stagger starts at time 0 of the rollInTl
  );


  // Add the sub-timelines to the main timeline
  timeline.add(rollOffTl, 0);
  // Add a slight delay before teleporting, ensuring all roll-offs have started
  timeline.add(teleportTl, `>${durationRollOff * 0.1}`);
  // Start roll-in immediately after teleport
  timeline.add(rollInTl, "<");
};
