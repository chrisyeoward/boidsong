// Note definitions and scales for BoidSong
// Converted from Processing NOTES.pde

// Note frequencies in Hz
export const Notes = {
  NOTE_C2: 65,
  NOTE_CS2: 69,
  NOTE_D2: 73,
  NOTE_DS2: 78,
  NOTE_E2: 82,
  NOTE_F2: 87,
  NOTE_FS2: 93,
  NOTE_G2: 98,
  NOTE_GS2: 104,
  NOTE_A2: 110,
  NOTE_AS2: 117,
  NOTE_B2: 123
};

// Note class to handle frequency calculations and display
export class Note {
  constructor(name, freq) {
    this.name = name;
    this.freq = freq;
  }

  getFreq() {
    return this.freq;
  }

  toString() {
    return this.name
      .split('_')[1]
      .replace('S', '#');
  }
}

// Create note instances
export const NOTE_C2 = new Note('NOTE_C2', 65);
export const NOTE_CS2 = new Note('NOTE_CS2', 69);
export const NOTE_D2 = new Note('NOTE_D2', 73);
export const NOTE_DS2 = new Note('NOTE_DS2', 78);
export const NOTE_E2 = new Note('NOTE_E2', 82);
export const NOTE_F2 = new Note('NOTE_F2', 87);
export const NOTE_FS2 = new Note('NOTE_FS2', 93);
export const NOTE_G2 = new Note('NOTE_G2', 98);
export const NOTE_GS2 = new Note('NOTE_GS2', 104);
export const NOTE_A2 = new Note('NOTE_A2', 110);
export const NOTE_AS2 = new Note('NOTE_AS2', 117);
export const NOTE_B2 = new Note('NOTE_B2', 123);

// Scale definitions
export const cMinorNotes = [
  NOTE_C2,
  NOTE_D2,
  NOTE_DS2,
  NOTE_F2,
  NOTE_G2,
  NOTE_GS2,
  NOTE_AS2,
];

export const cPentatonicNotes = [
  NOTE_C2,
  NOTE_DS2,
  NOTE_F2,
  NOTE_G2,
  NOTE_AS2,
];

// Default export for convenience
export default {
  Notes,
  Note,
  cMinorNotes,
  cPentatonicNotes
};