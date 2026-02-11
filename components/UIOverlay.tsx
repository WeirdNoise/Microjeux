import React from 'react';
import { GameState } from '../types';
import { PLAYER_MAX_BOOST_TIME } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const boostPercentage = Math.max(0, Math.min(100, (gameState.player.boostTimeLeft / PLAYER_MAX_BOOST_TIME) * 100));
  
  if (gameState.status === 'MENU') return null;

  const wallCount = gameState.config.wallCount;
  const squaresRowWidth = (wallCount * 24) + ((Math.max(0, wallCount - 1)) * 8);

  const dogHits = gameState.player.dogHits || 0;
  const maxDogHits = 3;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-8">
      
      {/* Bottom Right Dashboard - Aligné à droite pour ne pas toucher les bords */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2 text-white">
          
          {/* Time */}
          <div className="text-5xl tracking-tighter opacity-80 mb-1" style={{ textShadow: "0 0 10px white" }}>
            {formatTime(gameState.timeLeft)}
          </div>

          {/* Boost Bar */}
          <div 
            className="h-4 bg-gray-900 border border-white"
            style={{ width: `${squaresRowWidth}px` }}
          >
              <div 
                className="h-full bg-white shadow-[0_0_15px_white]" 
                style={{ width: `${boostPercentage}%` }}
              />
          </div>
          
          {/* Objective Tags */}
          <div className="flex gap-2 mt-1 justify-end">
            {Array.from({length: gameState.config.wallCount}).map((_, i) => (
                <div 
                    key={i} 
                    className={`w-6 h-6 border border-white ${i < gameState.player.tagsCompleted ? "bg-white shadow-[0_0_15px_white]" : "bg-black opacity-50"}`}
                />
            ))}
          </div>

          {/* Dog Danger Indicators */}
          <div className="flex gap-2 mt-2 justify-end">
            {Array.from({length: maxDogHits}).map((_, i) => {
                const isHit = i < dogHits;
                return (
                    <div key={i} className="w-6 h-6 flex items-center justify-center">
                        {isHit ? (
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2L2 22H22L12 2Z" stroke="white" strokeWidth="2" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 22H22L12 2Z" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
                            </svg>
                        )}
                    </div>
                );
            })}
          </div>

      </div>

      {/* End Game Screens */}
      {gameState.status === 'VICTORY' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
             <h1 className="text-9xl text-white font-bold mb-8 tracking-tighter animate-pulse" style={{ textShadow: "0 0 30px white, 0 0 60px black" }}>WINNER</h1>
        </div>
      )}

      {gameState.status === 'GAMEOVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
             <h1 className="text-9xl text-white font-bold mb-8 tracking-tighter" style={{ textShadow: "0 0 20px white, 0 0 40px black" }}>GAME OVER</h1>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;