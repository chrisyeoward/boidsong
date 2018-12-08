import processing.sound.*;

class Synth {
  
  SawOsc osc;
  NoteState state;
  float amp;
  
  HashSet<SynthVoice> voices;
  
  float gain = 0.05;
  LowPass lowPass;
  
  Synth(PApplet sketch) {
    osc = new SawOsc(sketch);
    osc.amp(0);
    osc.play();
    amp = 0;
    state = NoteState.OFF;
    lowPass = new LowPass(sketch);
    lowPass.process(osc);
    
    voices = new HashSet<SynthVoice>();
  }
  
  void noteOn(Note note, int octave) {
    float freq = note.getFreq() * (float) Math.pow(2,octave);
    osc.freq(freq);
    lowPass.freq(freq + 200);
    state = NoteState.ATTACK;
  }
  
  void noteOff() {
    state = NoteState.RELEASE;
  }
  
  void play() {
    //for(int i = 0; i < oscs.length(); i++) {
      
    //}
    
    float rampRate =  0.005;
    float sustainValue = 0.9;
    float decayRate = 0.95;
    switch(state) {
      case ATTACK:
        amp = amp + rampRate;
        if(amp >= sustainValue) state = NoteState.SUSTAIN;
        break;
      case SUSTAIN:
        break;
      case RELEASE: 
        amp = amp * decayRate;
        if (amp <= 0) state = NoteState.OFF;
        break;
      default:
        amp = 0;
    }
    osc.amp(amp*gain);
  }
}

public class SynthVoice {
  Note note;
  int octave;
  float amp = 0;
  NoteState state; 
   
  SynthVoice(Note note, int octave) {
    this.note = note;
    this.octave = octave;
  }
  
  float getFreq() {
    return note.getFreq() * (float) Math.pow(2, octave);
  }
  
  @Override
  public boolean equals(Object o) {
    if (o == this) return true; 
        
    if (!(o instanceof SynthVoice)) return false; 
     
    SynthVoice s = (SynthVoice) o;
    return note == s.note && octave == s.octave;
  }
}

public static enum NoteState {
  ATTACK,
  SUSTAIN,
  RELEASE,
  OFF
}
