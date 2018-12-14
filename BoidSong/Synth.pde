import processing.sound.*;

// note states
public static enum NoteState {
  ATTACK,
  DECAY,
  SUSTAIN,
  RELEASE,
  OFF
}

// synth class, concerned with determining which voice should play which note 
class Synth {  
  SynthVoice[] voices;
   
  Synth(PApplet sketch, int numberOfVoices) {
    voices = new SynthVoice[numberOfVoices];
    for(int i = 0; i < numberOfVoices; i++) {
      voices[i] = new SynthVoice(sketch);
    }    
  }
  
  void noteOn(Note note, int octave) {
    // find first available voice
    for(SynthVoice voice : voices) {
       if(voice.getState().equals(NoteState.OFF) || voice.getState().equals(NoteState.RELEASE)) {
         voice.noteOn(note, octave);
         break;
       }
    }
  }
  
  // stop playing a given note, regardless of octave 
  // this means the same note can't be held down for multiple octaves, which is impossible for a laptop keyboard anyway
  void noteOff(Note note) {
    for(SynthVoice voice : voices) {
       if(voice.getNote().equals(note)) {
         voice.noteOff();
         break;
       }
    }
  }
  
  // play all voices
  void play() {
    for(SynthVoice voice : voices) {
       voice.play();
    }
  }
}

// Voice class, controls the envelope of the oscillator, and it's frequency 
// each voice has one LP filtered sawtooth and one BP filtered white noise for texture
public class SynthVoice {
  Note note = notes[0];
  int octave = 0;
  float amp = 0;
  NoteState state; 
  SawOsc osc;
  LowPass lowPass;
  static final float sawGain = 0.15;

  WhiteNoise noise;
  BandPass bandPass; 
  static final float noiseGain = 0.2*sawGain;

  NoteState getState() {
    return state;
  }
  
  Note getNote() {
    return note;
  }
   
   // setup oscillators
  SynthVoice(PApplet sketch) {
    osc = new SawOsc(sketch);
    osc.amp(amp);
    osc.play();
    state = NoteState.OFF;
    lowPass = new LowPass(sketch);
    lowPass.process(osc);
    
    noise = new WhiteNoise(sketch);
    noise.amp(amp);
    bandPass = new BandPass(sketch);
    bandPass.process(noise, 20000);
    noise.play();
  }
  
  // start playing a given note
  void noteOn(Note note, int octave) {
    this.note = note;
    float freq = note.getFreq() * (float) Math.pow(2,octave);
    osc.freq(freq);
    lowPass.freq(freq + 100);
    state = NoteState.ATTACK;
  }
  
  void noteOff() {
    state = NoteState.RELEASE;
  }
  
  // cycle through ADSR envelope
  void play() {
    float attackRate =  0.5;
    float sustainValue = 0.4;
    float peak = 0.9;
    float releaseRate = 0.95;
    float decayRate = 0.9;
    switch(state) {
      case ATTACK:
        amp = amp + attackRate;
        if(amp >= peak) state = NoteState.DECAY;
        break;
      case DECAY:
        amp = amp * decayRate;
        if(amp <= sustainValue) state = NoteState.SUSTAIN;
        break;
      case SUSTAIN:
        break;
      case RELEASE: 
        amp = amp * releaseRate;
        if (amp <= 0.01) state = NoteState.OFF;
        break;
      default:
        amp = 0;
    }
    // set relative gains
    osc.amp(amp*sawGain); 
    noise.amp(amp*noiseGain);
  }
}
