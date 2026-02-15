
export class SoundEffects {
  private boostAudio: HTMLAudioElement;
  private successAudio: HTMLAudioElement;
  
  // Banques de sons aléatoires
  private dogFiles = ['/sounds/Aboiement1.mp3', '/sounds/Aboiement2.mp3'];
  private oldManFiles = ['/sounds/VieuxGueule.mp3', '/sounds/VieuxRale.mp3'];

  constructor() {
    // Son de boost en boucle
    this.boostAudio = new Audio('/sounds/CoursVite.mp3');
    this.boostAudio.loop = true;
    this.boostAudio.volume = 0.8;

    // Son de réussite (tag)
    this.successAudio = new Audio('/sounds/BaliseOk.mp3');
    this.successAudio.volume = 0.6;
  }

  public async resume() {
    // Méthode gardée pour compatibilité interface, peut servir à débloquer l'audio context si nécessaire
  }

  // --- GESTION DU BOOST CONTINU ---
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
    // Son synthétique supprimé comme demandé
  }

  public playDogHit() {
    this.playRandom(this.dogFiles);
  }

  public playOldManHit() {
    this.playRandom(this.oldManFiles);
  }

  public playSuccess() {
    // On clone le noeud pour permettre le chevauchement rapide des sons si plusieurs murs sont validés
    const clone = this.successAudio.cloneNode() as HTMLAudioElement;
    clone.volume = this.successAudio.volume;
    clone.play().catch(() => {});
  }

  public playHeartbeat() {
    // Son synthétique supprimé comme demandé
  }

  private playRandom(files: string[]) {
    if (files.length === 0) return;
    const file = files[Math.floor(Math.random() * files.length)];
    const audio = new Audio(file);
    audio.volume = 0.8;
    audio.play().catch(e => console.warn("Impossible de jouer le son SFX", e));
  }
}
