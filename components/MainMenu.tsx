import React, { useState } from 'react';
import { GameConfig } from '../types';

interface MainMenuProps {
  initialConfig: GameConfig;
  onStart: (config: GameConfig) => void;
}

const RIDDLES = [
  // --- ÉNIGMES TEXTUELLES ---
  {
    question: "Je suis grand quand je suis jeune et petit quand je suis vieux. Qui suis-je ?",
    options: ["Un arbre", "Une bougie", "Un éléphant", "Un nuage"],
    correct: 1
  },
  {
    question: "Qu'est-ce qui a des dents mais ne mord pas ?",
    options: ["Un peigne", "Une fourchette", "Un tigre", "Une scie"],
    correct: 0
  },
  {
    question: "Je tombe sans me faire mal. Qui suis-je ?",
    options: ["Une pierre", "La pluie", "Un acrobate", "Une plume"],
    correct: 1
  },
  {
    question: "Plus j'ai de gardiens, moins je suis gardé. Qui suis-je ?",
    options: ["Un trésor", "Une prison", "Un secret", "Un but de foot"],
    correct: 2
  },
  {
    question: "Je commence la nuit et je finis le matin. Qui suis-je ?",
    options: ["Le soleil", "La lune", "La lettre N", "Le petit déjeuner"],
    correct: 2
  },
  {
    question: "J'ai un chapeau mais pas de tête, et un pied mais pas de chaussure. Qui suis-je ?",
    options: ["Un champignon", "Un magicien", "Une table", "Une lampe"],
    correct: 0
  },
  {
    question: "Je peux voler sans avoir d'ailes. Je peux pleurer sans avoir d'yeux. Qui suis-je ?",
    options: ["Le vent", "Un avion", "Le nuage", "Un oiseau"],
    correct: 2
  },
  {
    question: "Quel mois de l'année a 28 jours ?",
    options: ["Février", "Juin", "Décembre", "Tous les mois"],
    correct: 3
  },
  {
    question: "Qu'est-ce qui monte et qui descend sans jamais bouger ?",
    options: ["Un ascenseur", "L'escalier", "La température", "Le prix"],
    correct: 1
  },
  {
    question: "Je suis plein de trous mais je peux retenir l'eau. Qui suis-je ?",
    options: ["Un filet", "Une éponge", "Un seau percé", "Un arrosoir"],
    correct: 1
  },
  {
    question: "Je suis noir quand je suis propre et blanc quand je suis sale. Qui suis-je ?",
    options: ["Un tableau noir", "Un pingouin", "Le charbon", "Un zèbre"],
    correct: 0
  },
  {
    question: "J'ai des villes, mais pas de maisons. J'ai des montagnes, mais pas d'arbres. Qui suis-je ?",
    options: ["Une carte", "Un rêve", "Le désert", "Une planète"],
    correct: 0
  },
  // --- MATHÉMATIQUES (Niveau Primaire) ---
  {
    question: "Combien font 7 + 6 ?",
    options: ["11", "12", "13", "14"],
    correct: 2
  },
  {
    question: "Quel est le résultat de 3 x 5 ?",
    options: ["10", "15", "20", "8"],
    correct: 1
  },
  {
    question: "Combien font 20 - 5 ?",
    options: ["10", "25", "15", "12"],
    correct: 2
  },
  {
    question: "J'ai 10 billes, j'en perds 3. Combien m'en reste-t-il ?",
    options: ["7", "8", "13", "6"],
    correct: 0
  },
  {
    question: "Combien font 4 x 4 ?",
    options: ["8", "12", "16", "20"],
    correct: 2
  },
  {
    question: "Quel est le double de 9 ?",
    options: ["16", "18", "19", "20"],
    correct: 1
  },
  {
    question: "Combien font 10 + 10 + 10 ?",
    options: ["20", "30", "40", "100"],
    correct: 1
  },
  {
    question: "Combien font 8 + 9 ?",
    options: ["15", "16", "17", "18"],
    correct: 2
  },
  {
    question: "Quel est le résultat de 6 x 2 ?",
    options: ["10", "12", "8", "14"],
    correct: 1
  },
  {
    question: "Combien font 50 - 10 ?",
    options: ["30", "40", "60", "20"],
    correct: 1
  }
];

