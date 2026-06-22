/**
 * Synthesizes Minecraft-inspired retro low-bit sound effects using Web Audio API. 
 * This avoids any external asset loading delays and provides zero-latency feedback.
 */

class MinecraftSoundEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private musicIntervalId: any = null;

  constructor() {
    // Lazy initialize on first interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime); // 30% master volume default
      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported in this browser.', e);
    }
  }

  public setVolume(val: number) {
    this.initContext();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.linearRampToValueAtTime(val, this.ctx.currentTime + 0.05);
    }
  }

  public toggleSound(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public toggleMusic(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Play a block breaking sound based on material type
   */
  public playBreak(material: 'dirt' | 'stone' | 'wood' | 'glass' | 'sand' | 'water') {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterVolume) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    switch (material) {
      case 'dirt': {
        // low muff noise + low synth thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + 0.16);

        // Noise crackle
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterVolume);
        noise.start(now);
        noise.stop(now + 0.12);
        break;
      }
      case 'sand': {
        // Shshsh sound
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(350, now);
        filter.Q.setValueAtTime(2.0, now);

        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterVolume);
        noise.start(now);
        noise.stop(now + 0.2);
        break;
      }
      case 'stone': {
        // High impact sharp noise with bandpass filter
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + 0.21);

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        noiseGain.gain.setValueAtTime(0.7, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterVolume);
        noise.start(now);
        noise.stop(now + 0.18);
        break;
      }
      case 'wood': {
        // Deep hollow wood knock
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(90, now);
        osc2.frequency.exponentialRampToValueAtTime(45, now + 0.22);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.24);
        osc2.stop(now + 0.24);
        break;
      }
      case 'glass': {
        // High pitch chimes!
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1800, now);
        osc1.frequency.linearRampToValueAtTime(1200, now + 0.25);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2400, now);
        osc2.frequency.linearRampToValueAtTime(1600, now + 0.25);

        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(3200, now);
        osc3.frequency.linearRampToValueAtTime(2000, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        osc3.connect(gain);
        gain.connect(this.masterVolume);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
        osc3.stop(now + 0.3);
        break;
      }
      case 'water': {
         // Soft bubbly white noise splash
         const noise = this.ctx.createBufferSource();
         noise.buffer = this.createNoiseBuffer();
         const noiseGain = this.ctx.createGain();
         const filter = this.ctx.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.setValueAtTime(1200, now);
         filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
 
         noiseGain.gain.setValueAtTime(0.5, now);
         noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
 
         noise.connect(filter);
         filter.connect(noiseGain);
         noiseGain.connect(this.masterVolume);
         noise.start(now);
         noise.stop(now + 0.36);

         // Sub-bloop
         const osc = this.ctx.createOscillator();
         const oscGain = this.ctx.createGain();
         osc.type = 'sine';
         osc.frequency.setValueAtTime(120, now);
         osc.frequency.exponentialRampToValueAtTime(450, now + 0.18); // sweep up for bubble
         oscGain.gain.setValueAtTime(0.2, now);
         oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
         osc.connect(oscGain);
         oscGain.connect(this.masterVolume);
         osc.start(now);
         osc.stop(now + 0.2);
         break;
      }
    }
  }

  /**
   * Play simple block place sound (usually shorter/lighter breaking sound)
   */
  public playPlace(material: 'dirt' | 'stone' | 'wood' | 'glass' | 'sand' | 'water') {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterVolume) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    // Create a softer audio cascade
    const placeVolume = this.ctx.createGain();
    placeVolume.gain.setValueAtTime(0.5, now); // soft
    placeVolume.connect(this.masterVolume);

    switch (material) {
      case 'dirt': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(placeVolume);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'stone': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(placeVolume);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'wood': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(placeVolume);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }
      case 'glass': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(placeVolume);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }
      case 'sand': {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(placeVolume);
        noise.start(now);
        noise.stop(now + 0.11);
        break;
      }
      case 'water': {
        this.playBreak('water'); // water place is same as splash
        break;
      }
    }
  }

  /**
   * Play selection sound when click inventory
   */
  public playClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterVolume) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.setValueAtTime(1500, now + 0.03); // Quick cute pitch shift

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterVolume);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Footstep sounds
   */
  public playStep(material: 'dirt' | 'stone' | 'wood' | 'sand' | 'water') {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterVolume) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const volumeNode = this.ctx.createGain();
    volumeNode.gain.setValueAtTime(0.12, now); // step volume is quiet
    volumeNode.connect(this.masterVolume);

    if (material === 'water') {
      // Small slush
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(volumeNode);
      osc.start(now);
      osc.stop(now + 0.10);
      return;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    const noiseGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    if (material === 'stone') {
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(1.5, now);
    } else if (material === 'wood') {
      filter.frequency.setValueAtTime(120, now);
      filter.Q.setValueAtTime(1.0, now);
    } else if (material === 'sand') {
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(0.5, now);
    } else {
      filter.frequency.setValueAtTime(250, now); // dirt
      filter.Q.setValueAtTime(0.5, now);
    }

    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(volumeNode);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  /**
   * Ambient Music (Minecraft retro theme!)
   * Play cute calming piano arpeggios deterministically every once in a while.
   */
  private startAmbientMusic() {
    this.stopAmbientMusic(); // clear existing
    this.initContext();

    const playAmbientMelody = () => {
      if (!this.musicEnabled || !this.ctx || !this.masterVolume) return;
      const now = this.ctx.currentTime;

      // Clean calm square or sine sound with a bit of envelope (cute plucky sounds)
      const playPluck = (freq: number, delayX: number, duration: number = 2.0) => {
        if (!this.ctx || !this.masterVolume) return;
        const noteTime = now + delayX;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.09, noteTime + 0.1); // soft rise
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration); // slow fall

        // Beautiful filter to warm up the tone
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1200, noteTime);

        osc.connect(lp);
        lp.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(noteTime);
        osc.stop(noteTime + duration + 0.1);
      };

      // Play a lovely Swedish-style minimal chord arpeggio (C major / G major / Amin / Fmajor style progression)
      // E.g. chord 1: C maj (C4, E4, G4, C5)
      // Chords list
      const progressions = [
        [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5
        [293.66, 349.23, 440.00, 587.33], // D4, F4, A4, D5 (D min)
        [196.00, 246.94, 392.00, 493.88], // G3, B3, G4, B4
        [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4 (A min)
      ];

      const chosenProg = progressions[Math.floor(Math.random() * progressions.length)];
      
      // Play arpeggio
      playPluck(chosenProg[0], 0, 4.0);
      playPluck(chosenProg[1], 0.7, 3.5);
      playPluck(chosenProg[2], 1.4, 3.0);
      playPluck(chosenProg[3], 2.1, 2.5);
      playPluck(chosenProg[2], 2.8, 2.0);
      playPluck(chosenProg[1], 3.5, 2.0);

      const rootFreq = chosenProg[0] * 2.0; // transpose up for simple melody ending
      playPluck(rootFreq, 4.2, 3.0);
    };

    // Trigger immediately
    playAmbientMelody();

    // Trigger random Minecraft-like music arpeggio every 20-30 seconds
    this.musicIntervalId = setInterval(() => {
      if (this.musicEnabled) {
        playAmbientMelody();
      }
    }, 24000);
  }

  private stopAmbientMusic() {
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  public shutdown() {
    this.stopAmbientMusic();
  }
}

export const SoundEngine = new MinecraftSoundEngine();
export default SoundEngine;
