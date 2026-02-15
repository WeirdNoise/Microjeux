import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';
import { MusicGenerator } from './services/MusicGenerator';
import { AudioManager } from './services/AudioManager'; // Import de la nouvelle classe
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
  // MusicGenerator gardé pour les jingles (Victoire/GameOver) 
  const jingleGen = useRef<MusicGenerator>(new MusicGenerator());
  // AudioManager pour la musique de fond (MP3)
  const bgmManager = useRef<AudioManager>(new AudioManager());
  const sfx = useRef<SoundEffects>(new SoundEffects());

  // --- STATE TRACKING ---
  const currentConfig = useRef<GameConfig>(DEFAULT_CONFIG);

  // --- SCALING FOR PREVIEW ---
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Calcul du facteur d'échelle pour faire tenir 1920x1080 dans la fenêtre
      const scaleX = window.innerWidth / GAME_WIDTH;
      const scaleY = window.innerHeight / GAME_HEIGHT;
      // On prend le plus petit ratio pour que tout rentre
      // On garde une marge de 5% (0.95) pour que ce soit joli
      const newScale = Math.min(scaleX, scaleY) * 0.95; 
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    // Petit délai pour s'assurer que le window.innerWidth est correct au chargement initial
    setTimeout(handleResize, 50);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = async (config: GameConfig) => {
    // Initialisation du contexte audio sur interaction utilisateur
    try {
        await jingleGen.current.init();
        await sfx.current.resume();
        
        // On lance la musique d'ambiance ici
        bgmManager.current.playMusic();
    } catch (e) {
        console.warn("Erreur audio:", e);
    }

    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
  };

  // --- GESTION AUDIO (AMBIANCE & JINGLES) ---
  useEffect(() => {
      if (gameState.status === 'PLAYING') {
          // Musique de fond active
          bgmManager.current.playMusic();
      } else if (gameState.status === 'VICTORY') {
          bgmManager.current.stop(); // On coupe la musique de fond
          jingleGen.current.stop();
          jingleGen.current.playVictory(); // On joue le jingle
          sfx.current.setBoostState(false);
      } else if (gameState.status === 'GAMEOVER') {
          bgmManager.current.stop(); // On coupe la musique de fond
          jingleGen.current.stop();
          jingleGen.current.playGameOver(); // On joue le jingle
          sfx.current.setBoostState(false);
      } else {
          // Menu ou autre état : Silence
          bgmManager.current.stop();
          jingleGen.current.stop();
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
              if (event === 'COUNTDOWN') sfx.current.playHeartbeat();
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
      bgmManager.current.stop();
      jingleGen.current.stop();
    };
  }, [loop]);

  return (
    <div className="w-full h-full bg-[#050505] overflow-hidden relative">
      {/* 
          SCALING CONTAINER (Position Absolue Centrée)
          Utilisation de 'absolute' + 'translate' pour garantir le centrage
          quel que soit le comportement du parent flexbox ou la taille de l'écran.
      */}
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