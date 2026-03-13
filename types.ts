

export type Vector2 = { x: number; y: number };

export enum EntityType {
  PLAYER = 'PLAYER',
  WALL = 'WALL',
  BARRIER = 'BARRIER',
  DOG = 'DOG',
  OLD_MAN = 'OLD_MAN',
}

export interface EntityInput {
    axisX: number;
    axisY: number;
    action1?: boolean; // Rotation for barrier, etc.
    boost?: boolean; // Boost flag (ex: pour le chien via bouton noir)
}

export interface InputState {
  // Player Controls
  axisX: number; // -1 to 1
  axisY: number; // -1 to 1
  actionPrimary: boolean; // Held state
  actionPrimaryTrigger: boolean; // Just pressed (for spamming)
  actionSecondary: boolean; // Boost / Scare
  actionTertiary: boolean; // Special (Teleport)
  actionGhost: boolean; // Ghost mode (traversing walls)
  actionCancel: boolean;

  // Enemy Remote Controls (MIDI/OSC)
  enemies: {
      barrier: EntityInput;
      dog: EntityInput & { growTrigger?: boolean; pipiTrigger?: boolean };
      oldMan: EntityInput & { actionCleanTrigger?: boolean; slowZoneTrigger?: boolean; dispersionTrigger?: boolean };
  };
  
  // Debug
  debugMidi?: string;
}

export interface Wall {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isTagged: boolean;
  tagProgress: number; // 0 to 100
  completedTime?: number; // Timestamp when tagged
}

export interface Enemy {
  id: string;
  type: EntityType.BARRIER | EntityType.DOG | EntityType.OLD_MAN;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // For barrier rotation
  velocity: Vector2;
  state: 'idle' | 'chasing' | 'barking' | 'yelling' | 'cleaning';
  cooldown: number;
  sprintTimer?: number; // For Dog sprint mechanic
  isManual?: boolean; // True if MIDI control has taken over
  manualTimer?: number; // Timer to revert to AI if no input
  randomSpeedFactor?: number; // Multiplicateur de vitesse aléatoire
  randomSpeedTimer?: number; // Timer pour changer le facteur aléatoire
  
  // Logic spécifique au Boost Chien
  isBoosting?: boolean; 
  lastMoveDir?: Vector2;

  // Logic spécifique au Vieux (Anti-Stuck)
  lastPosition?: Vector2;
  stuckCheckTimer?: number;
  totalStuckFrames?: number;

  // Logic spécifique au Chien (Anti-Stuck)
  stuckFrames?: number;
  lastX?: number;
  lastY?: number;

  // Logic spécifique au Chien (Grossissement)
  isGrowing?: boolean;
  growScale?: number; // 1.0 to 2.0 for example

  // Logic spécifique au Boost Chien (Nouveau)
  boostCooldownTimer?: number;
  boostActiveTimer?: number;
  
  // Dispersion target
  dispersionTarget?: Vector2;

  // AI Logic Fields
  aiGrowCooldown?: number;
  aiPipiCooldown?: number;
  aiSlowZoneCooldown?: number;
  aiDispersionCooldown?: number;
  aiCleanCooldown?: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  velocity: Vector2;
  isBoosting: boolean;
  isGhosting: boolean;
  canTeleport: boolean;
  tagsCompleted: number;
  stunTimer: number; // New property: > 0 means cannot tag
  boostTimeLeft: number; // In seconds
  ghostTimeLeft: number; // In seconds
  dogHits: number; // Count of times hit by a dog
  lastHitTime?: number; // Timestamp of last hit
  lastMoveDir: Vector2; // Memorize direction for boost latching
}

export interface GameConfig {
  wallCount: number;
  dogCount: number;
  oldManCount: number;
  gameDuration: number; // Duration in seconds
  boostDuration: number; // Duration in seconds
  ghostDuration: number; // Duration in seconds
  tagSpamRequired: number; // Number of spams to tag a wall
  maxDogHits: number; // Number of hits to lose
  slowZoneDuration: number; // Duration in seconds
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  invertVertical: boolean;
  dogGrowDuration: number;
}

export interface Puddle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timeLeft: number; // in seconds
  wallId: string; // The wall it's attached to
}

export interface GameState {
  status: 'MENU' | 'PLAYING' | 'VICTORY' | 'GAMEOVER';
  config: GameConfig;
  timeLeft: number;
  player: Player;
  walls: Wall[];
  enemies: Enemy[];
  particles: Particle[];
  screenShake: number;
  audioEvents: string[]; // Queue of one-shot audio events to play this frame
  slowZoneTimeLeft: number; // In seconds
  isSlowZoneActive: boolean;
  globalSlowZoneCooldown: number; // New: global cooldown for AI slow zone (in frames)
  dogGrowTimeLeft: number; // In seconds
  puddles: Puddle[];
  lastPeeWallId: string | null;
  peeCount: number;
  usedRiddleIndices: number[];
  lastMidiDebug?: string; // Last raw MIDI message for debug
  wrongAnswers: number; // Count of wrong answers in enigma
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}