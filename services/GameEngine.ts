import { 
  GameState, 
  InputState, 
  EntityType, 
  Wall, 
  Enemy,
  GameConfig,
  Player
} from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  PLAYER_SPEED, 
  PLAYER_BOOST_SPEED,
  TAG_TIME_REQUIRED,
  DOG_SPEED,
  DOG_SPRINT_SPEED,
  OLD_MAN_SPEED,
  PLAYER_RADIUS,
  PLAYER_MAX_BOOST_TIME
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

const moveEntity = (
  x: number, 
  y: number, 
  vx: number, 
  vy: number, 
  width: number, 
  height: number, 
  walls: Wall[],
  isCircle: boolean = false
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

  if (!collisionX) {
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

  if (!collisionY) {
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
  }
  if (collisionY) hit = true;

  return { x: newX, y: newY, hitWall: hit };
};

// --- INITIALIZATION ---

export const createInitialState = (config: GameConfig): GameState => {
  const walls: Wall[] = [];
  const enemies: Enemy[] = [];
  
  const playerStart = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, radius: PLAYER_RADIUS };
  const uiSafeZone = { x: GAME_WIDTH - 450, y: GAME_HEIGHT - 200, w: 450, h: 200 };

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
          const size = type === EntityType.DOG ? 60 : 80;
          let safe = false;
          let attempts = 0;
          const distConstraint = type === EntityType.DOG ? 400 : 200;

          while (!safe && attempts < 500) {
              attempts++;
              const x = Math.random() * (GAME_WIDTH - 200) + 100;
              const y = Math.random() * (GAME_HEIGHT - 200) + 50;
               
              const dx = x - playerStart.x;
              const dy = y - playerStart.y;
              if (Math.sqrt(dx*dx + dy*dy) < distConstraint) continue;
                   
               const hitWall = walls.some(wall => checkAABB(
                   x - size/2 - 20, y - size/2 - 20, size + 40, size + 40, 
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
                   sprintTimer: 0
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
      canTeleport: true,
      tagsCompleted: 0,
      stunTimer: 0,
      boostTimeLeft: PLAYER_MAX_BOOST_TIME,
      dogHits: 0
    },
    walls,
    enemies,
    particles: [],
    screenShake: 0,
  };
};

// --- MAIN LOOP ---

export const updateGameState = (state: GameState, input: InputState): GameState => {
  const newState = { ...state, player: { ...state.player } };

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

  if (input.actionCancel) {
      return { ...state, status: 'MENU' };
  }

  if (state.status !== 'PLAYING') return newState;
  
  // 1. PLAYER LOGIC
  let isBoosting = input.actionSecondary && newState.player.boostTimeLeft > 0;
  if (isBoosting) newState.player.boostTimeLeft = Math.max(0, newState.player.boostTimeLeft - 1/60);
  newState.player.isBoosting = isBoosting;
  if (newState.player.stunTimer > 0) newState.player.stunTimer--;

  const speed = isBoosting ? PLAYER_BOOST_SPEED : PLAYER_SPEED;
  const vx = input.axisX * speed;
  const vy = input.axisY * speed;
  newState.player.velocity = { x: vx, y: vy };

  if (input.actionTertiary && newState.player.canTeleport) {
    let safeSpot = false;
    let attempts = 0;
    while(!safeSpot && attempts < 10) {
        attempts++;
        const tx = Math.random() * (GAME_WIDTH - 100) + 50;
        const ty = Math.random() * (GAME_HEIGHT - 100) + 50;
        const hit = newState.walls.some(w => checkCircleRect(tx, ty, newState.player.radius + 10, w.x, w.y, w.width, w.height));
        if (!hit) {
            newState.player.x = tx;
            newState.player.y = ty;
            safeSpot = true;
        }
    }
    newState.player.canTeleport = false;
    for(let i=0; i<20; i++) newState.particles.push({
            x: newState.player.x, y: newState.player.y,
            vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
            life: 20, color: '#FFF'
    });
  }

  const pMove = moveEntity(
      newState.player.x, newState.player.y, 
      vx, vy, 
      newState.player.radius * 2, newState.player.radius * 2, 
      newState.walls, 
      true
  );
  newState.player.x = pMove.x;
  newState.player.y = pMove.y;

  // 2. TAGGING LOGIC
  if (input.actionPrimaryTrigger && newState.player.stunTimer <= 0) {
    let closestWall: Wall | null = null;
    let minDistance = 9999;
    const TAG_REACH = PLAYER_RADIUS + 25;
    const TAG_MARGIN = 10;

    newState.walls.forEach(wall => {
      if (!wall.isTagged) {
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
       wall.tagProgress += 4; 
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
       if (wall.tagProgress >= TAG_TIME_REQUIRED) {
          wall.isTagged = true;
          newState.player.tagsCompleted++;
          newState.screenShake = 10;
       }
    }
  }

  // 3. ENEMY LOGIC
  newState.enemies.forEach(enemy => {
      let evx = 0, evy = 0;
      let inputSource = enemy.type === EntityType.DOG ? input.enemies.dog : input.enemies.oldMan;
      let manualActive = inputSource && (Math.abs(inputSource.axisX) > 0.1 || Math.abs(inputSource.axisY) > 0.1);

      if (manualActive && inputSource) {
          const mSpeed = (enemy.type === EntityType.DOG ? DOG_SPEED : OLD_MAN_SPEED) * 1.5;
          evx = inputSource.axisX * mSpeed;
          evy = inputSource.axisY * mSpeed;
          enemy.velocity = {x: evx, y: evy};
      } 
      else {
          if (enemy.type === EntityType.OLD_MAN) {
               const dx = newState.player.x - enemy.x;
               const dy = newState.player.y - enemy.y;
               const dist = Math.sqrt(dx*dx + dy*dy);
               let dirX = 0, dirY = 0;
               if (dist > 0) { dirX = dx / dist; dirY = dy / dist; }

               const jitter = 0.8;
               evx = enemy.velocity.x + (Math.random() - 0.5) * jitter;
               evy = enemy.velocity.y + (Math.random() - 0.5) * jitter;

               const attraction = 0.15;
               evx += dirX * attraction;
               evy += dirY * attraction;

               if (Math.random() < 0.02) {
                   const angle = Math.random() * Math.PI * 2;
                   evx = Math.cos(angle) * OLD_MAN_SPEED;
                   evy = Math.sin(angle) * OLD_MAN_SPEED;
               }

               const len = Math.sqrt(evx*evx + evy*evy);
               if (len > 0) {
                   evx = (evx / len) * OLD_MAN_SPEED;
                   evy = (evy / len) * OLD_MAN_SPEED;
               } else { evx = OLD_MAN_SPEED; }
               
               enemy.velocity = {x: evx, y: evy};
          }
          else if (enemy.type === EntityType.DOG && enemy.state === 'chasing') {
              const dx = newState.player.x - enemy.x;
              const dy = newState.player.y - enemy.y;
              const distToTarget = Math.sqrt(dx*dx + dy*dy);
              let currentSpeed = DOG_SPEED;
              if (enemy.sprintTimer && enemy.sprintTimer > 0) {
                  enemy.sprintTimer--;
                  currentSpeed = DOG_SPRINT_SPEED;
              } else if (Math.random() < 0.005) enemy.sprintTimer = 120;

              if (distToTarget > 10) {
                  let dX = dx / distToTarget;
                  let dY = dy / distToTarget;
                  newState.walls.forEach(wall => {
                      const wallCx = wall.x + wall.width/2;
                      const wallCy = wall.y + wall.height/2;
                      const distX = Math.abs(enemy.x - wallCx) - (wall.width/2 + enemy.width/2);
                      const distY = Math.abs(enemy.y - wallCy) - (wall.height/2 + enemy.height/2);
                      if (distX < 40 && distY < 40) {
                           const awayX = enemy.x - wallCx;
                           const awayY = enemy.y - wallCy;
                           const len = Math.sqrt(awayX*awayX + awayY*awayY);
                           if (len > 0) { dX += (awayX / len) * 2.5; dY += (awayY / len) * 2.5; }
                      }
                  });
                  const finalLen = Math.sqrt(dX*dX + dY*dY);
                  if (finalLen > 0) {
                      evx = (dX / finalLen) * currentSpeed;
                      evy = (dY / finalLen) * currentSpeed;
                  }
                  enemy.velocity = {x: evx, y: evy};
              }
          }
      }

      if (enemy.type === EntityType.OLD_MAN) {
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

      const eMove = moveEntity(enemy.x, enemy.y, evx, evy, enemy.width, enemy.height, newState.walls, false);
      enemy.x = eMove.x;
      enemy.y = eMove.y;

      if (eMove.hitWall && enemy.type === EntityType.OLD_MAN) {
          enemy.velocity.x *= -1;
          enemy.velocity.y *= -1;
      }

      const pDx = newState.player.x - enemy.x;
      const pDy = newState.player.y - enemy.y;
      if (Math.sqrt(pDx*pDx + pDy*pDy) < (PLAYER_RADIUS + enemy.width/2)) {
          if (newState.player.stunTimer <= 0) {
              newState.player.stunTimer = 120;
              newState.screenShake = 5;
              if (enemy.type === EntityType.DOG) {
                  newState.player.dogHits = (newState.player.dogHits || 0) + 1;
                  if (newState.player.dogHits >= 3) newState.status = 'GAMEOVER';
              }
              if (enemy.state === 'chasing') {
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

  if (newState.screenShake > 0) newState.screenShake *= 0.9;
  if (newState.screenShake < 0.5) newState.screenShake = 0;
  if (newState.player.tagsCompleted >= newState.config.wallCount) newState.status = 'VICTORY';
  newState.timeLeft -= 1/60; 
  if (newState.timeLeft <= 0) newState.status = 'GAMEOVER';

  return newState;
};