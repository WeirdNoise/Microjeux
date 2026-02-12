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

  const isGameOver = gameState.status === 'VICTORY' || gameState.status === 'GAMEOVER';
  const isEmergency = gameState.status === 'PLAYING' && gameState.timeLeft <= 10;
  
  const mainColorClass = isEmergency ? "text-red-600 border-red-600" : "text-white border-white";
  const mainBgClass = isEmergency ? "bg-red-600" : "bg-white";
  const mainShadowClass = isEmergency ? "shadow-[0_0_15px_red]" : "shadow-[0_0_15px_white]";
  const mainStrokeColor = isEmergency ? "#DC2626" : "white";

  // Sort walls by completion time to map them to the visual indicators in order
  const taggedWalls = gameState.walls
      .filter(w => w.isTagged)
      .sort((a, b) => (a.completedTime || 0) - (b.completedTime || 0));

  const now = Date.now();

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-8">
      
      {/* Bottom Right Dashboard - Fade out on Game Over */}
      <div 
        className={`absolute bottom-8 right-8 flex flex-col items-end gap-2 text-white transition-opacity duration-1000 ${isGameOver ? 'opacity-20' : 'opacity-100'}`}
      >
          
          {/* Time */}
          <div className={`text-5xl tracking-tighter opacity-80 mb-1 ${isEmergency ? 'text-red-600 animate-pulse' : 'text-white'}`} style={{ textShadow: isEmergency ? "0 0 10px red" : "0 0 10px white" }}>
            {formatTime(gameState.timeLeft)}
          </div>

          {/* Boost Bar */}
          <div 
            className={`h-4 bg-gray-900 border ${isEmergency ? 'border-red-600' : 'border-white'}`}
            style={{ width: `${squaresRowWidth}px` }}
          >
              <div 
                className={`h-full ${mainBgClass} ${mainShadowClass}`} 
                style={{ width: `${boostPercentage}%` }}
              />
          </div>
          
          {/* Objective Tags */}
          <div className="flex gap-2 mt-1 justify-end">
            {Array.from({length: gameState.config.wallCount}).map((_, i) => {
                const wallData = taggedWalls[i];
                // Check if this specific tag was completed less than 2 seconds ago
                const isRecentlyTagged = wallData && (now - (wallData.completedTime || 0) < 2000);
                
                let className = `w-6 h-6 border transition-colors duration-200 ${isEmergency ? 'border-red-600' : 'border-white'} `;
                if (wallData) {
                    if (isRecentlyTagged) {
                        // Flash Red with Pulse Animation
                        className += "bg-red-600 border-red-600 shadow-[0_0_15px_red] animate-pulse";
                    } else {
                        // Normal Completed (Red in emergency, white otherwise)
                        className += `${mainBgClass} ${mainShadowClass}`;
                    }
                } else {
                    // Not yet tagged
                    className += "bg-black opacity-50";
                }

                return <div key={i} className={className} />;
            })}
          </div>

          {/* Dog Danger Indicators */}
          <div className="flex gap-2 mt-2 justify-end">
            {Array.from({length: maxDogHits}).map((_, i) => {
                const isHit = i < dogHits;
                // Check if this is the latest hit and it happened less than 2 seconds ago
                const isRecentHit = isHit && (i === dogHits - 1) && (now - (gameState.player.lastHitTime || 0) < 2000);

                const iconColor = isRecentHit ? "#DC2626" : mainStrokeColor; 

                return (
                    <div key={i} className={`w-6 h-6 flex items-center justify-center transition-transform ${isRecentHit ? 'scale-125 animate-pulse' : ''}`}>
                        {isHit ? (
                             <svg width="24" height="24" viewBox="0 0 24 24" fill={iconColor}>
                                <path d="M12 2L2 22H22L12 2Z" stroke={iconColor} strokeWidth="2" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 22H22L12 2Z" stroke={mainStrokeColor} strokeWidth="2" strokeOpacity="0.5"/>
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