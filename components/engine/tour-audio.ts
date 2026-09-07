/** Local narration only: decoded in the browser, never uploaded. */
export class TourAudio {
  private context = new AudioContext();
  private destination = this.context.createMediaStreamDestination();
  private source: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private startedAt = 0;
  private offset = 0;
  private generation = 0;
  async load(file: File) {
    const request = ++this.generation;
    const buffer = await this.context.decodeAudioData(await file.arrayBuffer());
    if (request !== this.generation) return null;
    this.pause();
    this.buffer = buffer;
    return buffer.duration;
  }
  resume() {
    return this.context.resume();
  }
  recordingTrack() {
    return this.destination.stream.getAudioTracks()[0].clone();
  }
  sync(seconds: number, playing: boolean) {
    if (!playing || !this.buffer || seconds >= this.buffer.duration) {
      this.pause();
      return;
    }
    if (
      this.source &&
      Math.abs(
        this.offset + this.context.currentTime - this.startedAt - seconds,
      ) < 0.3
    )
      return;
    this.pause();
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.context.destination);
    source.connect(this.destination);
    this.startedAt = this.context.currentTime;
    this.offset = Math.max(0, seconds);
    this.source = source;
    source.onended = () => {
      if (this.source === source) this.source = null;
      source.disconnect();
    };
    source.start(0, this.offset);
  }
  pause() {
    const source = this.source;
    this.source = null;
    if (source) {
      source.stop();
      source.disconnect();
    }
  }
  clear() {
    ++this.generation;
    this.pause();
    this.buffer = null;
  }
  dispose() {
    this.clear();
    this.destination.stream.getTracks().forEach((t) => t.stop());
    void this.context.close();
  }
}
