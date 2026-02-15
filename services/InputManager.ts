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
  }

  private onMIDIFailure = () => {
      console.warn("Could not access your MIDI devices.");
  }

  private onMIDIMessage = (message: any) => {
      const [command, note, velocity] = message.data;
      const channel = command & 0xf; // 0-15
      const type = command & 0xf0;

      // Gestion Encodeurs Infinis (Relatif)
      // Incrément (< 64) vs Décrément (> 64)
      const SENSITIVITY = 0.3; // Impulsion par tick
      
      const updateAxis = (current: number, val: number, invert: boolean = false) => {
          // Si val < 64 (0-63) -> Incrément (CW)
          // Si val >= 64 (64-127) -> Décrément (CCW)
          const isInc = val < 64;
          const delta = isInc ? 1 : -1;
          
          // Si invert est true, Incrément diminue la valeur
          const finalDelta = invert ? -delta : delta;
          
          let next = current + finalDelta * SENSITIVITY;
          // Clamp
          if (next > 1) next = 1;
          if (next < -1) next = -1;
          return next;
      };

      // --- CHANNEL 1 (0): LE CHIEN ---
      if (channel === 0) {
          if (type === 176) {
              // CC 48: Horizontal (Inc = Droite -> +X)
              if (note === 48) this.midiState.dog.x = updateAxis(this.midiState.dog.x, velocity, false);
              // CC 49: Vertical (Inc = Haut -> -Y)
              if (note === 49) this.midiState.dog.y = updateAxis(this.midiState.dog.y, velocity, true);
          }
      } 
      // --- CHANNEL 2 (1): TCHIPEUR ---
      else if (channel === 1) { 
          if (type === 176) {
              // CC 48: Horizontal
              if (note === 48) this.midiState.player.x = updateAxis(this.midiState.player.x, velocity, false);
              // CC 49: Vertical (Inc = Haut -> -Y)
              if (note === 49) this.midiState.player.y = updateAxis(this.midiState.player.y, velocity, true);
          }
          // Note On / Off
          if (type === 144) {
              const pressed = velocity > 0;
              // Bouton Blanc (Note 2 / D-1) -> Tag
              if (note === 2) this.midiState.player.tag = pressed;
              // Bouton Noir (Note 3 / D#-1) -> Boost
              if (note === 3) this.midiState.player.boost = pressed;
              // Switch (Note 1) -> Non assigné ou Teleport ?
              if (note === 1) this.midiState.player.teleport = pressed;
          }
          if (type === 128) {
              if (note === 2) this.midiState.player.tag = false;
              if (note === 3) this.midiState.player.boost = false;
              if (note === 1) this.midiState.player.teleport = false;
          }
      }
      // --- CHANNEL 3 (2): LE VIEUX ---
      else if (channel === 2) {
          if (type === 176) {
              // CC 48: Horizontal
              if (note === 48) this.midiState.oldMan.x = updateAxis(this.midiState.oldMan.x, velocity, false);
              // CC 49: Vertical (Inc = Haut -> -Y)
              if (note === 49) this.midiState.oldMan.y = updateAxis(this.midiState.oldMan.y, velocity, true);
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

    // Decay MIDI Axes (Simulation inertie pour contrôleurs infinis)
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
      }
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