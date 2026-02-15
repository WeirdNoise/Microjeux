import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';
import { MusicGenerator } from './services/MusicGenerator';
import { SoundEffects } from './services/SoundEffects';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

const DEFAULT_CONFIG: GameConfig = { 
    wallCount: 5, 
    dogCount: 1, 
    oldManCount: 1,
    gameDuration: 180
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState(DEFAULT_CONFIG));
  
  const inputManager = useRef<InputManager | null>(null);
  const requestRef = useRef<number>(0);
  
  // --- AUDIO GENERATORS ---
  const musicGen = useRef<MusicGenerator>(new MusicGenerator());
  const sfx = useRef<SoundEffects>(new SoundEffects());

  // --- STATE TRACKING ---
  const currentConfig = useRef<GameConfig>(DEFAULT_CONFIG);

  // --- SCALING FOR PREVIEW ---
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / GAME_WIDTH;
      const scaleY = window.innerHeight / GAME_HEIGHT;
      const newScale = Math.min(scaleX, scaleY) * 0.95; 
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 50);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = async (config: GameConfig) => {
    try {
        await musicGen.current.init();
        await sfx.current.resume();
        musicGen.current.play();
    } catch (e) {
        console.warn("Erreur audio:", e);
    }

    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
  };

  // --- GESTION AUDIO ---
  useEffect(() => {
      if (gameState.status === 'PLAYING') {
          musicGen.current.play();
      } else if (gameState.status === 'VICTORY') {
          musicGen.current.stop(); 
          musicGen.current.playVictory();
          sfx.current.setBoostState(false);
      } else if (gameState.status === 'GAMEOVER') {
          musicGen.current.stop(); 
          musicGen.current.playGameOver();
          sfx.current.setBoostState(false);
      } else {
          musicGen.current.stop();
          sfx.current.setBoostState(false);
      }
  }, [gameState.status]);

  useEffect(() => {
      if (gameState.status === 'PLAYING') {
          sfx.current.setBoostState(gameState.player.isBoosting);
      }

      if (gameState.audioEvents && gameState.audioEvents.length > 0) {
          gameState.audioEvents.forEach(event => {
              if (event === 'SPRAY') sfx.current.playSpray();
              if (event === 'HIT_DOG') sfx.current.playDogHit();
              if (event === 'HIT_OLDMAN') sfx.current.playOldManHit();
              if (event === 'WALL_DONE') sfx.current.playSuccess();
              if (event === 'COUNTDOWN') sfx.current.playHeartbeat();
          });
      }
  }, [gameState.audioEvents, gameState.player.isBoosting, gameState.status]);

  // --- NAVIGATION ---
  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      if (gameState.status === 'VICTORY' || gameState.status === 'GAMEOVER') {
        timeoutId = setTimeout(() => {
          setGameState(createInitialState(currentConfig.current)); 
        }, 4000);
      }
      return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [gameState.status]);

  const loop = useCallback(() => {
    if (!inputManager.current) return;

    setGameState(prevState => {
      // On met à jour l'état même en MENU pour les particules
      const input = inputManager.current!.getInput();
      return updateGameState(prevState, input);
    });

    requestRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    inputManager.current = new InputManager();
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (inputManager.current) inputManager.current.cleanup();
      musicGen.current.stop();
    };
  }, [loop]);

  return (
    <div className="w-full h-full bg-[#050505] overflow-hidden relative">
      <div 
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 0 100px rgba(0,0,0,0.8)'
        }}
        className="bg-[#111] overflow-hidden"
      >
        {/* Render GameCanvas always for background/particles/borders */}
        <GameCanvas gameState={gameState} />
        
        {/* Render UI Overlay always (it handles menu visibility internally) */}
        <UIOverlay gameState={gameState} />

        {/* Menu Overlay */}
        {gameState.status === 'MENU' && (
          <MainMenu onStart={startGame} initialConfig={currentConfig.current} />
        )}
      </div>
    </div>
  );
};

export default App;