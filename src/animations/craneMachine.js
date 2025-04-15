import gsap from 'gsap';
import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * craneMachine Animation: Cards are picked up by cranes and moved to their positions
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
export function craneMachine({ elements, newOrder, positions, gridDimensions, gridRect, sticky, timeline }) {
  console.log('[craneMachine] Animating cards with crane machine...');
  
  // Store all created cranes for cleanup
  const cranes = [];
  
  // Create a container for all cranes
  const cranesContainer = document.createElement('div');
  cranesContainer.className = 'animation-cranes-container';
  cranesContainer.style.position = 'absolute';
  cranesContainer.style.top = '15px';
  cranesContainer.style.left = '0';
  cranesContainer.style.width = '100%';
  cranesContainer.style.height = '100%';
  cranesContainer.style.pointerEvents = 'none';
  cranesContainer.style.zIndex = '1000';
  
  // Add the container to the grid
  const gridElement = document.getElementById('card-grid');
  if (gridElement) {
    gridElement.appendChild(cranesContainer);
  }
  
  // Group cards for crane assignment (1 crane per card for better synchronization)
  const cardGroups = [];
  for (let i = 0; i < newOrder.length; i++) {
    cardGroups.push([newOrder[i]]);
  }
  
  // Calculate the maximum number of cranes (cap at 20 for performance)
  const maxCranes = Math.min(cardGroups.length, 20);
  
  // Create a crane for each group
  for (let i = 0; i < maxCranes; i++) {
    const crane = createCrane(i);
    cranes.push(crane);
    cranesContainer.appendChild(crane);
  }
  
  // Create a master timeline for all crane animations
  const masterTimeline = gsap.timeline();
  
  // Animate each group of cards with its assigned crane
  cardGroups.forEach((group, groupIndex) => {
    // Skip if we've reached the maximum number of cranes
    if (groupIndex >= maxCranes) return;
    
    // Get the crane for this group
    const crane = cranes[groupIndex];
    
    // Create a timeline for this crane's animations
    const craneTl = gsap.timeline({
      delay: groupIndex * 0.15 // Stagger the start times
    });
    
    // Animate each card in the group
    group.forEach((oldIndex, groupCardIndex) => {
      const cardElement = elements[oldIndex];
      
      // Skip if element doesn't exist or should not be animated
      if (!cardElement || !shouldAnimateCard(oldIndex, sticky)) {
        return;
      }
      
      // Get the new index for this card
      const newIndex = newOrder.indexOf(oldIndex);
      
      // Get the final position for this card
      const finalX = positions[newIndex]?.x ?? 0;
      const finalY = positions[newIndex]?.y ?? 0;
      
      // Get the current position of the card
      const cardRect = cardElement.getBoundingClientRect();
      const currentX = gsap.getProperty(cardElement, "x");
      const currentY = gsap.getProperty(cardElement, "y");
      
      // Calculate crane positions
      const craneStartX = currentX + (BASE_CARD_WIDTH / 2);
      const craneEndX = finalX + (BASE_CARD_WIDTH / 2);
      const craneTopY = -50; // Position above the grid
      
      // Create a sub-timeline for this card's animation
      const cardTl = gsap.timeline();
      
      // 1. Position crane above the card
      cardTl.set(crane, {
        height: '0px',
        x: craneStartX,
        y: craneTopY,
        opacity: 1
      });
      
      // 2. Lower the crane rope to the card
      cardTl.to(crane, {
        height: Math.abs(craneTopY - currentY) + (BASE_CARD_HEIGHT / 2),
        duration: 0.5,
        ease: 'power1.inOut'
      });
      
      // 3. Attach to the card (slight pause and hook animation)
      cardTl.to(crane.querySelector('.animation-crane-hook-container'), {
        rotation: 5, // Slight rotation when attaching
        duration: 0.2,
        ease: 'power1.out'
      });
      
      cardTl.to({}, { duration: 0.1 });
      
      // 4. Create a parent timeline for lifting to ensure synchronization
      const liftTl = gsap.timeline();
      
      // Lift the card and retract rope simultaneously
      liftTl.to(cardElement, {
        y: craneTopY + 10, // Lift to just below the crane top
        duration: 0.6,
        ease: 'power2.out'
      }, 0);
      
      liftTl.to(crane, {
        height: '60px', // Short rope when card is lifted
        duration: 0.6,
        ease: 'power2.out'
      }, 0);
      
      // Return hook to normal position as part of the same movement
      liftTl.to(crane.querySelector('.animation-crane-hook-container'), {
        rotation: 0,
        duration: 0.4,
        ease: 'power1.inOut'
      }, 0.1);
      
      // Add the lift timeline to the main card timeline
      cardTl.add(liftTl);
      
      // 5. Create a parent timeline for horizontal movement to ensure synchronization
      const moveTl = gsap.timeline();
      
      // Move crane horizontally
      moveTl.to(crane, {
        x: craneEndX,
        duration: 0.8,
        ease: 'power1.inOut'
      }, 0);
      
      // Create a variable to track the card's position relative to the crane
      let cardXOffset = finalX - craneEndX + (BASE_CARD_WIDTH / 2);
      
      // Move card along with crane in perfect sync
      moveTl.to(cardElement, {
        x: finalX,
        duration: 0.8,
        ease: 'power1.inOut',
        // Add slight swing effect and ensure card stays with hook
        onUpdate: function() {
          const progress = this.progress();
          const swingAmount = Math.sin(progress * Math.PI) * 5;
          
          // Get current crane position
          const currentCraneX = gsap.getProperty(crane, "x");
          
          // Calculate where card should be based on crane position
          const idealCardX = currentCraneX - (BASE_CARD_WIDTH / 2) + cardXOffset;
          
          // Set card position and rotation
          gsap.set(cardElement, { 
            rotation: swingAmount,
            x: idealCardX // This ensures perfect synchronization
          });
        }
      }, 0); // Start at exactly the same time
      
      // Add subtle hook swing during horizontal movement
      moveTl.to(crane.querySelector('.animation-crane-hook-container'), {
        rotation: 'random(-3, 3)', // Small random rotation
        duration: 0.4,
        repeat: 1,
        yoyo: true,
        ease: 'sine.inOut'
      }, 0);
      
      // Add the movement timeline to the main card timeline
      cardTl.add(moveTl);
      
      // 6. Create a parent timeline for lowering to ensure synchronization
      const lowerTl = gsap.timeline();
      
      // Lower the crane rope
      lowerTl.to(crane, {
        height: Math.abs(craneTopY - finalY) + (BASE_CARD_HEIGHT / 2),
        duration: 0.5,
        ease: 'power1.inOut'
      }, 0);
      
      // Create a variable to track the card's vertical position relative to the crane
      let cardYOffset = finalY - (craneTopY + 10);
      
      // Lower the card simultaneously with perfect synchronization
      lowerTl.to(cardElement, {
        y: finalY,
        rotation: 0,
        duration: 0.5,
        ease: 'power3.out',
        // Ensure card stays with hook during lowering
        onUpdate: function() {
          // Get current crane height
          const currentCraneHeight = gsap.getProperty(crane, "height");
          
          // Calculate ideal card Y position based on crane height
          const idealCardY = craneTopY + currentCraneHeight - (BASE_CARD_HEIGHT / 2);
          
          // Set card position
          gsap.set(cardElement, { y: idealCardY });
        }
      }, 0);
      
      // Rotate hook slightly when placing the card
      lowerTl.to(crane.querySelector('.animation-crane-hook-container'), {
        rotation: -3, // Slight rotation when placing
        duration: 0.3,
        ease: 'power1.out'
      }, 0.2);
      
      // Add the lowering timeline to the main card timeline
      cardTl.add(lowerTl);
      
      // 7. Create a parent timeline for release and bounce to ensure synchronization
      const releaseTl = gsap.timeline();
      
      // Initial bounce down
      releaseTl.to(cardElement, {
        y: finalY + 10,
        duration: 0.15,
        ease: 'power1.in'
      }, 0);
      
      // Return hook to normal position
      releaseTl.to(crane.querySelector('.animation-crane-hook-container'), {
        rotation: 0,
        duration: 0.2,
        ease: 'power1.inOut'
      }, 0.05);
      
      // Bounce back to final position
      releaseTl.to(cardElement, {
        y: finalY,
        duration: 0.3,
        ease: 'bounce.out'
      }, 0.15);
      
      // Add the release timeline to the main card timeline
      cardTl.add(releaseTl);
      
      // 8. Create a parent timeline for retracting the crane
      const retractTl = gsap.timeline();
      
      // Retract the crane rope
      retractTl.to(crane, {
        height: '0px',
        duration: 0.6, // Longer duration to ensure it's visible longer
        ease: 'power1.inOut'
      }, 0);
      
      // Add a small delay before hiding the crane
      retractTl.to({}, { duration: 0.2 }); // Pause before hiding
      
      // 9. Hide the crane after it's fully retracted
      retractTl.set(crane, { opacity: 0 });
      
      // Add the retract timeline to the main card timeline
      cardTl.add(retractTl);
      
      // Add this card's timeline to the crane timeline
      // If it's the second card in the group, start after the first card is lifted
      const position = groupCardIndex === 0 ? 0 : '1.2';
      craneTl.add(cardTl, position);
    });
    
    // Add this crane's timeline to the master timeline
    masterTimeline.add(craneTl, 0);
  });
  
  // Add the master timeline to the main timeline
  timeline.add(masterTimeline, 0);
  
  // Clean up cranes when the animation is complete
  timeline.call(() => {
    if (cranesContainer && cranesContainer.parentNode) {
      cranesContainer.parentNode.removeChild(cranesContainer);
    }
  });
  
  /**
   * Creates a crane element
   * @param {number} id - Unique identifier for the crane
   * @returns {HTMLElement} - The crane DOM element
   */
  /**
 * Creates a crane element with an improved hook design
 * @param {number} id - Unique identifier for the crane
 * @returns {HTMLElement} - The crane DOM element
 */
  function createCrane(id) {
    // Generate a color based on the crane ID
    const hue = (id * 30) % 360; // Spread colors around the color wheel
    const color = `hsl(${hue}, 70%, 50%)`;
    const darkColor = `hsl(${hue}, 70%, 40%)`; // Darker shade for depth
    const lightColor = `hsl(${hue}, 70%, 60%)`; // Lighter shade for highlights
    
    // Create the crane element (cable)
    const crane = document.createElement('div');
    crane.className = 'animation-crane';
    crane.id = `crane-${id}`;
    crane.style.position = 'absolute';
    crane.style.width = '3px'; // Slightly thicker cable
    // Use a dashed background for a more realistic cable/chain look
    crane.style.background = 'none';
    crane.style.backgroundImage = `linear-gradient(to bottom, ${darkColor} 50%, rgba(0,0,0,0.1) 50%)`;
    crane.style.backgroundSize = '3px 8px'; // Larger size of the dashes
    crane.style.transformOrigin = 'top center';
    crane.style.zIndex = 1000 + id;
    crane.style.opacity = 0; // Start hidden
    
    // Create a cabin/control room at the top of the crane
    const cabin = document.createElement('div');
    cabin.className = 'animation-crane-cabin';
    cabin.style.position = 'absolute';
    cabin.style.top = '-14px'; // Position above the cable
    cabin.style.left = '-10px'; // Center on the cable
    cabin.style.width = '20px';
    cabin.style.height = '12px';
    cabin.style.backgroundColor = darkColor;
    cabin.style.borderRadius = '3px';
    cabin.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    
    // Add a small window to the cabin
    const cabinWindow = document.createElement('div');
    cabinWindow.className = 'animation-crane-cabin-window';
    cabinWindow.style.position = 'absolute';
    cabinWindow.style.top = '2px';
    cabinWindow.style.left = '3px';
    cabinWindow.style.width = '14px';
    cabinWindow.style.height = '5px';
    cabinWindow.style.backgroundColor = 'rgba(200, 230, 255, 0.7)';
    cabinWindow.style.borderRadius = '1px';
    cabinWindow.style.boxShadow = 'inset 0 0 2px rgba(0,0,0,0.2)';
    
    // Add the window to the cabin
    cabin.appendChild(cabinWindow);
    
    // Add the cabin to the crane
    crane.appendChild(cabin);
    
    // Create hook container for better positioning and animation
    const hookContainer = document.createElement('div');
    hookContainer.className = 'animation-crane-hook-container';
    hookContainer.style.position = 'absolute';
    hookContainer.style.bottom = '-30px'; // Lower position for larger hook
    hookContainer.style.left = '-12px'; // Center the hook on the cable
    hookContainer.style.width = '24px';
    hookContainer.style.height = '30px';
    hookContainer.style.transformOrigin = 'top center';
    
    // Create the hook connection mechanism (pulley)
    const hookPulley = document.createElement('div');
    hookPulley.className = 'animation-crane-hook-pulley';
    hookPulley.style.position = 'absolute';
    hookPulley.style.top = '0';
    hookPulley.style.left = '6px'; // Center on the container
    hookPulley.style.width = '12px';
    hookPulley.style.height = '8px';
    hookPulley.style.backgroundColor = darkColor;
    hookPulley.style.borderRadius = '6px 6px 0 0';
    hookPulley.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
    
    // Add pulley detail (the wheel)
    const pulleyWheel = document.createElement('div');
    pulleyWheel.className = 'animation-crane-pulley-wheel';
    pulleyWheel.style.position = 'absolute';
    pulleyWheel.style.top = '2px';
    pulleyWheel.style.left = '2px';
    pulleyWheel.style.width = '8px';
    pulleyWheel.style.height = '4px';
    pulleyWheel.style.borderRadius = '4px';
    pulleyWheel.style.backgroundColor = lightColor;
    pulleyWheel.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.3)';
    
    // Create the hook curve (the C-shaped part)
    const hookCurve = document.createElement('div');
    hookCurve.className = 'animation-crane-hook-curve';
    hookCurve.style.position = 'absolute';
    hookCurve.style.top = '12px';
    hookCurve.style.left = '6px';
    hookCurve.style.width = '12px';
    hookCurve.style.height = '16px';
    hookCurve.style.border = 'none';
    hookCurve.style.borderLeft = `4px solid ${color}`;
    hookCurve.style.borderBottom = `4px solid ${color}`;
    hookCurve.style.borderRadius = '0 0 0 10px'; // Rounded bottom-left corner
    hookCurve.style.boxShadow = `inset 1px 1px 2px rgba(0,0,0,0.2)`;
    
    // Create hook tip (the pointed part)
    const hookTip = document.createElement('div');
    hookTip.className = 'animation-crane-hook-tip';
    hookTip.style.position = 'absolute';
    hookTip.style.bottom = '-2px';
    hookTip.style.right = '0';
    hookTip.style.width = '8px';
    hookTip.style.height = '6px';
    hookTip.style.backgroundColor = color;
    hookTip.style.borderRadius = '0 0 4px 2px'; // Rounded bottom corners
    hookTip.style.transform = 'rotate(-15deg)'; // Slight angle for realism
    hookTip.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
    
    // Add metal shine effect to hook tip
    const tipShine = document.createElement('div');
    tipShine.className = 'animation-crane-hook-tip-shine';
    tipShine.style.position = 'absolute';
    tipShine.style.top = '1px';
    tipShine.style.left = '1px';
    tipShine.style.width = '3px';
    tipShine.style.height = '2px';
    tipShine.style.borderRadius = '50%';
    tipShine.style.backgroundColor = 'rgba(255,255,255,0.6)'; // Bright highlight for metal shine
    
    // Safety latch (the little piece that keeps items from falling off)
    const safetyLatch = document.createElement('div');
    safetyLatch.className = 'animation-crane-safety-latch';
    safetyLatch.style.position = 'absolute';
    safetyLatch.style.bottom = '5px';
    safetyLatch.style.right = '4px';
    safetyLatch.style.width = '7px';
    safetyLatch.style.height = '2px';
    safetyLatch.style.backgroundColor = lightColor;
    safetyLatch.style.borderRadius = '1px';
    safetyLatch.style.transform = 'rotate(30deg)';
    safetyLatch.style.transformOrigin = 'right center';
    safetyLatch.style.boxShadow = '0 1px 1px rgba(0,0,0,0.4)';
    
    // Assemble the hook components
    hookPulley.appendChild(pulleyWheel);
    hookContainer.appendChild(hookPulley);
    hookCurve.appendChild(safetyLatch);
    hookCurve.appendChild(hookTip);
    hookContainer.appendChild(hookCurve);
    crane.appendChild(hookContainer);
    
    return crane;
  }
}
