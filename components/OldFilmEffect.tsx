
import React, { useMemo } from 'react';

const OldFilmEffect: React.FC = () => {
  // Génération d'une texture de bruit statique en base64
  const noiseUrl = useMemo(() => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Bruit noir et blanc
    const idata = ctx.createImageData(256, 256);
    const buffer32 = new Uint32Array(idata.data.buffer);
    for (let i = 0; i < buffer32.length; i++) {
        if (Math.random() < 0.5) {
            buffer32[i] = 0xff000000; // Noir
        } else {
             buffer32[i] = 0x00ffffff; // Blanc (alpha 0)
        }
    }
    ctx.putImageData(idata, 0, 0);
    return canvas.toDataURL();
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] w-full h-full overflow-hidden select-none">
        {/* VIGNETTE (Assombrissement des coins) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.5)_100%)] mix-blend-multiply" />
        
        {/* GRAIN (Bruit qui bouge) */}
        <div 
            className="absolute inset-[-100%] w-[300%] h-[300%] animate-grain opacity-[0.12] mix-blend-overlay"
            style={{ backgroundImage: `url(${noiseUrl})`, backgroundRepeat: 'repeat' }} 
        />
        
        {/* RAYURES (Lignes verticales aléatoires) */}
        <div className="absolute inset-0 w-full h-full animate-scratch">
           <div className="absolute top-0 bottom-0 w-[2px] h-full bg-white/20 blur-[1px]" />
        </div>
        
        <div className="absolute inset-0 w-full h-full animate-scratch" style={{ animationDelay: '2s', transform: 'scaleX(-1)' }}>
           <div className="absolute top-0 bottom-0 left-[20%] w-[1px] h-full bg-black/30 blur-[1px]" />
        </div>

         {/* SCINTILLEMENT (Variation globale de luminosité) */}
         <div className="absolute inset-0 bg-white animate-flicker mix-blend-overlay"></div>
    </div>
  );
};

export default OldFilmEffect;
