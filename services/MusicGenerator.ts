
export class MusicGenerator {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerID: number | null = null;
  private noteIndex: number = 0;
  private nextNoteTime: number = 0;
  
  // Séquence mélodique 8-bit "Rigolote" (Style Arcade/Circus)
  // 0 représente un silence. Les nombres sont des notes MIDI.
  private sequence: number[] = [
    // Mesure 1 (Do Majeur sautillant)
    72, 0, 67, 0, 64, 0, 67, 0, // C5, G4, E4, G4
    72, 0, 72, 74, 76, 72, 67, 64, // C5... montée rapide
    // Mesure 2 (Sol Majeur / Ré)
    74, 0, 71, 0, 67, 0, 62, 0, // D5, B4, G4, D4
    74, 0, 74, 76, 77, 74, 71, 67, // D5... variation
    // Mesure 3 (Descente rapide)
    79, 77, 76, 74, 72, 71, 69, 67,
    65, 64, 62, 60, 59, 60, 0, 0
  ];

  constructor() {}

  // Initialisation du contexte audio (doit être appelé suite à une interaction utilisateur)
  public async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public play() {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.noteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  // --- NOUVEAU : Jingle de Victoire ---
  public playVictory() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Fanfare rapide en Do Majeur (Arpège montant)
    // C4, E4, G4, C5, E5, G5
    const notes = [60, 64, 67, 72, 76, 79]; 
    
    notes.forEach((note, i) => {
        // Accélération vers la fin
        const time = t + i * 0.08;
        const duration = i === notes.length - 1 ? 0.8 : 0.1; // La dernière note dure plus longtemps
        this.playOscillator(note, time, 'square', duration, 0.1);
        
        // Harmonisation tierce (plus doux)
        this.playOscillator(note - 12, time, 'triangle', duration, 0.1);
    });
  }

  // --- NOUVEAU : Jingle Game Over ---
  public playGameOver() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Descente chromatique triste / comique "Wah wah wah"
    // F#4 -> F4 -> E4 -> Eb4
    const notes = [66, 65, 64, 63];
    
    notes.forEach((note, i) => {
        const time = t + i * 0.4;
        const duration = 0.35;
        const type = 'triangle'; // Son plus rond/triste
        
        // On joue la note principale
        this.playOscillator(note, time, type, duration, 0.15);
        
        // On ajoute une dissonance légère pour l'effet "faux"
        this.playOscillator(note - 6, time, type, duration, 0.1);
    });
  }

  private scheduler = () => {
    if (!this.isPlaying || !this.ctx) return;

    // Planifier les notes pour les prochaines 100ms
    const scheduleAheadTime = 0.1;
    const secondsPerNote = 0.11; // Vitesse de la musique (plus petit = plus rapide)

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.playStep(this.nextNoteTime);
      this.nextNoteTime += secondsPerNote;
    }

    this.timerID = window.setTimeout(this.scheduler, 25);
  };

  private playStep(time: number) {
    if (!this.ctx) return;
    
    const note = this.sequence[this.noteIndex % this.sequence.length];
    
    // Jouer la note mélodique (Onde carrée = son 8-bit classique)
    if (note !== 0) {
      this.playOscillator(note, time, 'square', 0.1, 0.05);
      
      // Ajouter une basse sur les temps forts (toutes les 4 notes)
      if (this.noteIndex % 4 === 0) {
        this.playOscillator(note - 24, time, 'triangle', 0.2, 0.08); // Octave inférieure
      }
    }
    
    this.noteIndex++;
  }

  private playOscillator(midiNote: number, time: number, type: OscillatorType, duration: number, vol: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    osc.frequency.setValueAtTime(freq, time);

    // Enveloppe sonore percussive (Attaque rapide, déclin exponentiel)
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }
}