
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
           {/* Rayure 1 (Fine gauche) */}
           <div className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-white/40 h-full animate-scratch" style={{ animationDuration: '3s', animationDelay: '0s' }} />
           {/* Rayure 2 (Moyenne milieu-droit) */}
           <div className="absolute top-0 bottom-0 left-[65%] w-[2px] bg-black/50 h-full animate-scratch" style={{ animationDuration: '4.5s', animationDelay: '1s' }} />
           {/* Rayure 3 (Fine droite rapide) */}
           <div className="absolute top-0 bottom-0 left-[85%] w-[1px] bg-white/30 h-full animate-scratch" style={{ animationDuration: '2.2s', animationDelay: '0.5s' }} />
           {/* Rayure 4 (Très fine milieu) */}
           <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-black/40 h-full animate-scratch" style={{ animationDuration: '6s', animationDelay: '3s' }} />
           {/* Rayure 5 (Bord gauche) */}
           <div className="absolute top-0 bottom-0 left-[5%] w-[1px] bg-white/20 h-full animate-scratch" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        </div>

        {/* 4. POUSSIÈRES & TÂCHES (Dust) */}
        {/* Tache ronde floue */}
        <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-black/60 blur-[1px] animate-dust" />
        {/* Cheveu / Fibre longue */}
        <div className="absolute top-[70%] left-[80%] w-24 h-[1px] bg-black/40 rotate-12 animate-dust" style={{ animationDelay: '1.5s' }} />
        {/* Petite poussière blanche */}
        <div className="absolute top-[50%] left-[10%] w-1 h-3 rounded-full bg-white/40 blur-[1px] animate-dust" style={{ animationDelay: '0.5s' }} />
        {/* Grosse tache coin haut droit */}
        <div className="absolute top-[10%] right-[15%] w-4 h-4 rounded-full bg-black/50 blur-[2px] animate-dust" style={{ animationDelay: '2.1s' }} />
        {/* Fibre verticale bas gauche */}
        <div className="absolute bottom-[20%] left-[15%] w-[1px] h-16 bg-black/50 -rotate-6 animate-dust" style={{ animationDelay: '0.8s' }} />
        {/* Poussières microscopiques rapides */}
        <div className="absolute top-[40%] left-[60%] w-1 h-1 bg-white/50 rounded-full animate-dust" style={{ animationDuration: '0.2s', animationDelay: '4s' }} />
        <div className="absolute top-[80%] left-[40%] w-1.5 h-1.5 bg-black/40 rounded-full animate-dust" style={{ animationDuration: '0.3s', animationDelay: '1.2s' }} />

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
