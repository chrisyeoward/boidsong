import oscP5.*;
import netP5.*;

OscP5 oscP5;
NetAddress dest;

Synth synth;

Boid boid;
BoidController boidController;
int BOID_COUNT = 100;

Note notes[] = cMinorNotes;
int MIN_OCTAVE = 0;
int MAX_OCTAVE = 4;
int currentOctave = MIN_OCTAVE;

int COLOR_SCALE = 360;

void setup() {
  //size(1000, 800, P3D);
  fullScreen(P3D);

  oscP5 = new OscP5(this, 9000);
  dest = new NetAddress("127.0.0.1",6448);
  
  ArrayList<Boid> boids = new ArrayList<Boid>();
  
  colorMode(HSB, COLOR_SCALE);
  for(int i = 0; i <= BOID_COUNT; i++){
    int noteCount = notes.length;
    int hue = (i * 3*COLOR_SCALE/4) / noteCount;
    println(hue);
    color colour = color(hue % (3*COLOR_SCALE/4 - 1), (2*COLOR_SCALE)/3, (2*COLOR_SCALE)/3);
    boids.add(new Boid(
    random(-width/4,width/4), 
    random(-height/4, height/4), 
    random(-width/4, width/4),
    colour));
  }
  int sphereRadius = width;
  boidController = new BoidController(boids, sphereRadius, oscP5, dest);
  
  synth = new Synth(this);
  
  oscP5.plug(boidController,"receivePulse","/boidsong/oscs/amp");
}

void drawCanvas(){
  background(#0E1227); 
}

void draw() {
  //line();
  drawCanvas();
  //boid.run();
     
  pushMatrix();
  translate(width/2, height/2, 100);
    boidController.runBoids();

  popMatrix();
  synth.play();
 }
 
void keyPressed() {
  int note = keyToNoteIndex(key);
  if(note != -1) {
    boidController.attractBoid(note + currentOctave * notes.length);
    synth.noteOn(notes[note], currentOctave);
  };
  handleOctaveChange(key);
}

void keyReleased(){
  int note = keyToNoteIndex(key);
  if(note != -1) boidController.stopAttractingBoid(note + currentOctave * notes.length); 
  synth.noteOff();
}

void handleOctaveChange(char key) {
  switch(key) {
    case '<':
    case ',':
      if (currentOctave > MIN_OCTAVE) currentOctave = currentOctave - 1;
      break;
    case '>':
    case '.':
      if (currentOctave < MAX_OCTAVE) currentOctave++;
      break;
  }
}

int keyToNoteIndex(char key) {
  switch(key) {
    case 'a':
    case 'A':
      return  0;
    case 's':
    case 'S':
      return  1;
    case 'd':
    case 'D':
      return  2; 
    case 'f':
    case 'F':
      return  3;
    case 'g':
    case 'G':
      return  4;
    case 'h':
    case 'H':
      return  5;
    case 'j':
    case 'J':
      return  6;  
    default:
      return -1;
  }
}
