// Audio synthesis using Tone.js PolySynth
// Converted from Processing Synth.pde

import * as Tone from "tone";

export class Synth {
  constructor(numberOfVoices = 3) {
    // Create PolySynth with simple sawtooth oscillator
    this.polySynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: numberOfVoices,
      voice: {
        oscillator: {
          type: "sawtooth",
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.6,
          release: 0.4,
        },
      },
    });

    // Create single noise synth for texture
    this.noiseSynth = new Tone.NoiseSynth({
      noise: {
        type: "pink",
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.6,
        release: 0.4,
      },
    });

    // Mix both synths
    this.mainGain = new Tone.Gain(0.5); // Main sawtooth volume
    this.noiseGain = new Tone.Gain(0.005); // Subtle noise volume

    this.polySynth.connect(this.mainGain);
    this.noiseSynth.connect(this.noiseGain);

    // Add some filtering to match Processing version
    this.filter = new Tone.Filter(2000, "lowpass");
    this.mainGain.connect(this.filter);
    this.noiseGain.connect(this.filter);
    this.filter.toDestination();

    // Track notes to handle keyboard repeat
    this.activeNotes = new Set();
  }

  async start() {
    // Start Tone.js audio context (required for user interaction)
    await Tone.start();

    // Configure for low latency after starting
    Tone.getContext().lookAhead = 0;

    console.log("Audio context started with low latency settings");
  }

  noteOn(noteString, octave) {
    // Create note with octave (e.g., "C" + octave 1 = "C3")
    const finalNote = this._getNoteWithOctave(noteString, octave);

    // If this note is already playing, ignore the repeat
    if (this.activeNotes.has(finalNote)) {
      return;
    }

    // Trigger attack on both synths and track the note
    this.polySynth.triggerAttack(finalNote);
    this.noiseSynth.triggerAttack(); // Noise doesn't need a note, just trigger
    this.activeNotes.add(finalNote);
    console.log(`Playing: ${finalNote}`);
  }

  noteOff(noteString) {
    // Find and release any octave of this note
    for (const activeNote of this.activeNotes) {
      if (activeNote.startsWith(noteString)) {
        this.polySynth.triggerRelease(activeNote);
        this.noiseSynth.triggerRelease();
        this.activeNotes.delete(activeNote);
        console.log(`Stopping: ${activeNote}`);
        break;
      }
    }
  }

  // Convert base note string and octave to final note
  _getNoteWithOctave(noteString, octave) {
    // Note string now has no octave, so add base octave (2) + current octave
    const baseOctave = 2;
    return `${noteString}${baseOctave + octave}`;
  }

  dispose() {
    this.polySynth.dispose();
    this.noiseSynth.dispose();
    this.mainGain.dispose();
    this.noiseGain.dispose();
    this.filter.dispose();
    this.activeNotes.clear();
  }
}
