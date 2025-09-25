import gsap from 'gsap';

import { shouldAnimateCard } from '../utils/AnimationHelper';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../constants';

/**
 * blastOff Animation: Each card lifts like a rocket, emits a plume of smoke,
 * flies off the top of the screen, then returns with a controlled SpaceX-style
 * landing using engine "blips" to slow descent.
 *
 * Options are the same shape used across other animations in this repo.
 */
export function blastOff({ elements, newOrder, positions, gridDimensions, gridRect, sticky = [], timeline }) {
  // Card dimensions
  const cardWidth = BASE_CARD_WIDTH;
  const cardHeight = BASE_CARD_HEIGHT;

  // Basic timing parameters
  const liftDuration = 1; // lift off from ground
  const ascentDuration = 0.9; // travel off-screen
  const hoverDuration = 0.25; // very short pause off-screen before descent
  const descentDuration = 1.2; // controlled landing
  const smokeLifetime = 1.0; // lifetime for smoke puffs

  // How far above the top of the grid we send cards (off-screen)
  const offscreenY = -gridRect.height * 1;

  // Select cards that should animate
  const animatable = newOrder.filter(i => shouldAnimateCard(i, sticky));
  if (animatable.length === 0) {
    return;
  }

  // Helper to create a smoke puff element
  const createSmoke = (parent, id, width = null, height = null) => {
    // Append puffs to body and position fixed so they are visible regardless of grid overflow/position
    if (typeof document === 'undefined') return null;
    const puff = document.createElement('div');
    puff.className = 'blastoff-smoke-puff';
    // Use fixed positioning to make coordinates based on viewport
    puff.style.position = 'fixed';
    // Allow caller to pass precise sizes based on the card's actual rect
    const w = width ?? Math.round(cardWidth * 0.6);
    const h = height ?? Math.round(cardHeight * 0.35);
    puff.style.width = `${w}px`;
    puff.style.height = `${h}px`;
    puff.style.borderRadius = '50%';
    puff.style.background = 'rgba(200,200,200,0.85)';
    puff.style.pointerEvents = 'none';
    puff.id = `blastoff-smoke-${id}`;
    // append to body so puff is not clipped by grid overflow or affected by grid positioning
    document.body.appendChild(puff);
    return puff;
  };

  // Engine blip: quick upward nudge to slow descent (small negative y bursts)
  const engineBlip = (el, magnitude = 12, dur = 0.08) => {
    return gsap.to(el, { y: `-=${magnitude}`, duration: dur, ease: 'power1.out' });
  };

  // Iterate over cards in newOrder so positions/newIndex mapping is correct
  newOrder.forEach((itemIndex, newIndex) => {
    const card = elements[itemIndex];
    if (!card) return;
    if (!shouldAnimateCard(itemIndex, sticky)) return;

    const rect = card.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;

    const finalX = positions[newIndex]?.x ?? 0;
    const finalY = positions[newIndex]?.y ?? 0;

    const cardTl = gsap.timeline();

    // Raise z-index for visibility
    let originalZ;
    cardTl.call(() => {
      originalZ = card.style.zIndex;
      card.style.zIndex = 2000;
      card.style.willChange = 'transform';
    });

    // Phase 1: small engine ignition -> lift up slightly with smoke
    const igniteXJitter = (Math.random() - 0.5) * 20;
    cardTl.to(card, {
      x: currentX + igniteXJitter,
      y: currentY - 30,
      rotation: (Math.random() - 0.5) * 6,
      scale: 0.98,
      duration: liftDuration,
      ease: 'power2.out',
      force3D: true
    });

    // Emit smoke puffs during lift and ascent
    cardTl.call(() => {
      if (typeof document === 'undefined') return;
      // parent grid for absolute-positioned puffs
      const grid = card.parentNode.parentNode;
      const gridRectNow = grid.getBoundingClientRect();
      const puffCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < puffCount; i++) {
        // Use the card's live bounding rect so puffs align with the bottom center
        const cardRectNow = card.getBoundingClientRect();
        const puffW = Math.round(cardRectNow.width * 0.6);
        const puffH = Math.round(cardRectNow.height * 0.35);
        const puff = createSmoke(grid, `${itemIndex}-${i}`, puffW, puffH);
        if (!puff) continue;
        // start position: centered under the live card bottom in viewport coordinates
        const startLeft = cardRectNow.left + (cardRectNow.width / 2) - (puffW / 2) + (Math.random() - 0.5) * 12;
        const startTop = cardRectNow.top + cardRectNow.height - (puffH / 2) + Math.random() * 6;
        // place via left/top for fixed-positioned puff (viewport coords)
        puff.style.left = `${startLeft}px`;
        puff.style.top = `${startTop}px`;
        puff.style.transform = `scale(${0.6 + Math.random() * 0.6})`;
        puff.style.transformOrigin = 'center';

        // Animate the puff upward and fade using left/top (viewport coords)
        gsap.to(puff, {
          left: startLeft + (Math.random() - 0.5) * 40,
          top: startTop - (40 + Math.random() * 80),
          scale: 1.2,
          opacity: 0,
          duration: smokeLifetime + Math.random() * 0.6,
          ease: 'power1.out',
          onComplete: () => {
            if (puff.parentNode) puff.parentNode.removeChild(puff);
          }
        });
      }
    }, [], 0.05);

    // Phase 2: accelerate upward off-screen
    const ascentXDrift = (Math.random() - 0.5) * 80; // slight drift while ascending
    cardTl.to(card, {
      x: finalX + ascentXDrift,
      y: offscreenY,
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.95,
      duration: ascentDuration,
      ease: 'power3.in',
      force3D: true
    });

    // Short hover off-screen
    cardTl.to(card, { duration: hoverDuration, ease: 'none' });

    // Phase 3: descent — controlled landing with engine blips
    // Start descent from offscreenY to a point slightly above final to allow braking
    const preLandingY = finalY - 80 - Math.random() * 60;

    // Main descent to pre-landing point
    cardTl.to(card, {
      x: finalX + (Math.random() - 0.5) * 16,
      y: preLandingY,
      rotation: 0,
      scale: 1.02,
      duration: descentDuration * 0.65,
      ease: 'power2.in',
      force3D: true
    });

    // Engine blips: a series of small upward nudges to simulate thrust bursts
    const blipCount = 3 + Math.floor(Math.random() * 3);
    for (let b = 0; b < blipCount; b++) {
      const blipDelay = (descentDuration * 0.65) + b * 0.12 + Math.random() * 0.06;
      cardTl.call(() => {
        // create a tiny smoke puff during each blip
        if (typeof document !== 'undefined') {
          const grid = card.parentNode.parentNode;
          const puff = createSmoke(grid, `blip-${itemIndex}-${b}`);
          if (puff) {
            // Align the blip puff to the card's live position if available
            const cardRectNow = card.getBoundingClientRect();
            const puffW = Math.round(cardRectNow.width * 0.4);
            const puffH = Math.round(cardRectNow.height * 0.2);
            // adjust size if createSmoke used default sizes
            puff.style.width = `${puffW}px`;
            puff.style.height = `${puffH}px`;
            const px = cardRectNow.left + (cardRectNow.width / 2) - (puffW / 2) + (Math.random() - 0.5) * 8;
            const py = cardRectNow.top + cardRectNow.height - (puffH / 2) + (Math.random() - 0.5) * 6;
            puff.style.left = `${px}px`;
            puff.style.top = `${py}px`;
            puff.style.transform = `scale(0.4)`;
            puff.style.transformOrigin = 'center';
            gsap.to(puff, {
              left: px + (Math.random() - 0.5) * 20,
              top: py - (10 + Math.random() * 20),
              scale: 0.6,
              opacity: 0,
              duration: 0.6,
              ease: 'power1.out',
              onComplete: () => puff.parentNode && puff.parentNode.removeChild(puff)
            });
          }
        }
        // actual upward blip animation
        engineBlip(card, 10 + Math.random() * 8, 0.06 + Math.random() * 0.06);
      }, [], blipDelay);
    }

    // Final settle to exact final position
    cardTl.to(card, {
      x: finalX,
      y: finalY,
      rotation: 0,
      scale: 1,
      duration: descentDuration * 0.35,
      ease: 'bounce.out',
      force3D: true
    });

    // Restore original styles
    cardTl.call(() => {
      card.style.zIndex = originalZ || 'auto';
      card.style.willChange = '';
    });

    // Add this card timeline to the main timeline
    timeline.add(cardTl, 0);
  });
}
