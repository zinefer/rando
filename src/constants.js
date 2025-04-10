// src/constants.js

// Base dimensions of the card content area
export const BASE_CARD_WIDTH = 132;
export const BASE_CARD_HEIGHT = 132;

// Margins around the card (adjust if needed based on actual CSS)
// Assuming Tailwind p-1 which is 4px padding on all sides, so 8px total margin between cards
export const CARD_MARGIN_X = 8; 
export const CARD_MARGIN_Y = 8; 

// Effective dimensions including margins for layout calculations
export const EFFECTIVE_CARD_WIDTH = BASE_CARD_WIDTH + CARD_MARGIN_X;
export const EFFECTIVE_CARD_HEIGHT = BASE_CARD_HEIGHT + CARD_MARGIN_Y;
