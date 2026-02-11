import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';
import { MusicGenerator } from './services/MusicGenerator';

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
  
  // --- AUDIO GENERATOR ---
  const musicGen = useRef<MusicGenerator>(new MusicGenerator());

  // --- STATE TRACKING ---
  const currentConfig = useRef<GameConfig>(DEFAULT_CONFIG);

  const startGame = async (config: GameConfig) => {
    // Initialisation du contexte audio sur interaction utilisateur
    try {
        await musicGen.current.init();
        musicGen.current.play();
    } catch (e) {
        console.warn("Erreur audio:", e);
    }

    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
  };

  // --- GESTION AUDIO ET ETATS DU JEU ---
  useEffect(() => {
      if (gameState.status === 'PLAYING') {
          musicGen.current.play();
      } else {
          musicGen.current.stop();
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
      musicGen.current.stop();
    };
  }, [loop]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center">
      
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