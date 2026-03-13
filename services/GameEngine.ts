import { 
  GameState, 
  InputState, 
  EntityType, 
  Wall, 
  Enemy,
  GameConfig,
  Player,
  Puddle
} from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  PLAYER_SPEED, 
  PLAYER_BOOST_SPEED,
  TAG_TIME_REQUIRED,
  DOG_SPEED,
  DOG_SPRINT_SPEED,
  DOG_BOOST_SPEED,
  OLD_MAN_SPEED,
  PLAYER_RADIUS,
  SLOW_ZONE_RADIUS,
  GIANT_DOG_SIZE,
  PLAYER_MAX_BOOST_TIME,
  PLAYER_MAX_GHOST_TIME,
  AI_GROW_PROBABILITY,
  AI_PIPI_PROBABILITY,
  AI_SLOW_ZONE_PROBABILITY,
  AI_DISPERSION_PROBABILITY,
  AI_CLEAN_PROBABILITY,
  AI_GROW_COOLDOWN,
  AI_PIPI_COOLDOWN,
  AI_SLOW_ZONE_COOLDOWN,
  AI_DISPERSION_COOLDOWN,
  AI_CLEAN_COOLDOWN
} from '../constants';

// --- PHYSICS HELPERS ---

const checkCircleRect = (cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number): boolean => {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (r * r);
};

const checkAABB = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean => {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
};

/**
 * Resolves overlaps between an entity and walls/boundaries.
 * Pushes the entity out to the nearest valid position.
 */
const resolveOverlap = (entity: any, walls: Wall[], isCircle: boolean = false) => {
    const radius = isCircle ? (entity.radius || PLAYER_RADIUS) : (entity.width / 2);
    const margin = 20;
    
    // 1. Boundary check (Keep inside game area with margin)
    if (isCircle) {
        entity.x = Math.max(radius + margin, Math.min(GAME_WIDTH - radius - margin, entity.x));
        entity.y = Math.max(radius + margin, Math.min(GAME_HEIGHT - radius - margin, entity.y));
    } else {
        entity.x = Math.max(entity.width/2 + margin, Math.min(GAME_WIDTH - entity.width/2 - margin, entity.x));
        entity.y = Math.max(entity.height/2 + margin, Math.min(GAME_HEIGHT - entity.height/2 - margin, entity.y));
    }

    // 2. Wall overlap resolution
    // We do multiple passes to handle cases where pushing out of one wall might push into another
    for (let pass = 0; pass < 2; pass++) {
        for (const wall of walls) {
            const isHit = isCircle
                ? checkCircleRect(entity.x, entity.y, radius, wall.x, wall.y, wall.width, wall.height)
                : checkAABB(entity.x - entity.width/2, entity.y - entity.height/2, entity.width, entity.height, wall.x, wall.y, wall.width, wall.height);
            
            if (isHit) {
                // Find nearest edge to push out to
                const dLeft = Math.abs(entity.x - wall.x);
                const dRight = Math.abs(entity.x - (wall.x + wall.width));
                const dTop = Math.abs(entity.y - wall.y);
                const dBottom = Math.abs(entity.y - (wall.y + wall.height));
                const min = Math.min(dLeft, dRight, dTop, dBottom);
                
                if (min === dLeft) entity.x = wall.x - radius - 1;
                else if (min === dRight) entity.x = wall.x + wall.width + radius + 1;
                else if (min === dTop) entity.y = wall.y - radius - 1;
                else if (min === dBottom) entity.y = wall.y + wall.height + radius + 1;

                // Re-apply boundary checks after wall push
                if (isCircle) {
                    entity.x = Math.max(radius + margin, Math.min(GAME_WIDTH - radius - margin, entity.x));
                    entity.y = Math.max(radius + margin, Math.min(GAME_HEIGHT - radius - margin, entity.y));
                } else {
                    entity.x = Math.max(entity.width/2 + margin, Math.min(GAME_WIDTH - entity.width/2 - margin, entity.x));
                    entity.y = Math.max(entity.height/2 + margin, Math.min(GAME_HEIGHT - entity.height/2 - margin, entity.y));
                }
            }
        }
    }
};

const moveEntity = (
  x: number, 
  y: number, 
  vx: number, 
  vy: number, 
  width: number, 
  height: number, 
  walls: Wall[],
  puddles: Puddle[] = [],
  isCircle: boolean = false,
  isGhost: boolean = false,
  ignorePuddles: boolean = false
): { x: number, y: number, hitWall: boolean } => {
  
  let newX = x;
  let newY = y;
  let hit = false;
  const radius = width / 2;
  const margin = 20;

  // STEP 1: MOVE X
  const nextX = x + vx;
  let collisionX = false;

  if (isCircle) {
      if (nextX < radius + margin) { newX = radius + margin; collisionX = true; }
      else if (nextX > GAME_WIDTH - radius - margin) { newX = GAME_WIDTH - radius - margin; collisionX = true; }
      else newX = nextX;
  } else {
      if (nextX - width/2 < margin) { newX = width/2 + margin; collisionX = true; }
      else if (nextX + width/2 > GAME_WIDTH - margin) { newX = GAME_WIDTH - margin - width/2; collisionX = true; }
      else newX = nextX;
  }

  if (!collisionX && !isGhost) {
      for (const wall of walls) {
          const isHit = isCircle 
              ? checkCircleRect(newX, y, radius, wall.x, wall.y, wall.width, wall.height)
              : checkAABB(newX - width/2, y - height/2, width, height, wall.x, wall.y, wall.width, wall.height);
          
          if (isHit) {
              collisionX = true;
              newX = x; 
              break;
          }
      }
      
      if (!collisionX && !ignorePuddles) {
          for (const puddle of puddles) {
              const isHit = isCircle
                  ? checkCircleRect(newX, y, radius, puddle.x - puddle.width/2, puddle.y - puddle.height/2, puddle.width, puddle.height)
                  : checkAABB(newX - width/2, y - height/2, width, height, puddle.x - puddle.width/2, puddle.y - puddle.height/2, puddle.width, puddle.height);
              if (isHit) {
                  collisionX = true;
                  newX = x;
                  break;
              }
          }
      }
  }
  if (collisionX) hit = true;

  // STEP 2: MOVE Y
  const nextY = y + vy;
  let collisionY = false;

  if (isCircle) {
      if (nextY < radius + margin) { newY = radius + margin; collisionY = true; }
      else if (nextY > GAME_HEIGHT - radius - margin) { newY = GAME_HEIGHT - margin - height/2; collisionY = true; }
      else newY = nextY;
  } else {
      if (nextY - height/2 < margin) { newY = height/2 + margin; collisionY = true; }
      else if (nextY + height/2 > GAME_HEIGHT - margin) { newY = GAME_HEIGHT - margin - height/2; collisionY = true; }
      else newY = nextY;
  }

  if (!collisionY && !isGhost) {
      for (const wall of walls) {
          const isHit = isCircle 
              ? checkCircleRect(newX, nextY, radius, wall.x, wall.y, wall.width, wall.height)
              : checkAABB(newX - width/2, nextY - height/2, width, height, wall.x, wall.y, wall.width, wall.height);
          
          if (isHit) {
              collisionY = true;
              newY = y; 
              break;
          }
      }
      
      if (!collisionY && !ignorePuddles) {
          for (const puddle of puddles) {
              const isHit = isCircle
                  ? checkCircleRect(newX, nextY, radius, puddle.x - puddle.width/2, puddle.y - puddle.height/2, puddle.width, puddle.height)
                  : checkAABB(newX - width/2, nextY - height/2, width, height, puddle.x - puddle.width/2, puddle.y - puddle.height/2, puddle.width, puddle.height);
              if (isHit) {
                  collisionY = true;
                  newY = y;
                  break;
              }
          }
      }
  }
  if (collisionY) hit = true;

  return { x: newX, y: newY, hitWall: hit };
};

