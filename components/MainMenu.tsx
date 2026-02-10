import React, { useState } from 'react';
import { GameConfig } from '../types';

interface MainMenuProps {
  initialConfig: GameConfig;
  onStart: (config: GameConfig) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ initialConfig, onStart }) => {
  const [config, setConfig] = useState<GameConfig>(initialConfig);

  const handleChange = (key: keyof GameConfig, val: number) => {
      setConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white overflow-auto">
      <div className="border-8 border-white p-8 max-w-6xl w-full text-center shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center bg-black">
        <h1 className="text-8xl font-bold mb-2 tracking-tighter">LE TCHIPEUR</h1>
        <h2 className="text-2xl mb-8 tracking-widest text-gray-400">CONFIGURATION DE MISSION</h2>
        
        {/* CONFIGURATION SECTION */}
        <div className="flex w-full justify-center gap-12 mb-8 p-4 border border-gray-700 bg-gray-900 flex-wrap">
            <div className="flex flex-col items-center min-w-[150px]">
                <label className="mb-2 text-xl font-bold">MURS</label>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleChange('wallCount', Math.max(1, config.wallCount - 1))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">-</button>
                    <span className="text-4xl font-bold w-12">{config.wallCount}</span>
                    <button onClick={() => handleChange('wallCount', Math.min(10, config.wallCount + 1))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">+</button>
                </div>
            </div>
            <div className="flex flex-col items-center min-w-[150px]">
                <label className="mb-2 text-xl font-bold">CHIENS</label>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleChange('dogCount', Math.max(0, config.dogCount - 1))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">-</button>
                    <span className="text-4xl font-bold w-12">{config.dogCount}</span>
                    <button onClick={() => handleChange('dogCount', Math.min(2, config.dogCount + 1))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">+</button>
                </div>
            </div>
            <div className="flex flex-col items-center min-w-[150px]">
                <label className="mb-2 text-xl font-bold">VIEUX</label>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleChange('oldManCount', Math.max(1, config.oldManCount - 1))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">-</button>
                    <span className="text-4xl font-bold w-12">{config.oldManCount}</span>
                    <button onClick={() => handleChange('oldManCount', Math.min(10, config.oldManCount + 1))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">+</button>
                </div>
            </div>
             <div className="flex flex-col items-center min-w-[150px]">
                <label className="mb-2 text-xl font-bold">TEMPS</label>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleChange('gameDuration', Math.max(30, config.gameDuration - 30))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">-</button>
                    <span className="text-4xl font-bold w-20">{config.gameDuration}</span>
                    <button onClick={() => handleChange('gameDuration', Math.min(300, config.gameDuration + 30))} className="text-2xl px-2 border border-gray-500 hover:bg-white hover:text-black">+</button>
                </div>
            </div>
        </div>

        <div className="flex w-full justify-between gap-8 text-left mb-8 border-t border-b border-gray-800 py-6">
            <div className="w-1/3">
                <h3 className="text-xl underline mb-4 text-center">COMMANDES</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                    <li><span className="font-bold text-white">FLÈCHES</span> : SE DÉPLACER</li>
                    <li><span className="font-bold text-white">ESPACE (SPAM)</span> : TAGUER</li>
                    <li><span className="font-bold text-white">SHIFT</span> : BOOST VITESSE</li>
                    <li><span className="font-bold text-white">Z</span> : TÉLÉPORTATION</li>
                    <li><span className="font-bold text-white">A</span> : ABANDONNER</li>
                </ul>
            </div>
            <div className="w-2/3 border-l border-gray-700 pl-8">
                <h3 className="text-xl underline mb-4 text-center">MIDI (OPTIONNEL)</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="border border-white p-2 bg-gray-900">
                        <h4 className="font-bold mb-1 bg-white text-black text-center">CH 1: JOUEUR</h4>
                        <div className="flex justify-between"><span>MOVE</span><span>CC 1/2</span></div>
                        <div className="flex justify-between"><span>TAG</span><span>NOTE 60</span></div>
                    </div>
                     <div className="border border-white p-2 bg-gray-900">
                        <h4 className="font-bold mb-1 bg-white text-black text-center">CH 3: CHIENS</h4>
                        <div className="flex justify-between"><span>MOVE</span><span>CC 1/2</span></div>
                    </div>
                     <div className="border border-white p-2 bg-gray-900">
                        <h4 className="font-bold mb-1 bg-white text-black text-center">CH 4: VIEUX</h4>
                        <div className="flex justify-between"><span>MOVE</span><span>CC 1/2</span></div>
                    </div>
                </div>
            </div>
        </div>

        <button 
            onClick={() => onStart(config)}
            className="text-4xl border-4 border-white px-12 py-4 hover:bg-white hover:text-black transition-colors duration-200 animate-pulse uppercase"
        >
            COLORIE TA VILLE !
        </button>
      </div>
    </div>
  );
};

export default MainMenu;