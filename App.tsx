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

  // --- GESTION AUDIO (LOOP & JINGLES) ---
  useEffect(() => {
      // Gestion de la boucle principale et des jingles de fin
      if (gameState.status === 'PLAYING') {
          musicGen.current.play();
      } else if (gameState.status === 'VICTORY') {
          musicGen.current.stop(); // Arrêter la musique de fond
          musicGen.current.playVictory();
          // Couper le boost si on gagne
          sfx.current.setBoostState(false);
      } else if (gameState.status === 'GAMEOVER') {
          musicGen.current.stop(); // Arrêter la musique de fond
          musicGen.current.playGameOver();
          // Couper le boost si on perd
          sfx.current.setBoostState(false);
      } else {
          musicGen.current.stop();
          sfx.current.setBoostState(false);
      }
  }, [gameState.status]);

  // --- GESTION AUDIO (SFX ONE-SHOT & BOOST CONTINU) ---
  useEffect(() => {
      // 1. Gestion du son continu de boost
      // On le met à jour à chaque frame où l'état de boost change
      if (gameState.status === 'PLAYING') {
          sfx.current.setBoostState(gameState.player.isBoosting);
      }

      // 2. Lecture des bruitages (SFX) basés sur les événements instantanés
      if (gameState.audioEvents && gameState.audioEvents.length > 0) {
          gameState.audioEvents.forEach(event => {
              if (event === 'SPRAY') sfx.current.playSpray();
              if (event === 'HIT_DOG') sfx.current.playDogHit();
              if (event === 'HIT_OLDMAN') sfx.current.playOldManHit();
              if (event === 'WALL_DONE') sfx.current.playSuccess();
          });
      }
  }, [gameState.audioEvents, gameState.player.isBoosting, gameState.status]);

  // --- NAVIGATION / TIMER FIN DE PARTIE ---
  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      // Ce useEffect ne dépend QUE de gameState.status pour le reset
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
        <div className="relative w-full max-w-[177.78vh] aspect-video shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-[#111]">
          <GameCanvas gameState={gameState} />
          <UIOverlay gameState={gameState} />
        </div>
      )}
    </div>
  );
};

export default App;