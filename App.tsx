import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';
import { MusicGenerator } from './services/MusicGenerator';
import { SoundEffects } from './services/SoundEffects';

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

  const startGame = async (config: GameConfig) => {
    // Initialisation du contexte audio sur interaction utilisateur
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
      } else {
          musicGen.current.stop();
      }

      // Lecture des bruitages (SFX) basés sur les événements
      if (gameState.audioEvents && gameState.audioEvents.length > 0) {
          gameState.audioEvents.forEach(event => {
              if (event === 'SPRAY') sfx.current.playSpray();
              if (event === 'HIT_DOG') sfx.current.playDogHit();
              if (event === 'HIT_OLDMAN') sfx.current.playOldManHit();
              if (event === 'WALL_DONE') sfx.current.playSuccess();
          });
      }
  }, [gameState.status, gameState.audioEvents]);

  // --- NAVIGATION / FIN DE PARTIE ---
  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      // Ce useEffect ne dépend QUE de gameState.status, donc le timer ne sera pas reset à chaque frame
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
    <div className="relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center">
      
      {gameState.status === 'MENU' ? (
        <MainMenu onStart={startGame} initialConfig={currentConfig.current} />
      ) : (
        /* Conteneur Aspect Ratio 16:9 centré */
        /* max-w-[177.78vh] signifie : la largeur ne dépasse pas 1.77 * la hauteur (format 16/9) */
        <div className="relative w-full max-w-[177.78vh] aspect-video shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-[#111]">
          <GameCanvas gameState={gameState} />
          <UIOverlay gameState={gameState} />
        </div>
      )}
    </div>
  );
};

export default App;