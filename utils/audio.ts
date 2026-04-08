import * as Tone from 'tone';
import { SCALE } from '../constants';

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private compressor: Tone.Compressor | null = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;

    await Tone.start();

    // Compression to glue sounds together
    this.compressor = new Tone.Compressor({
      threshold: -15,
      ratio: 4,
      attack: 0.01,
      release: 0.1
    }).toDestination();

    // Reverb for atmosphere
    this.reverb = new Tone.Reverb({
      decay: 2.5,
      preDelay: 0.01,
      wet: 0.3
    }).connect(this.compressor);

    await this.reverb.generate();

    // PolySynth for the notes
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' }, // Soft, woody tone
      envelope: { 
        attack: 0.005, 
        decay: 0.2, 
        sustain: 0.1, 
        release: 1.2 
      },
      volume: -5 
    }).connect(this.reverb);

    // Limit polyphony to avoid performance issues
    this.synth.maxPolyphony = 16;
    
    this.isReady = true;
  }

  trigger(velocity: number) {
    if (!this.synth || !this.isReady) return;

    // Map velocity to volume dynamics
    // Velocity roughly ranges from 1.5 (threshold) to ~10 (hard drop)
    // Tone.triggerAttackRelease velocity arg is 0-1
    const normalizedVel = Math.min(Math.max((velocity - 1.5) / 10, 0.1), 1);
    
    const note = SCALE[Math.floor(Math.random() * SCALE.length)];
    
    // Slight randomization of duration based on velocity
    const duration = normalizedVel > 0.5 ? '4n' : '8n';

    this.synth.triggerAttackRelease(note, duration, undefined, normalizedVel);
  }

  ready() {
    return this.isReady;
  }
}

export const audioEngine = new AudioEngine();