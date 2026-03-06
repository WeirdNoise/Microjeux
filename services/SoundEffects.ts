
export class SoundEffects {
  private boostAudio: HTMLAudioElement;
  private successAudio: HTMLAudioElement;
  private sprayAudio: HTMLAudioElement;
  private pipiAudio: HTMLAudioElement;
  private slowZoneAudio: HTMLAudioElement;
  
  private dogAudios: HTMLAudioElement[] = [];
  private oldManAudios: HTMLAudioElement[] = [];

  private dogFiles = ['/sounds/Aboiement1.mp3', '/sounds/Aboiement2.mp3'];
  private oldManFiles = ['/sounds/VieuxGueule.mp3', '/sounds/VieuxRale.mp3', '/sounds/VieuxGueule2.mp3'];

  constructor() {
    // Pre-load constant sounds
    this.boostAudio = this.createAudio('/sounds/CoursVite.mp3', 0.8, true);
    this.successAudio = this.createAudio('/sounds/BaliseOk.mp3', 0.6);
    this.sprayAudio = this.createAudio('/sounds/Tchip2.mp3', 0.6);
    this.pipiAudio = this.createAudio('/sounds/ChienPipi.mp3', 0.7);
    this.slowZoneAudio = this.createAudio('/sounds/VieuxRalenti.mp3', 0.7);

    // Pre-load random banks
    this.dogAudios = this.dogFiles.map(f => this.createAudio(f, 0.8));
    this.oldManAudios = this.oldManFiles.map(f => this.createAudio(f, 0.8));
  }

  private createAudio(src: string, volume: number, loop: boolean = false): HTMLAudioElement {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = loop;
    audio.preload = 'auto'; // Hint to browser to load ASAP
    return audio;
  }

  public async resume() {
    // No-op for HTMLAudioElement, but kept for interface
  }

  public setBoostState(isBoosting: boolean) {
    if (isBoosting) {
        if (this.boostAudio.paused) {
            this.boostAudio.play().catch(() => {});
        }
    } else {
        if (!this.boostAudio.paused) {
            this.boostAudio.pause();
            this.boostAudio.currentTime = 0;
        }
    }
  }

  public playSpray() {
    if (this.sprayAudio.paused) {
        this.sprayAudio.play().catch(() => {});
    }
  }

  public playDogHit() {
    this.playFromBank(this.dogAudios);
  }

  public playOldManHit() {
    this.playFromBank(this.oldManAudios);
  }

  public playSuccess() {
    this.playClone(this.successAudio);
  }

  public playHeartbeat() {
    // Synthetic sound removed
  }

  public playSlowZone() {
    this.playClone(this.slowZoneAudio);
  }

  public playPipi() {
    this.playClone(this.pipiAudio);
  }

  private playClone(audio: HTMLAudioElement) {
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = audio.volume;
    clone.play().catch(() => {});
  }

  private playFromBank(bank: HTMLAudioElement[]) {
    if (bank.length === 0) return;
    const audio = bank[Math.floor(Math.random() * bank.length)];
    this.playClone(audio);
  }
}
