import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';
import { AudioManager } from './services/AudioManager'; 
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
  
  // --- AUDIO SERVICES ---
  // AudioManager gère désormais toutes les musiques (Intro, Game, Win, Lose)
  const audioManager = useRef<AudioManager>(new AudioManager());
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

  // Initialisation Audio au premier clic (Start Game)
  const startGame = async (config: GameConfig) => {
    try {
        await sfx.current.resume();
        // Le changement d'état vers PLAYING déclenchera la musique via le useEffect
    } catch (e) {
        console.warn("Erreur audio:", e);
    }

    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
  };

  // --- GESTION MUSIQUE D'AMBIANCE ---
  useEffect(() => {
      switch (gameState.status) {
          case 'MENU':
              audioManager.current.play('intro');
              break;
          case 'PLAYING':
              audioManager.current.play('game');
              break;
          case 'VICTORY':
              audioManager.current.play('win');
              sfx.current.setBoostState(false);
              break;
          case 'GAMEOVER':
              audioManager.current.play('lose');
              sfx.current.setBoostState(false);
              break;
          default:
              audioManager.current.stop();
              sfx.current.setBoostState(false);
              break;
      }
  }, [gameState.status]);

  // --- GESTION SFX ---
  useEffect(() => {
      // 1. Gestion du son continu de boost
      if (gameState.status === 'PLAYING') {
          sfx.current.setBoostState(gameState.player.isBoosting);
      } else {
          sfx.current.setBoostState(false);
      }

      // 2. Lecture des bruitages (SFX) basés sur les événements instantanés
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

  // --- NAVIGATION / TIMER FIN DE PARTIE ---
  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      if (gameState.status === 'VICTORY' || gameState.status === 'GAMEOVER') {
        timeoutId = setTimeout(() => {
          setGameState(createInitialState(currentConfig.current)); 
        }, 6000); // Un peu plus long pour laisser la musique de fin jouer
      }
      return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [gameState.status]);

  const loop = useCallback(() => {
    if (!inputManager.current) return;

    setGameState(prevState => {
      if (prevState.status === 'MENU') return prevState;
      const input = inputManager.current!.getInput();
      return updateGameState(prevState, input);
    });

    requestRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    inputManager.current = new InputManager();
    requestRef.current = requestAnimationFrame(loop);
    
    // Lancer la musique d'intro dès que possible (peut être bloqué par l'autoplay browser)
    audioManager.current.play('intro');

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (inputManager.current) inputManager.current.cleanup();
      audioManager.current.stop();
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
        {gameState.status === 'MENU' ? (
          <MainMenu onStart={startGame} initialConfig={currentConfig.current} />
        ) : (
          <>
            <GameCanvas gameState={gameState} />
            <UIOverlay gameState={gameState} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;