// --- INITIALIZATION ---

export const createInitialState = (config: GameConfig): GameState => {
  const walls: Wall[] = [];
  const enemies: Enemy[] = [];
  
  const playerStart = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, radius: PLAYER_RADIUS };
  const uiSafeZone = { x: GAME_WIDTH - 500, y: GAME_HEIGHT - 300, w: 450, h: 250 }; // Zone UI en bas à droite (mise à jour)

  // 1. Generate Walls
  for (let i = 0; i < config.wallCount; i++) {
      let safe = false;
      let attempts = 0;
      while (!safe && attempts < 200) {
          attempts++;
          const w = Math.random() > 0.5 ? 250 : 40;
          const h = w === 250 ? 40 : 250;
          const x = Math.random() * (GAME_WIDTH - w - 100) + 50;
          const y = Math.random() * (GAME_HEIGHT - h - 100) + 50;

          if (checkAABB(x - 20, y - 20, w + 40, h + 40, playerStart.x - 60, playerStart.y - 60, 120, 120)) continue; 
          if (checkAABB(x, y, w, h, uiSafeZone.x, uiSafeZone.y, uiSafeZone.w, uiSafeZone.h)) continue;

          const SPACING_BUFFER = 150; 
          const overlap = walls.some(wall => checkAABB(
              x - SPACING_BUFFER, y - SPACING_BUFFER, w + SPACING_BUFFER * 2, h + SPACING_BUFFER * 2, 
              wall.x, wall.y, wall.width, wall.height
          ));
          
          if (!overlap) {
              walls.push({ id: `w${i}`, x, y, width: w, height: h, isTagged: false, tagProgress: 0 });
              safe = true;
          }
      }
  }

  // 2. Generate Enemies
  const spawnEnemy = (type: EntityType.BARRIER | EntityType.DOG | EntityType.OLD_MAN, count: number) => {
      for (let i = 0; i < count; i++) {
          const size = type === EntityType.DOG ? 50 : 60;
          let safe = false;
          let attempts = 0;
          const distConstraint = type === EntityType.DOG ? 500 : 300;

          while (!safe && attempts < 500) {
              attempts++;
              const x = Math.random() * (GAME_WIDTH - 300) + 150;
              const y = Math.random() * (GAME_HEIGHT - 300) + 150;
               
              const dx = x - playerStart.x;
              const dy = y - playerStart.y;
              if (Math.sqrt(dx*dx + dy*dy) < distConstraint) continue;
                   
               const hitWall = walls.some(wall => checkAABB(
                   x - size/2 - 40, y - size/2 - 40, size + 80, size + 80, 
                   wall.x, wall.y, wall.width, wall.height
               ));
               if (hitWall) continue;

               const hitOtherEnemy = enemies.some(other => {
                   const edx = x - other.x;
                   const edy = y - other.y;
                   return Math.sqrt(edx*edx + edy*edy) < 100;
               });
               if (hitOtherEnemy) continue;

               let initVx = 0, initVy = 0;
               if (type === EntityType.OLD_MAN) {
                   const ang = Math.random() * Math.PI * 2;
                   initVx = Math.cos(ang) * OLD_MAN_SPEED;
                   initVy = Math.sin(ang) * OLD_MAN_SPEED;
               }

               enemies.push({
                   id: `${type}_${i}`,
                   type,
                   x, y, width: size, height: size,
                   angle: 0,
                   velocity: { x: initVx, y: initVy },
                   state: 'chasing',
                   cooldown: 0,
                   sprintTimer: 0,
                   isManual: false,
                   randomSpeedFactor: 1,
                   randomSpeedTimer: 0,
                   isBoosting: false,
                   lastMoveDir: { x: 1, y: 0 }, // Default valid direction
                   boostCooldownTimer: 0,
                   boostActiveTimer: 0
               });
               safe = true;
          }
      }
  };

  spawnEnemy(EntityType.DOG, config.dogCount);
  spawnEnemy(EntityType.OLD_MAN, config.oldManCount);

  return {
    status: 'MENU',
    config,
    timeLeft: config.gameDuration,
    player: {
      x: playerStart.x,
      y: playerStart.y,
      radius: PLAYER_RADIUS,
      velocity: { x: 0, y: 0 },
      isBoosting: false,
      isGhosting: false,
      canTeleport: true,
      tagsCompleted: 0,
      stunTimer: 0,
      boostTimeLeft: config.boostDuration,
      ghostTimeLeft: config.ghostDuration,
      dogHits: 0,
      lastHitTime: 0,
      lastMoveDir: { x: 0, y: 0 } // Init direction
    },
    walls,
    enemies,
    particles: [],
    screenShake: 0,
    audioEvents: [],
    slowZoneTimeLeft: config.slowZoneDuration,
    isSlowZoneActive: false,
    lastMidiDebug: "Waiting...",
    wrongAnswers: 0,
    dogGrowTimeLeft: config.dogGrowDuration,
    puddles: [],
    lastPeeWallId: null,
    peeCount: 0,
    usedRiddleIndices: []
  };
};

// --- MAIN LOOP ---

