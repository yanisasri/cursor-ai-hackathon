let sharedContext: AudioContext | null = null;

/** Short ding-dong doorbell via Web Audio — no asset file needed. */
export function playDoorbellSound(): void {
  try {
    sharedContext = sharedContext ?? new AudioContext();
    const ctx = sharedContext;
    void ctx.resume();

    const now = ctx.currentTime;
    const playTone = (frequency: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.05);
    };

    playTone(880, now, 0.22);
    playTone(659.25, now + 0.26, 0.38);
  } catch {
    /* audio unavailable */
  }
}
