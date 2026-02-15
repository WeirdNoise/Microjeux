import { InputState } from '../types';

export class InputManager {
  private keysPressed: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set(); // Track fresh presses
  
  // MIDI State Storage (Values decay for axes)
  private midiState = {
      player: { x: 0, y: 0, tag: false, boost: false, teleport: false },
      barrier: { x: 0, y: 0, rotate: 0 },
      dog: { x: 0, y: 0 },
      oldMan: { x: 0, y: 0 }
  };

  private prevMidiTag = false; // To detect MIDI note rising edge
  private lastDebugMessage: string = "MIDI: Waiting...";
  
  // Stockage des dernières valeurs CC pour calculer le delta (Direction/Vitesse)
  private lastMidiValues: Map<string, number> = new Map();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.initMidi();
  }

  private initMidi() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(this.onMIDISuccess, this.onMIDIFailure);
    }
  }

  private onMIDISuccess = (midiAccess: any) => {
      const inputs = midiAccess.inputs;
      for (let input of inputs.values()) {
          input.onmidimessage = this.onMIDIMessage;
      }
      midiAccess.onstatechange = (e: any) => {
          if (e.port.type === 'input' && e.port.state === 'connected') {
              e.port.onmidimessage = this.onMIDIMessage;
          }
      };
      console.log("MIDI Connected");
      this.lastDebugMessage = "MIDI: Connected";
  }

  private onMIDIFailure = () => {
      console.warn("Could not access your MIDI devices.");
      this.lastDebugMessage = "MIDI: Access Failed";
  }

  private onMIDIMessage = (message: any) => {
      const [command, note, velocity] = message.data;
      const channel = command & 0xf; // 0-15
      const type = command & 0xf0;

      this.lastDebugMessage = `CH:${channel + 1} | CMD:${type} | NOTE:${note} | VAL:${velocity}`;

      // --- LOGIQUE DELTA (Potentiomètres Infinis) ---
      // On compare la valeur actuelle avec la précédente pour déterminer la direction
      const SENSITIVITY = 0.25; // Sensibilité de l'impulsion par tick

      const processDelta = (ch: number, cc: number, val: number): number => {
          const key = `${ch}_${cc}`;
          if (!this.lastMidiValues.has(key)) {
              this.lastMidiValues.set(key, val);
              return 0;
          }
          const prev = this.lastMidiValues.get(key)!;
          let delta = val - prev;

          // Gestion du passage 127 <-> 0 (Boucle)
          if (delta < -64) delta += 128; // 127 -> 0 : Delta -127 devient +1
          else if (delta > 64) delta -= 128; // 0 -> 127 : Delta +127 devient -1

          this.lastMidiValues.set(key, val);
          return delta;
      };

      const updateAxis = (current: number, delta: number, invert: boolean = false) => {
          if (delta === 0) return current;
          const d = invert ? -delta : delta;
          let next = current + (d * SENSITIVITY);
          // Clamp
          if (next > 1) next = 1;
          if (next < -1) next = -1;
          return next;
      };

      // CC HANDLER
      if (type === 176) {
          // CC 48: Horizontal (X) -> Inc = Droite
          // CC 49: Vertical (Y) -> Inc = Haut (Up)

          if (note === 48) {
              const delta = processDelta(channel, note, velocity);
              if (channel === 0) this.midiState.dog.x = updateAxis(this.midiState.dog.x, delta, false);
              if (channel === 1) this.midiState.player.x = updateAxis(this.midiState.player.x, delta, false);
              if (channel === 2) this.midiState.oldMan.x = updateAxis(this.midiState.oldMan.x, delta, false);
          }
          if (note === 49) {
              const delta = processDelta(channel, note, velocity);
              // Invert=true car Incrément = Haut (-Y)
              if (channel === 0) this.midiState.dog.y = updateAxis(this.midiState.dog.y, delta, true);
              if (channel === 1) this.midiState.player.y = updateAxis(this.midiState.player.y, delta, true);
              if (channel === 2) this.midiState.oldMan.y = updateAxis(this.midiState.oldMan.y, delta, true);
          }
      }

      // NOTE HANDLER (Boutons Arcade)
      // Channel 2 (1) = Tchipeur
      if (channel === 1) { 
          if (type === 144) { // Note On
              const pressed = velocity > 0;
              if (note === 2) this.midiState.player.tag = pressed; // Btn Blanc
              if (note === 3) this.midiState.player.boost = pressed; // Btn Noir
              if (note === 1) this.midiState.player.teleport = pressed; // Switch ?
          }
          if (type === 128) { // Note Off
              if (note === 2) this.midiState.player.tag = false;
              if (note === 3) this.midiState.player.boost = false;
              if (note === 1) this.midiState.player.teleport = false;
          }
      }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed.add(e.code);
    if (!e.repeat) {
        this.keysJustPressed.add(e.code);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  public getInput(): InputState {
    let kAxisX = 0;
    let kAxisY = 0;

    if (this.keysPressed.has('ArrowLeft')) kAxisX -= 1;
    if (this.keysPressed.has('ArrowRight')) kAxisX += 1;
    if (this.keysPressed.has('ArrowUp')) kAxisY -= 1;
    if (this.keysPressed.has('ArrowDown')) kAxisY += 1;

    if (kAxisX !== 0 && kAxisY !== 0) {
        const length = Math.sqrt(kAxisX * kAxisX + kAxisY * kAxisY);
        kAxisX /= length;
        kAxisY /= length;
    }

    // Decay MIDI Axes (Simulation inertie)
    // On conserve un decay rapide pour que ça s'arrête si on arrête de tourner
    const DECAY = 0.92;
    const cleanAxis = (val: number) => Math.abs(val) < 0.05 ? 0 : val * DECAY;

    this.midiState.player.x = cleanAxis(this.midiState.player.x);
    this.midiState.player.y = cleanAxis(this.midiState.player.y);
    this.midiState.dog.x = cleanAxis(this.midiState.dog.x);
    this.midiState.dog.y = cleanAxis(this.midiState.dog.y);
    this.midiState.oldMan.x = cleanAxis(this.midiState.oldMan.x);
    this.midiState.oldMan.y = cleanAxis(this.midiState.oldMan.y);

    const finalPlayerX = Math.abs(this.midiState.player.x) > 0.1 ? this.midiState.player.x : kAxisX;
    const finalPlayerY = Math.abs(this.midiState.player.y) > 0.1 ? this.midiState.player.y : kAxisY;

    // Detect Rising Edge for MIDI Tag
    const midiTagTrigger = this.midiState.player.tag && !this.prevMidiTag;
    this.prevMidiTag = this.midiState.player.tag;

    const inputState: InputState = {
      axisX: finalPlayerX,
      axisY: finalPlayerY,
      actionPrimary: this.keysPressed.has('Space') || this.midiState.player.tag, // Held
      actionPrimaryTrigger: this.keysJustPressed.has('Space') || midiTagTrigger, // Just Pressed (Spam)
      actionSecondary: this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight') || this.midiState.player.boost,
      actionTertiary: this.keysPressed.has('KeyZ') || this.midiState.player.teleport,
      actionCancel: this.keysPressed.has('KeyA'),
      
      enemies: {
          barrier: {
              axisX: this.midiState.barrier.x,
              axisY: this.midiState.barrier.y,
              action1: Math.abs(this.midiState.barrier.rotate) > 0.1
          },
          dog: {
              axisX: this.midiState.dog.x,
              axisY: this.midiState.dog.y
          },
          oldMan: {
              axisX: this.midiState.oldMan.x,
              axisY: this.midiState.oldMan.y
          }
      },
      debugMidi: this.lastDebugMessage
    };

    // Clear "Just Pressed" keys for next frame
    this.keysJustPressed.clear();

    return inputState;
  }

  public cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}