export const updateGameState = (state: GameState, input: InputState): GameState => {
  // Reset audio events for this frame
  const newState = { 
    ...state, 
    player: { ...state.player }, 
    walls: state.walls.map(w => ({ ...w })),
    enemies: state.enemies.map(e => ({ ...e })),
    puddles: state.puddles.map(p => ({ ...p })),
    audioEvents: [] as string[],
    lastMidiDebug: input.debugMidi || state.lastMidiDebug
  };

  // Update Particles always (for active NDI even in menu)
  newState.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
  newState.particles = newState.particles.filter(p => p.life > 0);

  // Background ambient particles generation in menu
  if (state.status === 'MENU' && Math.random() < 0.05) {
      newState.particles.push({
          x: Math.random() * GAME_WIDTH,
          y: Math.random() * GAME_HEIGHT,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          life: 60,
          color: '#FFF'
      });
  }

  // --- AI SIMULATION FOR NON-MANUAL CHARACTERS ---
  const simulatedInput: InputState = JSON.parse(JSON.stringify(input)); // Deep copy to avoid modifying original input

  if (simulatedInput.actionCancel) {
      return { ...state, status: 'MENU' };
  }

  if (state.status !== 'PLAYING') return newState;

  newState.enemies.forEach(enemy => {
      if (!enemy.isManual) {
          if (enemy.type === EntityType.DOG) {
              // Grow logic
              if (enemy.aiGrowCooldown && enemy.aiGrowCooldown > 0) enemy.aiGrowCooldown--;
              const distToPlayer = Math.sqrt((enemy.x - state.player.x)**2 + (enemy.y - state.player.y)**2);
              if (distToPlayer < 200 && (!enemy.aiGrowCooldown || enemy.aiGrowCooldown <= 0) && state.dogGrowTimeLeft > 0) {
                  if (Math.random() < AI_GROW_PROBABILITY) {
                      simulatedInput.enemies.dog.growTrigger = true;
                  }
              }
              // If already growing, keep it for a few seconds
              if (enemy.isGrowing && Math.random() > 0.01) {
                  simulatedInput.enemies.dog.growTrigger = true;
              } else if (enemy.isGrowing) {
                  enemy.aiGrowCooldown = AI_GROW_COOLDOWN;
              }

              // Dog Boost logic (AI)
              if (enemy.boostCooldownTimer && enemy.boostCooldownTimer > 0) enemy.boostCooldownTimer--;
              if (!enemy.isBoosting && (!enemy.boostCooldownTimer || enemy.boostCooldownTimer <= 0)) {
                  const distToPlayer = Math.sqrt((enemy.x - state.player.x)**2 + (enemy.y - state.player.y)**2);
                  if (distToPlayer < 300 && Math.random() < 0.01) {
                      simulatedInput.enemies.dog.boost = true;
                      // Set direction towards player for the boost
                      const dx = state.player.x - enemy.x;
                      const dy = state.player.y - enemy.y;
                      const dist = Math.sqrt(dx*dx + dy*dy);
                      if (dist > 0) {
                          enemy.lastMoveDir = { x: dx/dist, y: dy/dist };
                      }
                  }
              }

              // Pipi logic
              if (enemy.aiPipiCooldown && enemy.aiPipiCooldown > 0) enemy.aiPipiCooldown--;
              if (newState.puddles.length === 0 && newState.peeCount < 10 && (!enemy.aiPipiCooldown || enemy.aiPipiCooldown <= 0)) {
                  let nearWall = false;
                  for (const wall of newState.walls) {
                      if (wall.id === state.lastPeeWallId) continue;
                      const dx = Math.max(wall.x - enemy.x, 0, enemy.x - (wall.x + wall.width));
                      const dy = Math.max(wall.y - enemy.y, 0, enemy.y - (wall.y + wall.height));
                      if (Math.sqrt(dx*dx + dy*dy) < 80) { nearWall = true; break; }
                  }
                  if (nearWall && Math.random() < AI_PIPI_PROBABILITY) {
                      simulatedInput.enemies.dog.pipiTrigger = true;
                      enemy.aiPipiCooldown = AI_PIPI_COOLDOWN;
                  }
              }
          } else if (enemy.type === EntityType.OLD_MAN) {
              // Slow Zone logic
              if (enemy.aiSlowZoneCooldown && enemy.aiSlowZoneCooldown > 0) enemy.aiSlowZoneCooldown--;
              const distToPlayer = Math.sqrt((enemy.x - state.player.x)**2 + (enemy.y - state.player.y)**2);
              if (distToPlayer < SLOW_ZONE_RADIUS && (!enemy.aiSlowZoneCooldown || enemy.aiSlowZoneCooldown <= 0) && state.slowZoneTimeLeft > 0) {
                  if (Math.random() < AI_SLOW_ZONE_PROBABILITY) {
                      simulatedInput.enemies.oldMan.slowZoneTrigger = true;
                  }
              }
              // If already active, keep it
              if (state.isSlowZoneActive && Math.random() > 0.02) {
                  simulatedInput.enemies.oldMan.slowZoneTrigger = true;
              } else if (state.isSlowZoneActive) {
                  enemy.aiSlowZoneCooldown = AI_SLOW_ZONE_COOLDOWN;
              }

              // Dispersion logic
              if (enemy.aiDispersionCooldown && enemy.aiDispersionCooldown > 0) enemy.aiDispersionCooldown--;
              if (!enemy.aiDispersionCooldown || enemy.aiDispersionCooldown <= 0) {
                  const otherOldMen = newState.enemies.filter(e => e.type === EntityType.OLD_MAN && e.id !== enemy.id);
                  const isClumped = otherOldMen.some(other => Math.sqrt((enemy.x - other.x)**2 + (enemy.y - other.y)**2) < 100);
                  if (isClumped && Math.random() < AI_DISPERSION_PROBABILITY) {
                      simulatedInput.enemies.oldMan.dispersionTrigger = true;
                      enemy.aiDispersionCooldown = AI_DISPERSION_COOLDOWN;
                  }
              }
              // If already dispersing, keep it for a bit
              if (enemy.dispersionTarget && Math.random() > 0.05) {
                  simulatedInput.enemies.oldMan.dispersionTrigger = true;
              }

              // Cleaning logic
              if (enemy.aiCleanCooldown && enemy.aiCleanCooldown > 0) enemy.aiCleanCooldown--;
              if (!enemy.aiCleanCooldown || enemy.aiCleanCooldown <= 0) {
                  let nearTaggedWall = false;
                  for (const wall of newState.walls) {
                      if (!wall.isTagged && wall.tagProgress > 0) {
                          const dx = enemy.x - (wall.x + wall.width/2);
                          const dy = enemy.y - (wall.y + wall.height/2);
                          if (Math.sqrt(dx*dx + dy*dy) < 100) { nearTaggedWall = true; break; }
                      }
                  }
                  if (nearTaggedWall && Math.random() < AI_CLEAN_PROBABILITY) {
                      simulatedInput.enemies.oldMan.actionCleanTrigger = true;
                      enemy.aiCleanCooldown = AI_CLEAN_COOLDOWN;
                  }
              }
          }
      }
  });

  // 0. SLOW ZONE LOGIC
  if (simulatedInput.enemies.oldMan.slowZoneTrigger && state.slowZoneTimeLeft > 0) {
      newState.isSlowZoneActive = true;
      if (!state.isSlowZoneActive) {
          newState.audioEvents.push('SLOW_ZONE_ENTER');
      }
  } else {
      newState.isSlowZoneActive = false;
  }

  if (newState.isSlowZoneActive) {
      newState.slowZoneTimeLeft = Math.max(0, newState.slowZoneTimeLeft - 1/60);
      if (newState.slowZoneTimeLeft <= 0) {
          newState.isSlowZoneActive = false;
      }
  }

  // 0.1 DOG GROW LOGIC
  let isDogGrowing = simulatedInput.enemies.dog.growTrigger && state.dogGrowTimeLeft > 0;
  if (isDogGrowing) {
      newState.dogGrowTimeLeft = Math.max(0, newState.dogGrowTimeLeft - 1/60);
  }

  // 0.2 PUDDLE LOGIC
  newState.puddles = state.puddles.map(p => ({ ...p, timeLeft: p.timeLeft - 1/60 })).filter(p => p.timeLeft > 0);

  // 0.3 DOG PIPI LOGIC
  if (simulatedInput.enemies.dog.pipiTrigger && newState.puddles.length === 0 && newState.peeCount < 10) {
      const dog = newState.enemies.find(e => e.type === EntityType.DOG);
      if (dog) {
          let closestWall: Wall | null = null;
          let minDist = 80; 
          for (const wall of newState.walls) {
              if (wall.id === newState.lastPeeWallId) continue; // Cannot pee on same wall twice in a row

              const dx = Math.max(wall.x - dog.x, 0, dog.x - (wall.x + wall.width));
              const dy = Math.max(wall.y - dog.y, 0, dog.y - (wall.y + wall.height));
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < minDist) {
                  minDist = dist;
                  closestWall = wall;
              }
          }

          if (closestWall) {
              newState.audioEvents.push('DOG_PIPI');
              newState.lastPeeWallId = closestWall.id;
              newState.peeCount++;
              newState.puddles.push({
                  id: `puddle_${Date.now()}`,
                  x: dog.x,
                  y: dog.y,
                  width: 100,
                  height: 100,
                  timeLeft: 10,
                  wallId: closestWall.id
              });
          }
      }
  }

  // 1. PLAYER LOGIC
  let isBoosting = simulatedInput.actionSecondary && newState.player.boostTimeLeft > 0;
  if (isBoosting) newState.player.boostTimeLeft = Math.max(0, newState.player.boostTimeLeft - 1/60);
  newState.player.isBoosting = isBoosting;

  const wasGhosting = newState.player.isGhosting;
  let isGhosting = simulatedInput.actionGhost && newState.player.ghostTimeLeft > 0;
  if (isGhosting) newState.player.ghostTimeLeft = Math.max(0, newState.player.ghostTimeLeft - 1/60);
  newState.player.isGhosting = isGhosting;

  // Apply Slowdown if in zone
  let slowdownFactor = 1.0;
  if (newState.isSlowZoneActive) {
      const isInSlowZone = newState.enemies.some(e => {
          if (e.type === EntityType.OLD_MAN) {
              const dx = newState.player.x - e.x;
              const dy = newState.player.y - e.y;
              return Math.sqrt(dx*dx + dy*dy) < SLOW_ZONE_RADIUS;
          }
          return false;
      });

      if (isInSlowZone) {
          slowdownFactor = 0.4;
      }
  }

  // GHOST POP-OUT LOGIC
  // If ghost mode ends while inside a wall, push player out to the nearest edge
  if (wasGhosting && !isGhosting) {
      const pX = newState.player.x;
      const pY = newState.player.y;
      const pR = newState.player.radius;
      
      for (const wall of newState.walls) {
          if (checkCircleRect(pX, pY, pR, wall.x, wall.y, wall.width, wall.height)) {
              // We are inside this wall. Find closest edge.
              // Distances to edges:
              const distLeft = Math.abs(pX - wall.x);
              const distRight = Math.abs(pX - (wall.x + wall.width));
              const distTop = Math.abs(pY - wall.y);
              const distBottom = Math.abs(pY - (wall.y + wall.height));
              
              const minDist = Math.min(distLeft, distRight, distTop, distBottom);
              
              // Apply push-out with a small margin
              const POP_MARGIN = pR + 5; 
              
              if (minDist === distLeft) newState.player.x = wall.x - POP_MARGIN;
              else if (minDist === distRight) newState.player.x = wall.x + wall.width + POP_MARGIN;
              else if (minDist === distTop) newState.player.y = wall.y - POP_MARGIN;
              else if (minDist === distBottom) newState.player.y = wall.y + wall.height + POP_MARGIN;
              
              // Ensure we are within boundaries after push
              newState.player.x = Math.max(pR, Math.min(GAME_WIDTH - pR, newState.player.x));
              newState.player.y = Math.max(pR, Math.min(GAME_HEIGHT - pR, newState.player.y));

              // Stop velocity to prevent re-entering immediately
              newState.player.velocity = { x: 0, y: 0 };
              break; // Handle one wall collision at a time (simplification)
          }
      }
  }

  // PUDDLE PUSH-OUT LOGIC: If a puddle is under Tchipeur or Old Men, push them out.
  const entitiesToPush = [newState.player, ...newState.enemies.filter(e => e.type === EntityType.OLD_MAN)];
  for (const entity of entitiesToPush) {
      for (const puddle of newState.puddles) {
          const radius = 'radius' in entity ? entity.radius : (entity.width / 2);
          const px = puddle.x - puddle.width / 2;
          const py = puddle.y - puddle.height / 2;

          if (entity.x + radius > px &&
              entity.x - radius < px + puddle.width &&
              entity.y + radius > py &&
              entity.y - radius < py + puddle.height) {
              
              // Push to nearest edge
              const dLeft = Math.abs(entity.x - px);
              const dRight = Math.abs(entity.x - (px + puddle.width));
              const dTop = Math.abs(entity.y - py);
              const dBottom = Math.abs(entity.y - (py + puddle.height));
              const min = Math.min(dLeft, dRight, dTop, dBottom);
              
              if (min === dLeft) entity.x = px - radius - 2;
              else if (min === dRight) entity.x = px + puddle.width + radius + 2;
              else if (min === dTop) entity.y = py - radius - 2;
              else if (min === dBottom) entity.y = py + puddle.height + radius + 2;

              // CRITICAL: After pushing out of puddle, resolve any wall collisions immediately
              resolveOverlap(entity, newState.walls, 'radius' in entity);
          }
      }
  }

  if (newState.player.stunTimer > 0) newState.player.stunTimer--;

  // Direction logic with Boost "Cruise Control"
  let dirX = simulatedInput.axisX;
  let dirY = simulatedInput.axisY;
  const inputLen = Math.sqrt(dirX*dirX + dirY*dirY);
  
  if (inputLen > 0.1) {
      // Normalisation pour stockage de la direction pure
      newState.player.lastMoveDir = { x: dirX/inputLen, y: dirY/inputLen };
  } else if (isBoosting) {
      // Si on booste sans input, on utilise la dernière direction connue
      dirX = newState.player.lastMoveDir.x;
      dirY = newState.player.lastMoveDir.y;
  }

  const speed = (isBoosting ? PLAYER_BOOST_SPEED : PLAYER_SPEED) * slowdownFactor;
  const vx = dirX * speed;
  const vy = dirY * speed;
  newState.player.velocity = { x: vx, y: vy };

  const pMove = moveEntity(
      newState.player.x, newState.player.y, 
      vx, vy, 
      newState.player.radius * 2, newState.player.radius * 2, 
      newState.walls, 
      newState.puddles,
      true,
      isGhosting,
      false
  );
  newState.player.x = pMove.x;
  newState.player.y = pMove.y;

  // 2. TAGGING LOGIC
  if (simulatedInput.actionPrimaryTrigger && newState.player.stunTimer <= 0) {
    let closestWall: Wall | null = null;
    let minDistance = 9999;
    const TAG_REACH = PLAYER_RADIUS + 40;
    const TAG_MARGIN = 30;

    newState.walls.forEach(wall => {
      if (!wall.isTagged) {
        // Check if wall has a puddle
        const hasPuddle = newState.puddles.some(p => p.wallId === wall.id);
        if (hasPuddle) return;

        const isHorizontal = wall.width > wall.height;
        let canTag = false;
        let dist = 9999;
        if (isHorizontal) {
             const withinLength = newState.player.x > wall.x - TAG_MARGIN && newState.player.x < wall.x + wall.width + TAG_MARGIN;
             if (withinLength) {
                 const distToCenterY = Math.abs(newState.player.y - (wall.y + wall.height/2));
                 const distToEdge = distToCenterY - wall.height/2;
                 if (distToEdge < TAG_REACH) { canTag = true; dist = distToEdge; }
             }
        } else {
            const withinLength = newState.player.y > wall.y - TAG_MARGIN && newState.player.y < wall.y + wall.height + TAG_MARGIN;
            if (withinLength) {
                const distToCenterX = Math.abs(newState.player.x - (wall.x + wall.width/2));
                const distToEdge = distToCenterX - wall.width/2;
                if (distToEdge < TAG_REACH) { canTag = true; dist = distToEdge; }
            }
        }
        if (canTag && dist < minDistance) { minDistance = dist; closestWall = wall; }
      }
    });

    if (closestWall) {
       const wall = closestWall as Wall;
       const increment = 100 / state.config.tagSpamRequired;
       wall.tagProgress += increment; 
       newState.audioEvents.push('SPRAY'); // Trigger spray sound
       for(let i=0; i<5; i++) {
           newState.particles.push({
              x: newState.player.x + (Math.random() - 0.5) * 20, 
              y: newState.player.y + (Math.random() - 0.5) * 20,
              vx: (Math.random() - 0.5) * 5, 
              vy: (Math.random() - 0.5) * 5, 
              life: 15, 
              color: '#EEE'
          });
       }
       if (wall.tagProgress >= TAG_TIME_REQUIRED - 0.1) {
          if (!wall.isTagged) {
              wall.isTagged = true;
              wall.completedTime = Date.now();
              newState.player.tagsCompleted++;
              newState.screenShake = 10;
              newState.audioEvents.push('WALL_DONE'); // Son de succès
          }
       }
    }
  }

  // 3. ENEMY LOGIC
  const difficultyMultiplier = state.config.difficulty === 'EASY' ? 0.8 : state.config.difficulty === 'HARD' ? 1.2 : 1.0;
  const baseOldManSpeed = OLD_MAN_SPEED * difficultyMultiplier;
  const baseDogSpeed = DOG_SPEED * difficultyMultiplier;
  const baseDogSprintSpeed = DOG_SPRINT_SPEED * difficultyMultiplier;
  const baseDogBoostSpeed = DOG_BOOST_SPEED * difficultyMultiplier;

  newState.enemies.forEach(enemy => {
      let evx = 0, evy = 0;
      let inputSource = enemy.type === EntityType.DOG ? simulatedInput.enemies.dog : simulatedInput.enemies.oldMan;
      
      // Pour le chien, on utilise désormais le Channel 1 (inputs standards) pour le boost
      if (enemy.type === EntityType.DOG) {
          const dogInput = simulatedInput.enemies.dog;

          // Handle Growing
          if (isDogGrowing) {
              enemy.isGrowing = true;
              enemy.width = GIANT_DOG_SIZE; // Use constant
              enemy.height = GIANT_DOG_SIZE;

              // Push out of walls if growing
              for (let i = 0; i < 3; i++) { // Resolve overlaps
                  let resolved = true;
                  for (const wall of newState.walls) {
                      if (checkAABB(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height, wall.x, wall.y, wall.width, wall.height)) {
                          const overlapLeft = (enemy.x + enemy.width/2) - wall.x;
                          const overlapRight = (wall.x + wall.width) - (enemy.x - enemy.width/2);
                          const overlapTop = (enemy.y + enemy.height/2) - wall.y;
                          const overlapBottom = (wall.y + wall.height) - (enemy.y - enemy.height/2);
                          
                          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                          
                          if (minOverlap === overlapLeft) enemy.x -= (overlapLeft + 1);
                          else if (minOverlap === overlapRight) enemy.x += (overlapRight + 1);
                          else if (minOverlap === overlapTop) enemy.y -= (overlapTop + 1);
                          else if (minOverlap === overlapBottom) enemy.y += (overlapBottom + 1);
                          resolved = false;
                      }
                  }
                  if (resolved) break;
              }

              // Boundary check
              const margin = 20;
              if (enemy.x - enemy.width/2 < margin) enemy.x = enemy.width/2 + margin;
              if (enemy.x + enemy.width/2 > GAME_WIDTH - margin) enemy.x = GAME_WIDTH - margin - enemy.width/2;
              if (enemy.y - enemy.height/2 < margin) enemy.y = enemy.height/2 + margin;
              if (enemy.y + enemy.height/2 > GAME_HEIGHT - margin) enemy.y = GAME_HEIGHT - margin - enemy.height/2;

          } else {
              enemy.isGrowing = false;
              enemy.width = 60; // Default size
              enemy.height = 60;
          }

          const hasInput = Math.abs(dogInput.axisX) > 0.05 || Math.abs(dogInput.axisY) > 0.05;
          
          if (hasInput || dogInput.boost) {
              enemy.isManual = true;
              enemy.manualTimer = 180; // 3 seconds of manual control
          }

          if (enemy.isManual) {
              if (enemy.manualTimer && enemy.manualTimer > 0) {
                  enemy.manualTimer--;
              } else {
                  enemy.isManual = false;
              }
          }

          if (hasInput) {
               const len = Math.sqrt(dogInput.axisX * dogInput.axisX + dogInput.axisY * dogInput.axisY);
               if (len > 0.1) {
                   enemy.lastMoveDir = { x: dogInput.axisX / len, y: dogInput.axisY / len };
               }
          }
          
          // --- LOGIQUE BOOST CHIEN (3s actif, 10s cooldown) ---
          if (enemy.boostCooldownTimer && enemy.boostCooldownTimer > 0) {
              enemy.boostCooldownTimer--;
          }

          if (enemy.boostActiveTimer && enemy.boostActiveTimer > 0) {
              enemy.boostActiveTimer--;
              enemy.isBoosting = true;
          } else {
              enemy.isBoosting = false;
              if (dogInput.boost && (!enemy.boostCooldownTimer || enemy.boostCooldownTimer <= 0)) {
                  enemy.boostActiveTimer = 180; // 3 seconds at 60fps
                  enemy.boostCooldownTimer = 600; // 10 seconds at 60fps
                  enemy.isBoosting = true;
              }
          }
      }
      else if (inputSource && (
          Math.abs(inputSource.axisX) > 0.05 || 
          Math.abs(inputSource.axisY) > 0.05 || 
          (enemy.type === EntityType.OLD_MAN && (input.enemies.oldMan.dispersionTrigger || input.enemies.oldMan.slowZoneTrigger || input.enemies.oldMan.actionCleanTrigger))
      )) {
          enemy.isManual = true;
      }
      

      if (enemy.isManual && inputSource) {
          // --- MODE MANUEL ---
          
          if (enemy.type === EntityType.DOG && enemy.isBoosting) {
              // --- MODE BOOST CHIEN (CHANNEL 1 BOUTON NOIR) ---
              // Vitesse fixe de boost, direction basée sur lastMoveDir
              const boostSpeed = baseDogBoostSpeed; 
              const dir = enemy.lastMoveDir || {x: 1, y: 0};
              evx = dir.x * boostSpeed;
              evy = dir.y * boostSpeed;
              enemy.velocity = {x: evx, y: evy};
          } 
          else {
              // --- MODE MANUEL CLASSIQUE ---
              let mSpeed = (enemy.type === EntityType.DOG ? baseDogSpeed : baseOldManSpeed) * 1.5;
              

              evx = inputSource.axisX * mSpeed;
              evy = inputSource.axisY * mSpeed;

              // --- LOGIQUE DISPERSION VIEUX ---
              if (enemy.type === EntityType.OLD_MAN && simulatedInput.enemies.oldMan.dispersionTrigger) {
                  const oldMen = newState.enemies.filter(e => e.type === EntityType.OLD_MAN);
                  
                  // If no target, pick a random target
                  if (!enemy.dispersionTarget) {
                      enemy.dispersionTarget = {
                          x: 100 + Math.random() * (GAME_WIDTH - 200),
                          y: 100 + Math.random() * (GAME_HEIGHT - 200)
                      };
                  }
                  
                  const target = enemy.dispersionTarget;
                  const tdx = target.x - enemy.x;
                  const tdy = target.y - enemy.y;
                  const tdist = Math.sqrt(tdx*tdx + tdy*tdy);
                  
                  if (tdist > 30) {
                      evx = (tdx / tdist) * mSpeed;
                      evy = (tdy / tdist) * mSpeed;
                  } else {
                      // Target reached, pick a new one to keep moving randomly if button held
                      enemy.dispersionTarget = {
                          x: 100 + Math.random() * (GAME_WIDTH - 200),
                          y: 100 + Math.random() * (GAME_HEIGHT - 200)
                      };
                  }

                  // Strong separation during dispersion
                  oldMen.forEach(other => {
                      if (other.id !== enemy.id) {
                          const odx = enemy.x - other.x;
                          const ody = enemy.y - other.y;
                          const odist = Math.sqrt(odx*odx + ody*ody);
                          if (odist < 300 && odist > 0) {
                              evx += (odx / odist) * 1.5;
                              evy += (ody / odist) * 1.5;
                          }
                      }
                  });

                  // Normalize to mSpeed to ensure they don't move faster than normal
                  const finalDist = Math.sqrt(evx*evx + evy*evy);
                  if (finalDist > 0) {
                      evx = (evx / finalDist) * mSpeed;
                      evy = (evy / finalDist) * mSpeed;
                  }
              } else if (enemy.type === EntityType.OLD_MAN) {
                  // Reset target when not dispersing
                  enemy.dispersionTarget = undefined;
              }

              enemy.velocity = {x: evx, y: evy};
          }
          
          if (enemy.state !== 'chasing' && enemy.state !== 'idle') {
              enemy.state = 'chasing';
          }
      } 
      else {
          // --- MODE AUTOMATIQUE (IA) ---
          if (enemy.type === EntityType.OLD_MAN) {
               // --- OLD MAN AI: TARGET PARTIALLY TAGGED WALLS ---
               let targetWall: Wall | null = null;
               let minWallDist = Infinity;

               // Find closest partially tagged wall
               for (const wall of newState.walls) {
                   if (!wall.isTagged && wall.tagProgress > 0) {
                       const wcx = wall.x + wall.width / 2;
                       const wcy = wall.y + wall.height / 2;
                       const d = Math.sqrt((enemy.x - wcx)**2 + (enemy.y - wcy)**2);
                       if (d < minWallDist) {
                           minWallDist = d;
                           targetWall = wall;
                       }
                   }
               }

               let dirX = 0, dirY = 0;
               if (targetWall) {
                   // Move towards wall
                   const wcx = targetWall.x + targetWall.width / 2;
                   const wcy = targetWall.y + targetWall.height / 2;
                   const dx = wcx - enemy.x;
                   const dy = wcy - enemy.y;
                   const dist = Math.sqrt(dx*dx + dy*dy);
                   if (dist > 0) { dirX = dx / dist; dirY = dy / dist; }
                   
                   // If close enough, trigger cleaning (simulated input)
                   if (dist < 120) {
                       simulatedInput.enemies.oldMan.actionCleanTrigger = true;
                   }
               } else {
                   // Default behavior: follow player
                   const dx = newState.player.x - enemy.x;
                   const dy = newState.player.y - enemy.y;
                   const dist = Math.sqrt(dx*dx + dy*dy);
                   if (dist > 0) { dirX = dx / dist; dirY = dy / dist; }
               }

               const jitter = 0.8;
               evx = enemy.velocity.x + (Math.random() - 0.5) * jitter;
               evy = enemy.velocity.y + (Math.random() - 0.5) * jitter;

               const attraction = 0.15;
               evx += dirX * attraction;
               evy += dirY * attraction;

               // --- RELATIVE MOVEMENT (FLOCKING/OFFSET) ---
               // If multiple old men, they try to maintain some separation and different angles
               const oldMen = newState.enemies.filter(e => e.type === EntityType.OLD_MAN);
               if (oldMen.length > 1) {
                   const myIndex = oldMen.findIndex(e => e.id === enemy.id);
                   
                   // Separation force
                   oldMen.forEach(other => {
                       if (other.id !== enemy.id) {
                           const odx = enemy.x - other.x;
                           const ody = enemy.y - other.y;
                           const odist = Math.sqrt(odx*odx + ody*ody);
                           if (odist < 100 && odist > 0) {
                               evx += (odx / odist) * 0.5;
                               evy += (ody / odist) * 0.5;
                           }
                       }
                   });

                   // Offset force: try to be at a different angle relative to player
                   const targetAngle = (Math.PI * 2 / oldMen.length) * myIndex;
                   const idealX = newState.player.x + Math.cos(targetAngle) * 100;
                   const idealY = newState.player.y + Math.sin(targetAngle) * 100;
                   
                   evx += (idealX - enemy.x) * 0.02;
                   evy += (idealY - enemy.y) * 0.02;
               }

               if (Math.random() < 0.02) {
                   const angle = Math.random() * Math.PI * 2;
                   evx = Math.cos(angle) * baseOldManSpeed;
                   evy = Math.sin(angle) * baseOldManSpeed;
               }

               const len = Math.sqrt(evx*evx + evy*evy);
               if (len > 0) {
                   evx = (evx / len) * baseOldManSpeed;
                   evy = (evy / len) * baseOldManSpeed;
               } else { evx = baseOldManSpeed; }
               
               enemy.velocity = {x: evx, y: evy};
          }
          else if (enemy.type === EntityType.DOG) {
              // --- PERMANENT DOG CHASE AI ---
              // Force chasing state if not barking or if we want it to move anyway
              if (enemy.state !== 'barking') {
                  enemy.state = 'chasing';
              }

              const dx = newState.player.x - enemy.x;
              const dy = newState.player.y - enemy.y;
              const distSq = dx*dx + dy*dy;
              const dist = Math.sqrt(distSq) || 1;
              
              // Speed depends on state: slower when barking but NEVER zero
              let speed = baseDogSpeed * 1.5;
              
              // --- SPRINT LOGIC ---
              if (enemy.sprintTimer === undefined) enemy.sprintTimer = 0;
              if (enemy.cooldown === undefined) enemy.cooldown = 0;

              // If not sprinting and cooldown is over, chance to sprint if player is "visible" (close enough)
              if (enemy.sprintTimer <= 0 && enemy.cooldown <= 0 && dist < 600) {
                  if (Math.random() < 0.01) { // ~0.6% chance per frame
                      enemy.sprintTimer = 90; // 1.5 seconds of sprint
                      newState.audioEvents.push('BARK'); // Small bark when starting to run
                  }
              }

              if (enemy.sprintTimer > 0) {
                  speed = baseDogSprintSpeed * 1.2; // Extra boost during sprint
                  enemy.sprintTimer--;
                  if (enemy.sprintTimer <= 0) {
                      enemy.cooldown = 180; // 3 seconds cooldown after sprint
                  }
              } else if (enemy.cooldown > 0) {
                  enemy.cooldown--;
              }

              if (enemy.state === 'barking') speed *= 0.5;
              
              // Stuck detection
              if (enemy.stuckFrames === undefined) enemy.stuckFrames = 0;
              if (enemy.lastX === undefined) { enemy.lastX = enemy.x; enemy.lastY = enemy.y; }
              
              const dMovedSq = (enemy.x - (enemy.lastX || 0))**2 + (enemy.y - (enemy.lastY || 0))**2;
              if (dMovedSq < 0.01) { // Very small threshold
                  enemy.stuckFrames++;
              } else {
                  enemy.stuckFrames = 0;
                  enemy.lastX = enemy.x;
                  enemy.lastY = enemy.y;
              }

              let vx = (dx / dist) * speed;
              let vy = (dy / dist) * speed;

              // If stuck for more than 3 frames, start sliding aggressively
              if (enemy.stuckFrames > 3) {
                  const side = (Math.floor(Date.now() / 500) % 2 === 0) ? 1 : -1;
                  vx += (-dy / dist) * speed * 2.5 * side;
                  vy += (dx / dist) * speed * 2.5 * side;
              } else {
                  // Constant wobble to ensure it's always "in motion" and slides better
                  const time = Date.now() * 0.008;
                  const wobble = Math.sin(time) * 0.6;
                  vx += (-dy / dist) * speed * wobble;
                  vy += (dx / dist) * speed * wobble;
              }

              // Final check: ensure there is ALWAYS a minimum movement
              const finalVel = Math.sqrt(vx*vx + vy*vy);
              if (finalVel < 0.5) {
                  vx = (Math.random() - 0.5) * 2;
                  vy = (Math.random() - 0.5) * 2;
              }

              enemy.velocity = {x: vx, y: vy};
              evx = vx;
              evy = vy;
          }
      }
      // --- LOGIQUE NETTOYAGE VIEUX (COMMUN MANUEL/IA) ---
      if (enemy.type === EntityType.OLD_MAN && simulatedInput.enemies.oldMan.actionCleanTrigger) {
          // Si il ne reste plus qu'un mur à taguer, le vieux ne plus nettoyer
          const wallsRemaining = newState.walls.filter(w => !w.isTagged).length;
          
          if (wallsRemaining > 1) {
              let targetWall: Wall | null = null;
              let minDist = 100;
              for (const wall of newState.walls) {
                  if (!wall.isTagged && wall.tagProgress > 0) {
                      const dx = enemy.x - (wall.x + wall.width/2);
                      const dy = enemy.y - (wall.y + wall.height/2);
                      const dist = Math.sqrt(dx*dx + dy*dy);
                      if (dist < minDist) {
                          minDist = dist;
                          targetWall = wall;
                      }
                  }
              }
              if (targetWall) {
                  const decrement = 100 / state.config.tagSpamRequired;
                  targetWall.tagProgress = Math.max(0, targetWall.tagProgress - decrement);
                  newState.audioEvents.push('SPRAY'); 
              }
          }
      }

      if (enemy.type === EntityType.OLD_MAN && !enemy.isManual) {
          if (enemy.x < 50 || enemy.x > GAME_WIDTH - 50) enemy.velocity.x *= -1;
          if (enemy.y < 50 || enemy.y > GAME_HEIGHT - 50) enemy.velocity.y *= -1;
          evx = enemy.velocity.x;
          evy = enemy.velocity.y;
      }

      // SEPARATION LOGIC
      newState.enemies.forEach(other => {
          if (enemy.id !== other.id) {
             const dx = enemy.x - other.x;
             const dy = enemy.y - other.y;
             const combinedRadius = (enemy.width + other.width) / 2; 
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist < combinedRadius && dist > 0.001) {
                 const overlap = combinedRadius - dist;
                 evx += (dx / dist) * overlap * 0.15; 
                 evy += (dy / dist) * overlap * 0.15;
             }
          }
      });

      // --- OLD MAN STUCK DETECTION (SENSITIVE) ---
      if (enemy.type === EntityType.OLD_MAN && !enemy.isManual) {
          if (enemy.stuckFrames === undefined) enemy.stuckFrames = 0;
          if (enemy.lastX === undefined) { enemy.lastX = enemy.x; enemy.lastY = enemy.y; }
          
          const dMovedSq = (enemy.x - (enemy.lastX || 0))**2 + (enemy.y - (enemy.lastY || 0))**2;
          if (dMovedSq < 0.01) {
              enemy.stuckFrames++;
          } else {
              enemy.stuckFrames = 0;
              enemy.lastX = enemy.x;
              enemy.lastY = enemy.y;
          }

          if (enemy.stuckFrames > 10) {
              // Force a random escape direction
              const angle = Math.random() * Math.PI * 2;
              enemy.velocity = {
                  x: Math.cos(angle) * baseOldManSpeed * 2,
                  y: Math.sin(angle) * baseOldManSpeed * 2
              };
              enemy.stuckFrames = -30; // Grace period
          }
      }

      const eMove = moveEntity(
          enemy.x, enemy.y, 
          evx, evy, 
          enemy.width, enemy.height, 
          newState.walls, 
          newState.puddles,
          enemy.type === EntityType.DOG, 
          false, 
          enemy.type === EntityType.DOG
      );
      enemy.x = eMove.x;
      enemy.y = eMove.y;

      // Removed the simple bounce logic as it can cause jittering and sticking

      const pDx = newState.player.x - enemy.x;
      const pDy = newState.player.y - enemy.y;
      // Tchipeur ne peut plus se faire toucher si il est en mode fantôme
      if (!newState.player.isGhosting && Math.sqrt(pDx*pDx + pDy*pDy) < (PLAYER_RADIUS + enemy.width/2)) {
          if (newState.player.stunTimer <= 0) {
              newState.player.stunTimer = 120;
              newState.screenShake = 5;
              if (enemy.type === EntityType.DOG) {
                  newState.player.dogHits = (newState.player.dogHits || 0) + 1;
                  newState.player.lastHitTime = Date.now(); // Record hit time
                  newState.audioEvents.push('HIT_DOG'); 
                  if (newState.player.dogHits >= newState.config.maxDogHits) newState.status = 'GAMEOVER';
              } else {
                  newState.audioEvents.push('HIT_OLDMAN'); 
              }

              if (enemy.state === 'chasing' && !enemy.isManual) {
                  enemy.state = enemy.type === EntityType.DOG ? 'barking' : 'yelling';
                  enemy.cooldown = 120;
                  if (enemy.sprintTimer) enemy.sprintTimer = 0;
              }
          }
      }
      if ((enemy.state === 'barking' || enemy.state === 'yelling') && enemy.cooldown-- <= 0) {
          enemy.state = 'chasing';
      }
  });

  // Final Safety Check: Ensure no entity is stuck in a wall or boundary at the end of the frame
  resolveOverlap(newState.player, newState.walls, true);
  newState.enemies.forEach(enemy => {
      resolveOverlap(enemy, newState.walls, enemy.type === EntityType.DOG);
  });

  if (newState.screenShake > 0) newState.screenShake *= 0.9;
  if (newState.screenShake < 0.5) newState.screenShake = 0;
  if (newState.player.tagsCompleted >= newState.config.wallCount) newState.status = 'VICTORY';
  
  // Timer Logic
  const prevTime = newState.timeLeft;
  newState.timeLeft -= 1/60; 
  if (newState.timeLeft <= 0) {
      newState.timeLeft = 0; // Lock timer at 0
      newState.status = 'GAMEOVER';
  }

  // Check for countdown tick
  if (newState.status === 'PLAYING') {
      const prevInt = Math.ceil(prevTime);
      const newInt = Math.ceil(newState.timeLeft);
      if (newInt <= 10 && newInt < prevInt && newInt > 0) {
          newState.audioEvents.push('COUNTDOWN');
      }
  }

  return newState;
};