export const GAME_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920;
export const GAME_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 1080;

export const PLAYER_SPEED = 6;
export const PLAYER_BOOST_SPEED = 10;
export const PLAYER_RADIUS = 35; 

export const PLAYER_MAX_BOOST_TIME = 10; 

// Reduced speeds as requested
export const DOG_SPEED = 2.2; 
export const DOG_SPRINT_SPEED = 7.0; 
export const OLD_MAN_SPEED = 1.2;

export const TAG_TIME_REQUIRED = 100; // 100 / 4 per click = 25 clicks
export const GAME_DURATION = 180; 

// Aesthetic Colors
export const COLOR_WHITE = '#FFFFFF';
export const COLOR_BLACK = '#050505'; // Very deep charcoal/black
export const COLOR_GRAY = '#AAAAAA'; 
export const COLOR_ENEMY = '#FFFFFF'; 

export const WALL_DIMENSIONS = { width: 120, height: 20 };