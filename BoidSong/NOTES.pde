
// note enum, defines the frequencies for the notes used
public static enum Note {
  NOTE_C2  (65),
  NOTE_CS2 (69),
  NOTE_D2  (73),
  NOTE_DS2 (78),
  NOTE_E2  (82),
  NOTE_F2  (87),
  NOTE_FS2 (93),
  NOTE_G2  (98),
  NOTE_GS2 (104),
  NOTE_A2  (110),
  NOTE_AS2 (117),
  NOTE_B2  (123);

  private final float freq;
  
  private Note(float freq){
    this.freq = freq;
  }
  
  public float getFreq() {
    return this.freq;
  }
  
  @Override
  public String toString() { // used for displaying the notes on the screen
    return this.name()
    .split("_")[1]
    .replaceAll("S", "#");
  }
}

public static Note cMinorNotes[] = {
  Note.NOTE_C2,
  Note.NOTE_D2,
  Note.NOTE_DS2,
  Note.NOTE_F2,
  Note.NOTE_G2,
  Note.NOTE_GS2,
  Note.NOTE_AS2,
};

public static Note cPentatonicNotes[] = {
  Note.NOTE_C2,
  Note.NOTE_DS2,
  Note.NOTE_F2,
  Note.NOTE_G2,
  Note.NOTE_AS2,
};
