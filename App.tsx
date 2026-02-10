import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import MainMenu from './components/MainMenu';
import { GameState, GameConfig } from './types';
import { createInitialState, updateGameState } from './services/GameEngine';
import { InputManager } from './services/InputManager';

// --- CONFIGURATION AUDIO ---

// 1. Définition des noms de fichiers bruts (tels qu'ils sont sur le disque)
const AUDIO_FILES = {
    MUSIC: "audio/M - Musique du jeu.wav",
    TAG_SUCCESS: "audio/Balise ok.wav",
    SPRAY: "audio/spray.wav",
    BARK: "audio/aboiement.wav",
    OLD_MAN: "audio/vieux.wav",
    TELEPORT: "audio/teleport.wav",
    GAMEOVER: "audio/gameover.wav",
    VICTORY: "audio/victory.wav"
};

// 2. Fonction de résolution de chemin robuste
const getAudioUrl = (relativePath: string) => {
    // Détection de l'environnement : Dev vs Prod
    // En Dev (npm run dev), les assets publics sont à la racine du serveur (localhost:5173/)
    // En Prod (Electron), on utilise des chemins relatifs './' pour le protocole file://
    const meta = import.meta as any;
    const isDev = meta.env ? meta.env.DEV : false;
    const base = isDev ? '/' : './';

    // On sépare le chemin pour encoder chaque partie (dossier, fichier) individuellement
    // Cela permet de gérer les espaces (" ") -> "%20" tout en gardant les slashs "/"
    const encodedPath = relativePath.split('/').map(part => encodeURIComponent(part)).join('/');

    return `${base}${encodedPath}`;
};

// 3. Objet final contenant les URLs utilisables par <audio src="...">
const AUDIO_ASSETS = {
    MUSIC: getAudioUrl(AUDIO_FILES.MUSIC),
    TAG_SUCCESS: getAudioUrl(AUDIO_FILES.TAG_SUCCESS),
    SPRAY: getAudioUrl(AUDIO_FILES.SPRAY),
    BARK: getAudioUrl(AUDIO_FILES.BARK),
    OLD_MAN: getAudioUrl(AUDIO_FILES.OLD_MAN),
    TELEPORT: getAudioUrl(AUDIO_FILES.TELEPORT),
    GAMEOVER: getAudioUrl(AUDIO_FILES.GAMEOVER),
    VICTORY: getAudioUrl(AUDIO_FILES.VICTORY)
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
  const sfxRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // --- STATE TRACKING FOR SFX TRIGGERS ---
  const prevGameState = useRef<GameState>(gameState);
  const currentConfig = useRef<GameConfig>(DEFAULT_CONFIG);

  // Helper pour jouer un son sans erreur et sans latence (overlap possible)
  const playSfx = (key: string) => {
      const audio = sfxRefs.current[key];
      if (audio) {
          // Clone node permet de jouer le même son plusieurs fois en même temps (ex: spam de spray)
          if (key === 'SPRAY') {
              const clone = audio.cloneNode() as HTMLAudioElement;
              clone.volume = 0.3; // Spray moins fort
              clone.play().catch(() => {});
          } else {
              audio.currentTime = 0;
              audio.play().catch(e => {
                  // On ignore les erreurs d'interaction utilisateur (play() failed because user didn't interact first)
                  console.warn(`Lecture audio bloquée (${key}) - Interaction requise:`, e instanceof Error ? e.message : "Erreur inconnue");
              });
          }
      } else {
          console.warn(`Audio introuvable pour la clé: ${key}`);
      }
  };

  const startGame = (config: GameConfig) => {
    currentConfig.current = config;
    const initial = createInitialState(config);
    setGameState({ ...initial, status: 'PLAYING' });
    prevGameState.current = { ...initial, status: 'PLAYING' };
    
    // Restart Music
    if (musicRef.current) {
        musicRef.current.currentTime = 0;
        musicRef.current.volume = 0.5;
        musicRef.current.loop = true;
        
        const playPromise = musicRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((e) => {
                console.warn("Erreur lecture musique (Start):", e instanceof Error ? e.message : "Erreur inconnue");
            });
        }
    }
  };

  // --- AUDIO LOGIC LOOP ---
  useEffect(() => {
      // Ce useEffect s'exécute à chaque frame ou changement d'état important
      if (gameState.status !== 'PLAYING') return;

      const prev = prevGameState.current;
      const curr = gameState;

      // 1. DÉTECTION TAG (SPRAY)
      // On calcule la somme de progression de tous les murs
      const prevTotalProgress = prev.walls.reduce((acc, w) => acc + w.tagProgress, 0);
      const currTotalProgress = curr.walls.reduce((acc, w) => acc + w.tagProgress, 0);
      
      // Si la progression a augmenté, c'est qu'on est en train de sprayer
      if (currTotalProgress > prevTotalProgress) {
          playSfx('SPRAY');
      }

      // 2. DÉTECTION TAG TERMINÉ (SUCCÈS)
      if (curr.player.tagsCompleted > prev.player.tagsCompleted) {
          playSfx('TAG_SUCCESS');
      }

      // 3. DÉTECTION DÉGÂTS (CHIEN vs VIEUX)
      // Si le joueur vient d'être étourdi (stunTimer passe de 0 à > 0)
      if (prev.player.stunTimer === 0 && curr.player.stunTimer > 0) {
          // Si le compteur de coups de chien a augmenté, c'est un chien
          if (curr.player.dogHits > prev.player.dogHits) {
              playSfx('BARK');
          } else {
              // Sinon c'est le vieux
              playSfx('OLD_MAN');
          }
      }

      // 4. DÉTECTION TÉLÉPORTATION
      if (prev.player.canTeleport && !curr.player.canTeleport) {
          playSfx('TELEPORT');
      }

      // Mise à jour de la référence pour la prochaine frame
      prevGameState.current = curr;

  }, [gameState]);

  // --- GESTION FIN DE PARTIE ---
  useEffect(() => {
      if (gameState.status === 'VICTORY') {
          playSfx('VICTORY');
          if (musicRef.current) musicRef.current.pause();
      } else if (gameState.status === 'GAMEOVER') {
          playSfx('GAMEOVER');
          if (musicRef.current) musicRef.current.pause();
      }

      let timeoutId: ReturnType<typeof setTimeout>;
      if (gameState.status === 'VICTORY' || gameState.status === 'GAMEOVER') {
        timeoutId = setTimeout(() => {
          setGameState(createInitialState(currentConfig.current)); 
          // Relancer la musique menu si nécessaire (optionnel, ici on attend le clic start)
           // if (musicRef.current) musicRef.current.play().catch(() => {});
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
      
      {/* --- AUDIO ELEMENTS INVISIBLES --- */}
      <audio 
        ref={musicRef} 
        src={AUDIO_ASSETS.MUSIC} 
        loop 
        preload="auto"
        onError={() => console.error(`ECHEC chargement musique: ${AUDIO_ASSETS.MUSIC} -> Vérifiez 'public/audio'`)}
      />
      {Object.entries(AUDIO_ASSETS).map(([key, src]) => {
          if (key === 'MUSIC') return null;
          return (
              <audio 
                key={key} 
                ref={(el) => { if (el) sfxRefs.current[key] = el; }} 
                src={src}
                preload="auto"
                onError={() => console.error(`ECHEC chargement son ${key}: ${src} -> Vérifiez 'public/audio'`)}
              />
          );
      })}

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