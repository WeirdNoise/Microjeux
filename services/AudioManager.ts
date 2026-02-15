export class AudioManager {
  private music: HTMLAudioElement;
  private isBroken: boolean = false;
  private path: string = '/sounds/MusiqueDuJeu.mp3';

  constructor() {
    // Initialisation de l'élément Audio HTML5
    // C'est préférable à WebAudio API pour le streaming de longs fichiers (BGM)
    this.music = new Audio(this.path);
    
    // Configuration de base
    this.music.loop = true; // La musique tourne en boucle
    this.music.preload = 'auto'; // Préchargement immédiat
    this.music.volume = 0.5; // Volume initial modéré

    // --- ERROR HANDLING ---
    // Si le fichier n'existe pas ou est corrompu, on évite de faire planter l'app
    this.music.addEventListener('error', (e) => {
      console.warn(`[AudioManager] ❌ Erreur critique : Impossible de charger ${this.path}`, e);
      this.isBroken = true;
    });

    // --- DEBUG LOGGING ---
    this.music.addEventListener('canplaythrough', () => {
      console.log(`[AudioManager] ✅ Musique chargée et prête à être jouée.`);
    });
  }

  /**
   * Lance la lecture de la musique.
   * Gère la promesse retournée par .play() pour éviter les erreurs d'Autoplay
   * si l'utilisateur n'a pas encore interagi avec la page.
   */
  public async playMusic() {
    if (this.isBroken) return;

    try {
      // On ne relance pas si ça joue déjà
      if (this.music.paused) {
        const playPromise = this.music.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("[AudioManager] 🎵 Lecture en cours...");
            })
            .catch((error) => {
              // C'est ici qu'on attrape l'erreur "Autoplay policy"
              console.warn("[AudioManager] ⚠️ Autoplay bloqué par le navigateur. En attente d'interaction.", error);
            });
        }
      }
    } catch (err) {
      console.error("[AudioManager] Erreur inattendue lors de la lecture", err);
    }
  }

  /**
   * Arrête la musique et remet la tête de lecture à 0.
   */
  public stop() {
    if (this.isBroken) return;
    this.music.pause();
    this.music.currentTime = 0;
  }

  /**
   * Met en pause sans remettre à 0 (utile pour les menus pause).
   */
  public pause() {
    if (!this.isBroken) {
      this.music.pause();
    }
  }

  /**
   * Ajuste le volume dynamiquement (0.0 à 1.0).
   */
  public setVolume(volume: number) {
    if (this.music) {
      this.music.volume = Math.max(0, Math.min(1, volume));
    }
  }
}