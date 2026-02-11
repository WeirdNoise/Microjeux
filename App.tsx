import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';

// Utilisation de new URL pour résoudre le chemin de l'asset audio de manière robuste
// Cela évite l'erreur "Failed to resolve module specifier" sur les fichiers non-JS
const AUDIO_ASSETS = {
    MUSIC: new URL('./assets/sounds/MusiqueDuJeu.mp3', import.meta.url).href
};

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
  
  // --- AUDIO REFS ---
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // --- STATE TRACKING ---
  const currentConfig = useRef<GameConfig>(DEFAULT_CONFIG);

  const startGame = (config: GameConfig) => {
    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
  };

  // --- GESTION AUDIO ET ETATS DU JEU ---
  useEffect(() => {
      const audio = musicRef.current;
      if (!audio) return;

      if (gameState.status === 'PLAYING') {
          // Démarrage de la musique
          audio.currentTime = 0;
          audio.volume = 0.5;
          audio.loop = true;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch((e) => {
                  console.warn("Audio play blocked (attente interaction):", e);
              });
          }
      } else {
          // Arrêt de la musique (Menu, Victoire, Game Over)
          audio.pause();
      }

      // Timer de retour au menu pour les écrans de fin
      let timeoutId: ReturnType<typeof setTimeout>;
      if (gameState.status === 'VICTORY' || gameState.status === 'GAMEOVER') {
        timeoutId = setTimeout(() => {
          setGameState(createInitialState(currentConfig.current)); 
        }, 5000);
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

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (inputManager.current) inputManager.current.cleanup();
    };
  }, [loop]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center">
      
      {/* --- AUDIO ELEMENT --- */}
      <audio 
        ref={musicRef} 
        src={AUDIO_ASSETS.MUSIC} 
        preload="auto"
        loop
      />

      {gameState.status === 'MENU' ? (
        <MainMenu onStart={startGame} initialConfig={currentConfig.current} />
      ) : (
        <>
          <GameCanvas gameState={gameState} />
          <UIOverlay gameState={gameState} />
        </>
      )}
    </div>
  );
};

export default App;