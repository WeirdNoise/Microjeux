import React, { useRef, useEffect, useMemo } from 'react';
import { GameState, EntityType, Wall } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, TAG_TIME_REQUIRED } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const noisePattern = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const idata = ctx.createImageData(256, 256);
        const buffer32 = new Uint32Array(idata.data.buffer);
        for (let i = 0; i < buffer32.length; i++) {
            if (Math.random() < 0.1) {
                buffer32[i] = 0xffffffff; 
            }
        }
        ctx.putImageData(idata, 0, 0);
    }
    return canvas;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- 1. BACKGROUND ---
    ctx.fillStyle = "#111111"; 
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const shakeX = (Math.random() - 0.5) * gameState.screenShake;
    const shakeY = (Math.random() - 0.5) * gameState.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // --- RENDER HELPERS ---
    const drawRoughRect = (x: number, y: number, w: number, h: number, filled: boolean = false) => {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        const jitter = () => (Math.random() - 0.5) * 2;
        ctx.moveTo(x + jitter(), y + jitter());
        ctx.lineTo(x + w + jitter(), y + jitter());
        ctx.lineTo(x + w + jitter(), y + h + jitter());
        ctx.lineTo(x + jitter(), y + h + jitter());
        ctx.closePath();
        ctx.stroke();
        if (filled) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; 
            ctx.fill();
        }
        ctx.restore();
    };

    const drawWallScribbles = (wall: Wall) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(wall.x, wall.y, wall.width, wall.height);
        ctx.clip();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        const seed = wall.x * 1000 + wall.y;
        const pseudoRandom = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };
        ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const startX = wall.x + pseudoRandom(i * 1) * wall.width;
            const startY = wall.y + pseudoRandom(i * 2) * wall.height;
            const endX = wall.x + pseudoRandom(i * 3) * wall.width;
            const endY = wall.y + pseudoRandom(i * 4) * wall.height;
            const ctrlX = wall.x + pseudoRandom(i * 5) * wall.width;
            const ctrlY = wall.y + pseudoRandom(i * 6) * wall.height;
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        }
        ctx.stroke();
        ctx.restore();
    };

    const drawHatchedTriangle = (x: number, y: number, w: number, h: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(-w/2, h/2);
        ctx.closePath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.clip();
        ctx.lineWidth = 2;
        const size = Math.max(w, h);
        for(let i = -size; i < size * 2; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, -size);
            ctx.lineTo(i - size, size * 2);
            ctx.stroke();
        }
        ctx.restore();
    };

    const drawPlayerHatched = (x: number, y: number, r: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.lineWidth = 2;
        const size = r * 2.5; 
        ctx.beginPath();
        for(let i = -size; i < size * 2; i += 6) {
            ctx.moveTo(i, -size);
            ctx.lineTo(i - size, size * 2);
        }
        ctx.stroke();
        ctx.restore();
        ctx.restore();
    };

    const drawOldManSketch = (x: number, y: number, w: number, h: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        const jit = () => (Math.random() - 0.5) * 4;
        ctx.beginPath();
        // Draw 3 rough rectangles for a chaotic look
        for(let i=0; i<3; i++) {
            ctx.rect(-w/2 + jit(), -h/2 + jit(), w, h);
        }
        ctx.stroke();
        
        // Add some vertical scratchy lines
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i = -w/2; i < w/2; i+=5) {
            if (Math.random() > 0.3) {
                ctx.moveTo(i + jit(), -h/2 + jit());
                ctx.lineTo(i + jit(), h/2 + jit());
            }
        }
        ctx.stroke();
        ctx.restore();
    };

    // --- 2. GAME RENDERING ---
    // Walls
    gameState.walls.forEach(wall => {
        if (wall.isTagged) {
            drawRoughRect(wall.x, wall.y, wall.width, wall.height, false); 
            drawWallScribbles(wall); 
        } else {
            drawRoughRect(wall.x, wall.y, wall.width, wall.height, true);
            if (wall.tagProgress > 0) {
                ctx.save();
                ctx.fillStyle = "white";
                const h = (wall.tagProgress / TAG_TIME_REQUIRED) * wall.height;
                ctx.fillRect(wall.x, wall.y + wall.height - h, wall.width, h);
                ctx.restore();
            }
        }
    });

    // Enemies
    gameState.enemies.forEach(enemy => {
        if (enemy.type === EntityType.DOG) {
            drawHatchedTriangle(enemy.x, enemy.y, enemy.width, enemy.height, enemy.angle);
        } else {
            drawOldManSketch(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // Player
    const isStunned = gameState.player.stunTimer > 0;
    if (!isStunned || Math.floor(Date.now() / 50) % 2 === 0) {
        drawPlayerHatched(gameState.player.x, gameState.player.y, gameState.player.radius);
    }

    // Particles
    ctx.fillStyle = "white";
    gameState.particles.forEach(p => {
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    ctx.restore(); // End Shake

    // Overlay Texture
    if (noisePattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay'; 
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = ctx.createPattern(noisePattern, 'repeat') || "transparent";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.restore();
    }

    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);

  }, [gameState, noisePattern]);

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="block max-w-full max-h-full w-auto h-auto object-contain"
        />
    </div>
  );
};

export default GameCanvas;