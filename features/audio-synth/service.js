/**
 * Procedural Audio Synthesizer & Dynamic Synthwave BGM Engine
 * Generates both dynamic SFX and reactive dual-realm background music in real-time.
 */
export class AudioSynthService {
  constructor() {
    this.ctx = null;
    this.bus = null;
    this.isMuted = false;
    this.currentRealm = 'ALPHA';

    // BGM Sequencer State
    this.bgmTimer = null;
    this.step = 0;
    this.tempo = 124; // 124 BPM Synthwave groove
    this.nextNoteTime = 0;
    this.masterGain = null;
  }

  init(context) {
    this.bus = context.bus;

    const unlockAudio = () => {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.ctx && !this.bgmTimer) {
        this.startBgm();
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    this.bus.on('audio:play', (soundName) => this.play(soundName));
    this.bus.on('audio:toggle_mute', () => {
      this.isMuted = !this.isMuted;
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      }
    });

    this.bus.on('dimension:changed', ({ current }) => {
      this.currentRealm = current;
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.bus.emit('audio:toggle_mute');
      }
    });
  }

  startBgm() {
    if (!this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;

    // Scheduler tick running at 25ms
    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
        this.scheduleBgmStep(this.step, this.nextNoteTime);
        const secondsPer16th = (60 / this.tempo) / 4;
        this.nextNoteTime += secondsPer16th;
        this.step = (this.step + 1) % 16;
      }
    }, 25);
  }

  scheduleBgmStep(step, time) {
    if (!this.ctx || this.isMuted) return;

    // Chords and notes: Alpha is Warm Cyber Gold (A, F#m, D, E), Omega is Dark Cyber Void (Dm, Bb, Gm, A)
    const alphaBassNotes = [110, 110, 164.8, 110, 146.8, 146.8, 220, 146.8, 185, 185, 277.2, 185, 164.8, 164.8, 246.9, 164.8];
    const omegaBassNotes = [146.8, 146.8, 220, 146.8, 116.5, 116.5, 174.6, 116.5, 98.0, 98.0, 146.8, 98.0, 110, 110, 164.8, 110];

    const freq = (this.currentRealm === 'ALPHA') ? alphaBassNotes[step] : omegaBassNotes[step];

    // Synthwave 16th-note plucky bass
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = (this.currentRealm === 'ALPHA') ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime((this.currentRealm === 'ALPHA') ? 1200 : 700, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + 0.11);

    gain.gain.setValueAtTime(0.065, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.12);

    // Subtle Kick on beats 0, 4, 8, 12
    if (step % 4 === 0) {
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kick.type = 'sine';
      kick.frequency.setValueAtTime(130, time);
      kick.frequency.exponentialRampToValueAtTime(35, time + 0.08);

      kickGain.gain.setValueAtTime(0.12, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      kick.connect(kickGain);
      kickGain.connect(this.masterGain || this.ctx.destination);
      kick.start(time);
      kick.stop(time + 0.1);
    }
  }

  play(soundName) {
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const dest = this.masterGain || this.ctx.destination;

    switch (soundName) {
      case 'jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(480, t + 0.12);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.13);
        break;
      }

      case 'shift': {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(580, t + 0.18);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(3200, t + 0.18);

        gain.gain.setValueAtTime(0.14, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + 0.19);
        break;
      }

      case 'shard': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, t);
        osc.frequency.setValueAtTime(880.00, t + 0.08);
        osc.frequency.setValueAtTime(1174.66, t + 0.15);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.36);
        break;
      }

      case 'checkpoint': {
        const notes = [440, 554.37, 659.25, 880]; // A C# E A
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);

          gain.gain.setValueAtTime(0.15, t + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.3);

          osc.connect(gain);
          gain.connect(dest);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.32);
        });
        break;
      }

      case 'boost': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.25);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.29);
        break;
      }

      case 'death': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.28);

        gain.gain.setValueAtTime(0.16, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.31);
        break;
      }

      case 'victory': {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.12);

          gain.gain.setValueAtTime(0.15, t + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.4);

          osc.connect(gain);
          gain.connect(dest);
          osc.start(t + idx * 0.12);
          osc.stop(t + idx * 0.12 + 0.45);
        });
        break;
      }
    }
  }

  update() {}
}

export default new AudioSynthService();
