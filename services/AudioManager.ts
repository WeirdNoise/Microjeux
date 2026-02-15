
type TrackName = 'intro' | 'game' | 'win' | 'lose';

export class AudioManager {
  private tracks: Record<TrackName, HTMLAudioElement>;
  private currentTrack: HTMLAudioElement | null = null;

  constructor() {
    this.tracks = {
        intro: new Audio('/sounds/MusiqueIntro.mp3'),
        game: new Audio('/sounds/MusiqueDuJeu.mp3'),
        win: new Audio('/sounds/YouWin.mp3'),
        lose: new Audio('/sounds/YouLoose.mp3')
    };

    // Configuration des boucles
    this.tracks.intro.loop = true;
    this.tracks.game.loop = true;
    this.tracks.win.loop = false;  // Jingle une seule fois
    this.tracks.lose.loop = false; // Jingle une seule fois

    // Configuration globale
    Object.values(this.tracks).forEach(track => {
        track.volume = 0.5;
        track.preload = 'auto';
        track.addEventListener('error', (e) => {
             console.warn(`[AudioManager] Fichier manquant ou erreur : ${track.src}`);
        });
    });
  }

  /**
   * Lance la piste demandée en gérant les transitions.
   */
  public play(trackName: TrackName) {
      const newTrack = this.tracks[trackName];
      
      // Si c'est déjà la piste en cours de lecture, on ne fait rien
      if (this.currentTrack === newTrack && !newTrack.paused) return;

      this.stop(); // Arrête la piste précédente

      this.currentTrack = newTrack;
      this.currentTrack.currentTime = 0;
      
      const playPromise = this.currentTrack.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.warn("[AudioManager] Autoplay bloqué ou fichier manquant.", error);
          });
      }
  }

  /**
   * Arrête la musique en cours.
   */
  public stop() {
    if (this.currentTrack) {
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
        this.currentTrack = null;
    }
  }

  /**
   * Ajuste le volume dynamiquement.
   */
  public setVolume(volume: number) {
    Object.values(this.tracks).forEach(track => {
        track.volume = Math.max(0, Math.min(1, volume));
    });
  }
}
