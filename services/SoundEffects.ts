
export class SoundEffects {
  private ctx: AudioContext | null = null;
  
  constructor() {
    // On instancie le contexte mais il démarrera suspended
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  public async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
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

  public playBark() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Oscillateur triangulaire pour le "Woof"
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    // Ajout d'un peu de bruit pour le mordant
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
    noise.start(t);
  }

  public playYell() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Onde en dent de scie pour le cri "Hé!"
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    // Variation de pitch descendante
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05); // Attaque
    gain.gain.linearRampToValueAtTime(0, t + 0.4); // Relâchement

    // Vibrato
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 10;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    osc.stop(t + 0.4);
    lfo.stop(t + 0.4);
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