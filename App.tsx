import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';

// Correction : Avec base: './' dans vite.config.ts, il faut utiliser un chemin relatif (sans slash au début)
// pour que cela fonctionne en preview et dans Electron.
// Structure attendue : dossier "public/sounds/MusiqueDuJeu.mp3" à la racine du projet.
const AUDIO_ASSETS = {
    MUSIC: 'sounds/MusiqueDuJeu.mp3'
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
    // FIX IMPORTANTE : Lancer l'audio directement dans l'événement du clic (interaction utilisateur)
    // pour contourner la politique "Audio play blocked".
    if (musicRef.current) {
        musicRef.current.currentTime = 0;
        musicRef.current.volume = 0.5;
        musicRef.current.loop = true;
        const playPromise = musicRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((e) => {
                console.warn("Echec lecture audio au démarrage:", e);
            });
        }
    }

    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
  };

  // --- GESTION AUDIO ET ETATS DU JEU ---
  useEffect(() => {
      const audio = musicRef.current;
      if (!audio) return;

      if (gameState.status === 'PLAYING') {
          // Si l'audio n'a pas démarré via le clic (cas rare) ou a été mis en pause
          if (audio.paused) {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                  playPromise.catch((e) => {
                      console.warn("Audio bloqué (attente interaction):", e);
                  });
              }
          }
      } else {
          // Arrêt de la musique (Menu, Victoire, Game Over)
          audio.pause();
          // On ne remet pas forcément à 0 ici pour éviter les coupures brusques si on réutilise, 
          // mais pour ce jeu c'est mieux de reset.
          if (gameState.status !== 'MENU') { 
             audio.currentTime = 0; 
          }
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
      {/* Ajout du type MIME pour aider le navigateur à identifier la source */}
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