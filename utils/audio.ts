import * as Tone from 'tone';
import { SCALES } from '../constants';

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private duoSynth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private compressor: Tone.Compressor | null = null;
  private isReady = false;
  private currentScale: string[] = SCALES.PENTATONIC;

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
      decay: 4.0,
      preDelay: 0.01,
      wet: 0.4
    }).connect(this.compressor);

    await this.reverb.generate();

    // PolySynth for normal notes (Boxes/Spheres)
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { 
        attack: 0.005, 
        decay: 0.3, 
        sustain: 0.1, 
        release: 1.5 
      },
      volume: -8 
    }).connect(this.reverb);
    this.synth.maxPolyphony = 16;
    
    // DuoSynth for heavier impacts
    this.duoSynth = new Tone.PolySynth(Tone.DuoSynth, {
      voice0: { oscillator: { type: 'square' }, volume: -15 },
      voice1: { oscillator: { type: 'sine' }, volume: -15 },
      volume: -10
    }).connect(this.reverb);
    this.duoSynth.maxPolyphony = 8;
    
    this.isReady = true;
  }

  setScale(scaleName: keyof typeof SCALES) {
    this.currentScale = SCALES[scaleName] || SCALES.PENTATONIC;
  }

  trigger(velocity: number, type: 'light' | 'heavy' = 'light') {
    if (!this.synth || !this.duoSynth || !this.isReady) return;

    // Map velocity to volume dynamics
    const normalizedVel = Math.min(Math.max((velocity - 0.5) / 10, 0.1), 1);
    const note = this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
    const duration = normalizedVel > 0.5 ? '4n' : '8n';

    if (type === 'heavy' && velocity > 2.0) {
        this.duoSynth.triggerAttackRelease(note, duration, undefined, normalizedVel * 0.8);
    } else {
        this.synth.triggerAttackRelease(note, duration, undefined, normalizedVel);
    }
  }

  ready() {
    return this.isReady;
  }
}

export const audioEngine = new AudioEngine();