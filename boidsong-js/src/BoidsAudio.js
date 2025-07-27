// Spatial audio engine for boid sonification
// Uses Web Audio API with 3D panning for each boid

import { cMinorNotes } from "./notes.js";

export class AudioEngine {
  constructor(numBoids = 16) {
    this.audioContext = null;
    this.masterGain = null;
    this.boidOscillators = [];
    this.numBoids = numBoids;
    this.isStarted = false;

    // Convert cMinorNotes to frequencies
    this.noteFrequencies = this.getFrequenciesFromNotes(cMinorNotes);
  }

  async start() {
    if (this.isStarted) return;

    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Create master gain for overall volume control
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.1; // Low volume to prevent overwhelming
    this.masterGain.connect(this.audioContext.destination);

    // Set up audio listener position (listener at origin)
    if (this.audioContext.listener.setPosition) {
      this.audioContext.listener.setPosition(0, 0, 0);
    }
    if (this.audioContext.listener.setOrientation) {
      this.audioContext.listener.setOrientation(0, 0, -1, 0, 1, 0);
    }

    // Create oscillators and panners for each boid
    for (let i = 0; i < this.numBoids; i++) {
      const boidOsc = this.createBoidOscillator(i);
      this.boidOscillators.push(boidOsc);
    }

    this.isStarted = true;
    console.log(`Audio engine started with ${this.numBoids} boid oscillators`);
  }

  createBoidOscillator(index) {
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = "sine";

    // Assign frequency from cMinorNotes, cycling through available frequencies
    const frequencyIndex = index % this.noteFrequencies.length;
    const frequency = this.noteFrequencies[frequencyIndex];
    oscillator.frequency.value = frequency;

    // Create 3D panner
    const panner = this.audioContext.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 10;
    panner.maxDistance = 1000;
    panner.rolloffFactor = 4; // Increased rolloff for more pronounced attenuation
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 1;

    // Create gain for individual boid volume
    const gain = this.audioContext.createGain();
    // Normalize gain so all oscillators together add up to 1
    gain.gain.value = 1.0 / this.numBoids;

    // Connect audio graph: oscillator -> panner -> gain -> master
    oscillator.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);

    // Start oscillator
    oscillator.start();

    return {
      oscillator,
      panner,
      gain,
      frequency,
      index,
    };
  }

  updateBoidPosition(boidIndex, x, y, z) {
    if (!this.isStarted || boidIndex >= this.boidOscillators.length) return;

    const boidOsc = this.boidOscillators[boidIndex];
    if (!boidOsc) return;

    // Scale positions to reasonable audio space (listener at 0,0,0)
    const scale = 0.1; // Increased scale for more pronounced spatialization
    const audioX = x * scale;
    const audioY = y * scale;
    const audioZ = z * scale;

    // Update panner position
    boidOsc.panner.setPosition(audioX, audioY, audioZ);
  }

  setBoidActive(boidIndex, active) {
    if (!this.isStarted || boidIndex >= this.boidOscillators.length) return;

    const boidOsc = this.boidOscillators[boidIndex];
    if (!boidOsc) return;

    // Note: Active state no longer affects volume, only visual behavior
    // Volume is normalized based on total number of oscillators
    // Individual gain is already set to 1/numBoids, so no changes needed here
  }

  dispose() {
    if (!this.audioContext) return;

    // Stop and disconnect all oscillators
    this.boidOscillators.forEach((boidOsc) => {
      try {
        boidOsc.oscillator.stop();
        boidOsc.oscillator.disconnect();
        boidOsc.panner.disconnect();
        boidOsc.gain.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });

    this.boidOscillators = [];

    if (this.masterGain) {
      this.masterGain.disconnect();
    }

    if (this.audioContext.state !== "closed") {
      this.audioContext.close();
    }

    this.isStarted = false;
  }

  // Convert note strings (like "C2", "D#2") to frequencies
  getFrequenciesFromNotes(noteStrings) {
    const noteToFrequency = {
      C2: 65.41,
      "C#2": 69.3,
      "D♭2": 69.3,
      D2: 73.42,
      "D#2": 77.78,
      "E♭2": 77.78,
      E2: 82.41,
      F2: 87.31,
      "F#2": 92.5,
      "G♭2": 92.5,
      G2: 98.0,
      "G#2": 103.83,
      "A♭2": 103.83,
      A2: 110.0,
      "A#2": 116.54,
      "B♭2": 116.54,
      B2: 123.47,
    };

    return noteStrings.map((noteString) => {
      const frequency = noteToFrequency[noteString];
      if (!frequency) {
        console.warn(`Unknown note: ${noteString}, using C2`);
        return 65.41;
      }
      // Move up 2 octaves for more audible range (multiply by 4)
      return frequency * 4;
    });
  }
}
