

// Résolution de référence HD pour garantir les proportions
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

export const PLAYER_SPEED = 7;
export const PLAYER_BOOST_SPEED = 11;
export const PLAYER_RADIUS = 35; 
export const SLOW_ZONE_RADIUS = 200;
export const GIANT_DOG_SIZE = 150;

// AI Simulation Constants
export const AI_GROW_PROBABILITY = 0.005; // 0.5% chance per frame (~30% per second)
export const AI_PIPI_PROBABILITY = 0.01; // 1% chance per frame
export const AI_SLOW_ZONE_PROBABILITY = 0.01;
export const AI_DISPERSION_PROBABILITY = 0.005;
export const AI_CLEAN_PROBABILITY = 0.02;

export const AI_GROW_COOLDOWN = 600; // 10 seconds
export const AI_PIPI_COOLDOWN = 300; // 5 seconds
export const AI_SLOW_ZONE_COOLDOWN = 600; // 10 seconds
export const AI_DISPERSION_COOLDOWN = 300; // 5 seconds
export const AI_CLEAN_COOLDOWN = 120; // 2 seconds

export const PLAYER_MAX_BOOST_TIME = 20; 
export const PLAYER_MAX_GHOST_TIME = 20; 

// Vitesses ajustées pour la résolution HD
// CHIEN RALENTI (Avant: 2.8 et 7.5)
export const DOG_SPEED = 1.6; 
export const DOG_SPRINT_SPEED = 4.5; 
export const DOG_BOOST_SPEED = 6.0; // Boost MIDI (Channel 3) - Moins rapide que Tchipeur (11)
export const OLD_MAN_SPEED = 1.8;

export const TAG_TIME_REQUIRED = 100; // 100 / 4 per click = 25 clicks
export const GAME_DURATION = 180; 

// Aesthetic Colors
export const COLOR_WHITE = '#FFFFFF';
export const COLOR_BLACK = '#050505'; // Very deep charcoal/black
export const COLOR_GRAY = '#AAAAAA'; 
export const COLOR_ENEMY = '#FFFFFF'; 

export const WALL_DIMENSIONS = { width: 120, height: 20 };