import { InputState } from '../types';

export class InputManager {
  private keysPressed: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set(); // Track fresh presses
  
  // MIDI State Storage
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
      const channel = command & 0xf;
      const type = command & 0xf0;

      const normalizeCC = (val: number) => {
          if (val > 58 && val < 70) return 0;
          return (val - 64) / 64;
      };

      if (channel === 0) { // TCHIPEUR
          if (type === 176) {
              if (note === 1) this.midiState.player.x = normalizeCC(velocity);
              if (note === 2) this.midiState.player.y = normalizeCC(velocity);
          }
          if (type === 144) {
              if (note === 60) this.midiState.player.tag = velocity > 0;
              if (note === 62) this.midiState.player.boost = velocity > 0;
              if (note === 64) this.midiState.player.teleport = velocity > 0;
          }
          if (type === 128) {
             if (note === 60) this.midiState.player.tag = false;
             if (note === 62) this.midiState.player.boost = false;
             if (note === 64) this.midiState.player.teleport = false;
          }
      } 
      else if (channel === 1) { // BARRIER
          if (type === 176) {
              if (note === 1) this.midiState.barrier.x = normalizeCC(velocity);
              if (note === 2) this.midiState.barrier.y = normalizeCC(velocity);
              if (note === 3) this.midiState.barrier.rotate = normalizeCC(velocity);
          }
      }
      else if (channel === 2) { // DOG
          if (type === 176) {
              if (note === 1) this.midiState.dog.x = normalizeCC(velocity);
              if (note === 2) this.midiState.dog.y = normalizeCC(velocity);
          }
      }
      else if (channel === 3) { // OLD MAN
          if (type === 176) {
              if (note === 1) this.midiState.oldMan.x = normalizeCC(velocity);
              if (note === 2) this.midiState.oldMan.y = normalizeCC(velocity);
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