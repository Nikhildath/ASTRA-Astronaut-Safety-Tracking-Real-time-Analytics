/**
 * All game audio is synthesised with the WebAudio API so the game ships without
 * any sound asset downloads. The context is created lazily on the first user
 * gesture (the "Launch" button), which satisfies browser autoplay policies.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineOscs: OscillatorNode[] = [];
  private noise: AudioBuffer | null = null;

  unlock() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      this.master = master;

      const len = Math.floor(ctx.sampleRate * 1.5);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  startEngine() {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.engineGain) return;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.value = 0.0001;

    filter.connect(gain);
    gain.connect(this.master);

    const freqs = [46, 68, 92];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = f === 46 ? 'sawtooth' : 'triangle';
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start();
      this.engineOscs.push(osc);
    }

    this.engineFilter = filter;
    this.engineGain = gain;
  }

  setThrottle(throttle: number) {
    const ctx = this.ctx;
    if (!ctx || !this.engineGain || !this.engineFilter) return;
    const t = ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, throttle));
    this.engineGain.gain.setTargetAtTime(0.055 + clamped * 0.11, t, 0.12);
    this.engineFilter.frequency.setTargetAtTime(320 + clamped * 900, t, 0.15);
    this.engineOscs.forEach((osc, i) => {
      const base = [46, 68, 92][i] ?? 46;
      osc.frequency.setTargetAtTime(base * (1 + clamped * 0.55), t, 0.15);
    });
  }

  stopEngine() {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
    }
    this.engineOscs.forEach(osc => {
      try {
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        /* already stopped */
      }
    });
    this.engineOscs = [];
    this.engineGain = null;
    this.engineFilter = null;
  }

  private noiseBurst(
    duration: number,
    startFreq: number,
    endFreq: number,
    volume: number,
    type: BiquadFilterType = 'lowpass',
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(startFreq, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    src.stop(ctx.currentTime + duration + 0.05);
  }

  private tone(
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  laser() {
    this.tone('square', 1400, 260, 0.16, 0.1);
    this.noiseBurst(0.08, 4200, 900, 0.05, 'highpass');
  }

  enemyLaser() {
    this.tone('sawtooth', 760, 160, 0.2, 0.06);
  }

  explosion(big = false) {
    this.noiseBurst(big ? 1.4 : 0.8, big ? 1600 : 2200, 90, big ? 0.6 : 0.32);
    this.tone('sine', big ? 120 : 180, 32, big ? 0.9 : 0.5, big ? 0.45 : 0.22);
  }

  hit() {
    this.noiseBurst(0.24, 900, 160, 0.22);
    this.tone('triangle', 220, 90, 0.2, 0.12);
  }

  /** Dry crack when one of the player's bolts lands on a raider. */
  hitEnemy() {
    this.noiseBurst(0.09, 5200, 1400, 0.09, 'bandpass');
    this.tone('square', 900, 320, 0.07, 0.05);
  }

  /** Bright two-note chime for a collected coin; `step` raises the pitch in a chain. */
  coin(step = 0) {
    const base = 660 * Math.pow(2, Math.min(12, step) / 12);
    this.tone('triangle', base, base, 0.09, 0.09);
    this.tone('triangle', base * 1.5, base * 1.5, 0.12, 0.05);
  }

  warp() {
    this.tone('sine', 120, 900, 0.45, 0.13);
    this.tone('triangle', 300, 1500, 0.35, 0.06);
  }

  gameOver() {
    this.tone('sine', 220, 60, 1.4, 0.3);
    this.noiseBurst(1.6, 800, 60, 0.25);
  }
}
