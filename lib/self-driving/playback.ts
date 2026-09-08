/** One active-time clock for the scene, narration and recorder. */
export class PlaybackClock {
  time = 0;
  playing = false;
  tour = false;
  rate = 1;
  private updatedAt: number | null = null;
  setPlaying(playing: boolean, now: number) {
    this.playing = playing;
    this.updatedAt = now;
  }
  seek(time: number, now: number, maximum: number) {
    this.time = Math.max(
      0,
      Math.min(maximum, Number.isFinite(time) ? time : 0),
    );
    this.updatedAt = now;
  }
  advance(now: number, maximum: number, visible: boolean) {
    const elapsed =
      this.updatedAt === null ? 0 : Math.max(0, (now - this.updatedAt) / 1000);
    this.updatedAt = now;
    // Only visual damping is capped. Audio and video use elapsed active time.
    if (this.playing && visible)
      this.time = Math.min(
        maximum,
        this.time + elapsed * (this.tour ? 1 : this.rate),
      );
    return Math.min(elapsed, 0.08);
  }
}
