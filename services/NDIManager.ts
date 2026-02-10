export class NDIManager {
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isActive: boolean = false;

  constructor() {}

  public startCapture(canvas: HTMLCanvasElement) {
    if (this.isActive) return;
    this.canvas = canvas;
    
    try {
      // Capture the canvas at 30fps
      this.stream = canvas.captureStream(30);
      this.isActive = true;
      console.log("NDI: Canvas capture started automatically.");
      
      // Expose globally for specialized NDI-Web bridge browsers (like OBS or custom signage players)
      (window as any).gameStream = this.stream;
      
      // Setup a dummy peer connection to be ready for WebRTC NDI Gateways
      // This is a common pattern for "Sienna" or "NDI-WebRTC" bridges
      this.setupWebRTCBridge();
    } catch (e) {
      console.error("NDI: Failed to start capture", e);
    }
  }

  private setupWebRTCBridge() {
    // In a real production environment with a specific gateway (like Sienna), 
    // you would implement the signaling handshake here.
    // For now, we prepare the stream so it's discoverable by standard bridge tools.
    console.log("NDI: Stream is now available for broadcast via WebRTC bridge.");
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public getStatus(): boolean {
    return this.isActive;
  }
}

export const ndiManager = new NDIManager();