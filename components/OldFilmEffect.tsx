
import React from 'react';

const OldFilmEffect: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] w-full h-full overflow-hidden select-none bg-transparent opacity-50">
      
      {/* 1. FILTRE SVG POUR GRAIN ORGANIQUE (Meilleur que Canvas Noise) */}
      {/* Ce SVG est invisible mais définit le filtre utilisé par CSS */}
      <svg className="hidden">
        <filter id="super8-grain">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.8" 
            numOctaves="3" 
            stitchTiles="stitch" 
            result="noise"
          />
          <feColorMatrix 
            type="saturate" 
            values="0" 
            in="noise" 
            result="grayNoise"
          />
          <feComponentTransfer in="grayNoise" result="contrastedNoise">
              <feFuncR type="linear" slope="3" intercept="-1"/>
              <feFuncG type="linear" slope="3" intercept="-1"/>
              <feFuncB type="linear" slope="3" intercept="-1"/>
          </feComponentTransfer>
        </filter>
      </svg>

      {/* CONTAINER PRINCIPAL AVEC JITTER (Tremblement de l'image entière) */}
      <div className="absolute inset-0 w-full h-full animate-super8-jitter">
        
        {/* 2. COUCHE DE GRAIN ANIMÉE */}
        {/* On utilise le filtre SVG défini plus haut */}
        <div 
          className="absolute inset-[-50%] w-[200%] h-[200%] opacity-30 mix-blend-overlay"
          style={{ 
            filter: 'url(#super8-grain)',
            transform: 'translateZ(0)', // Force GPU
          }}
        />
        
        {/* 3. RAYURES VERTICALES (Scratches) */}
        <div className="absolute inset-0 w-full h-full">
           {/* Rayure 1 */}
           <div className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-white/40 h-full animate-scratch" style={{ animationDuration: '3s', animationDelay: '0s' }} />
           {/* Rayure 2 */}
           <div className="absolute top-0 bottom-0 left-[65%] w-[2px] bg-black/50 h-full animate-scratch" style={{ animationDuration: '4.5s', animationDelay: '1s' }} />
        </div>

        {/* 4. POUSSIÈRES & TÂCHES (Dust) */}
        <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-black/60 blur-[1px] animate-dust" />
        <div className="absolute top-[70%] left-[80%] w-24 h-[1px] bg-black/40 rotate-12 animate-dust" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[50%] left-[10%] w-1 h-3 rounded-full bg-white/40 blur-[1px] animate-dust" style={{ animationDelay: '0.5s' }} />

      </div>

      {/* 5. VIGNETTE & CADRE (Overlay statique par dessus le jitter) */}
      
      {/* Vignette très forte (Coins noirs) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(5,5,5,0.8)_95%,rgba(0,0,0,1)_150%)]" />
      
      {/* Bordure floue pour simuler la fenêtre de projection */}
      <div className="absolute inset-0 border-[40px] border-black/80 rounded-[40px] blur-[8px]" />
      
      {/* Scintillement global (Flicker) - Appliqué en dernier pour affecter la luminosité globale */}
      <div className="absolute inset-0 bg-white mix-blend-overlay animate-super8-flicker pointer-events-none" />

    </div>
  );
};

export default OldFilmEffect;