const MainMenu: React.FC<MainMenuProps> = ({ initialConfig, onStart }) => {
  const [config, setConfig] = useState<GameConfig>(initialConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Riddle State
  const [isRiddleOpen, setIsRiddleOpen] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState(RIDDLES[0]);
  const [isWrongAnim, setIsWrongAnim] = useState(false);

  const handleChange = (key: keyof GameConfig, val: number) => {
      setConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleStartRequest = () => {
      // Pick a random riddle ensuring variety
      const random = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
      setCurrentRiddle(random);
      setIsWrongAnim(false);
      setIsRiddleOpen(true);
  };

  const checkAnswer = (index: number) => {
      if (index === currentRiddle.correct) {
          onStart(config);
      } else {
          setIsWrongAnim(true);
          setTimeout(() => setIsWrongAnim(false), 500);
      }
  };

  // Icônes SVG simples
  const GearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      
      {/* --- ÉCRAN ACCUEIL --- */}
      <div className={`flex flex-col items-center transition-opacity duration-300 ${isSettingsOpen || isRiddleOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <h1 className="text-9xl font-bold mb-12 tracking-tighter animate-pulse" style={{ textShadow: "0 0 40px rgba(255,255,255,0.3)" }}>
            LE TCHIPEUR
          </h1>
          
          <button 
              onClick={handleStartRequest}
              className="text-5xl border-4 border-white px-16 py-6 hover:bg-white hover:text-black transition-colors duration-200 uppercase tracking-widest"
          >
              COLORIE TA VILLE
          </button>
      </div>

      {/* Bouton Settings (en haut à droite) */}
      {!isSettingsOpen && !isRiddleOpen && (
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-8 right-8 p-4 border border-transparent hover:border-white rounded-full transition-all text-gray-500 hover:text-white"
        >
          <GearIcon />
        </button>
      )}

      {/* --- MODALE ÉNIGME --- */}
      {isRiddleOpen && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
           <div className={`border-4 border-white p-12 max-w-4xl w-full text-center shadow-[0_0_50px_rgba(255,255,255,0.1)] relative ${isWrongAnim ? 'animate-shake' : ''}`}>
              <h2 className="text-3xl font-bold tracking-widest mb-2 text-gray-400">POUR JOUER, RÉPONDS À LA QUESTION</h2>
              <div className="w-full h-1 bg-white mb-8"></div>
              
              <h3 className="text-4xl font-bold mb-12 leading-tight">
                  "{currentRiddle.question}"
              </h3>

              <div className="grid grid-cols-2 gap-6">
                  {currentRiddle.options.map((option, idx) => (
                      <button 
                        key={idx}
                        onClick={() => checkAnswer(idx)}
                        className="text-2xl border-2 border-gray-500 py-6 px-4 hover:border-white hover:bg-white hover:text-black transition-all"
                      >
                          {option}
                      </button>
                  ))}
              </div>

              <button 
                onClick={() => setIsRiddleOpen(false)}
                className="mt-12 text-gray-500 hover:text-white underline"
              >
                Retour
              </button>
           </div>
           {/* Custom Keyframe for shake in plain style or just reuse existing mechanics */}
           <style>{`
             @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); border-color: red; }
                20%, 40%, 60%, 80% { transform: translateX(10px); border-color: red; }
             }
             .animate-shake {
                animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
             }
           `}</style>
        </div>
      )}

      {/* --- MODALE PARAMÈTRES --- */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
          <div className="border-4 border-white p-8 max-w-5xl w-full text-center shadow-[0_0_50px_rgba(255,255,255,0.1)] relative">
            
            {/* Header Settings */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
              <h2 className="text-4xl font-bold tracking-widest">PARAMÈTRES DE MISSION</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="hover:text-gray-400">
                <CloseIcon />
              </button>
            </div>

            {/* CONFIGURATION GRID */}
            <div className="flex w-full justify-center gap-8 mb-8 flex-wrap">
                <div className="flex flex-col items-center min-w-[150px] p-4 border border-gray-800">
                    <label className="mb-2 text-xl font-bold text-gray-400">MURS</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleChange('wallCount', Math.max(1, config.wallCount - 1))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">-</button>
                        <span className="text-4xl font-bold w-12">{config.wallCount}</span>
                        <button onClick={() => handleChange('wallCount', Math.min(10, config.wallCount + 1))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">+</button>
                    </div>
                </div>
                <div className="flex flex-col items-center min-w-[150px] p-4 border border-gray-800">
                    <label className="mb-2 text-xl font-bold text-gray-400">CHIENS</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleChange('dogCount', Math.max(0, config.dogCount - 1))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">-</button>
                        <span className="text-4xl font-bold w-12">{config.dogCount}</span>
                        <button onClick={() => handleChange('dogCount', Math.min(2, config.dogCount + 1))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">+</button>
                    </div>
                </div>
                <div className="flex flex-col items-center min-w-[150px] p-4 border border-gray-800">
                    <label className="mb-2 text-xl font-bold text-gray-400">VIEUX</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleChange('oldManCount', Math.max(1, config.oldManCount - 1))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">-</button>
                        <span className="text-4xl font-bold w-12">{config.oldManCount}</span>
                        <button onClick={() => handleChange('oldManCount', Math.min(10, config.oldManCount + 1))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">+</button>
                    </div>
                </div>
                 <div className="flex flex-col items-center min-w-[150px] p-4 border border-gray-800">
                    <label className="mb-2 text-xl font-bold text-gray-400">TEMPS (s)</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleChange('gameDuration', Math.max(30, config.gameDuration - 30))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">-</button>
                        <span className="text-4xl font-bold w-20">{config.gameDuration}</span>
                        <button onClick={() => handleChange('gameDuration', Math.min(300, config.gameDuration + 30))} className="text-2xl px-3 border border-gray-600 hover:bg-white hover:text-black">+</button>
                    </div>
                </div>
            </div>

            {/* HELP / COMMANDS */}
            <div className="flex w-full justify-between gap-8 text-left pt-6 border-t border-gray-800">
                <div className="w-1/3">
                    <h3 className="text-xl underline mb-4 text-center text-gray-300">COMMANDES</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex justify-between"><span className="font-bold text-white">FLÈCHES</span> <span>SE DÉPLACER</span></li>
                        <li className="flex justify-between"><span className="font-bold text-white">ESPACE (SPAM)</span> <span>TAGUER</span></li>
                        <li className="flex justify-between"><span className="font-bold text-white">SHIFT</span> <span>BOOST VITESSE</span></li>
                        <li className="flex justify-between"><span className="font-bold text-white">Z</span> <span>TÉLÉPORTATION</span></li>
                        <li className="flex justify-between"><span className="font-bold text-white">A</span> <span>ABANDONNER</span></li>
                    </ul>
                </div>
                <div className="w-2/3 border-l border-gray-800 pl-8">
                    <h3 className="text-xl underline mb-4 text-center text-gray-300">MIDI (AVANCÉ)</h3>
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                        <div className="border border-gray-700 p-2">
                            <h4 className="font-bold mb-1 text-white text-center">CH 1: JOUEUR</h4>
                            <div className="flex justify-between"><span>MOVE</span><span>CC 1/2</span></div>
                            <div className="flex justify-between"><span>TAG</span><span>NOTE 60</span></div>
                        </div>
                         <div className="border border-gray-700 p-2">
                            <h4 className="font-bold mb-1 text-white text-center">CH 3: CHIENS</h4>
                            <div className="flex justify-between"><span>MOVE</span><span>CC 1/2</span></div>
                        </div>
                         <div className="border border-gray-700 p-2">
                            <h4 className="font-bold mb-1 text-white text-center">CH 4: VIEUX</h4>
                            <div className="flex justify-between"><span>MOVE</span><span>CC 1/2</span></div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MainMenu;