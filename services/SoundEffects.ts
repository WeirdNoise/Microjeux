
export class SoundEffects {
  private ctx: AudioContext | null = null;
  
  // Variables pour le son de boost continu
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  
  constructor() {
    // On instancie le contexte mais il démarrera suspended
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  public async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // --- GESTION DU BOOST CONTINU ---
  public setBoostState(isBoosting: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (isBoosting) {
        // Si on booste et que le son n'est pas déjà lancé
        if (!this.boostOsc) {
            this.boostOsc = this.ctx.createOscillator();
            this.boostGain = this.ctx.createGain();

            // Son type "Moteur électrique / Vent" (Sawtooth filtrée)
            this.boostOsc.type = 'sawtooth';
            // Fréquence qui monte pour donner l'impression d'accélération
            this.boostOsc.frequency.setValueAtTime(60, t);
            this.boostOsc.frequency.linearRampToValueAtTime(120, t + 2); 

            // Filtre passe-bas pour étouffer le côté agressif de la sawtooth
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, t);
            filter.frequency.linearRampToValueAtTime(600, t + 2);

            // Volume (Fade in rapide)
            this.boostGain.gain.setValueAtTime(0, t);
            this.boostGain.gain.linearRampToValueAtTime(0.15, t + 0.1);

            // Connexions
            this.boostOsc.connect(filter);
            filter.connect(this.boostGain);
            this.boostGain.connect(this.ctx.destination);
            
            this.boostOsc.start(t);
        }
    } else {
        // Si on ne booste plus mais que le son joue encore
        if (this.boostOsc && this.boostGain) {
            // Fade out
            this.boostGain.gain.cancelScheduledValues(t);
            this.boostGain.gain.setValueAtTime(this.boostGain.gain.value, t);
            this.boostGain.gain.linearRampToValueAtTime(0, t + 0.2);
            
            this.boostOsc.stop(t + 0.2);
            
            // Cleanup après le stop
            const oldOsc = this.boostOsc;
            setTimeout(() => { if(oldOsc) oldOsc.disconnect(); }, 250);
            
            this.boostOsc = null;
            this.boostGain = null;
        }
    }
  }

  public playSpray() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Création de bruit blanc
    const bufferSize = this.ctx.sampleRate * 0.2; // 200ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filtre passe-bande pour le son "psshhh"
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(t);
  }

  public playDogHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Grognement / Morsure (Sawtooth Low)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, t);
    osc1.frequency.linearRampToValueAtTime(50, t + 0.2);
    
    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.4, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    // Claquement (Triangle High Pitch)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, t);
    osc2.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.3, t);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc1.start(t); osc1.stop(t+0.2);
    osc2.start(t); osc2.stop(t+0.1);
  }

  public playOldManHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // "Hé!" / Grunt (Square wave descendant)
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    // Impact Grave (Kick)
    const kick = this.ctx.createOscillator();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(100, t);
    kick.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    
    const kickGain = this.ctx.createGain();
    kickGain.gain.setValueAtTime(0.6, t);
    kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    kick.connect(kickGain);
    kickGain.connect(this.ctx.destination);

    osc.start(t); osc.stop(t+0.3);
    kick.start(t); kick.stop(t+0.2);
  }

  public playSuccess() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Accord arpégé simple (Do majeur : Do-Mi-Sol)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.05);
        
        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0, t + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.1, t + i * 0.05 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.4);
    });
  }
}