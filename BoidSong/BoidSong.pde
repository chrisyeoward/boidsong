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

PFont f;

char[] keys = {'a', 's' , 'd', 'f', 'g', 'h', 'j'};

void setup() {
  //size(1000, 800, P3D);
  fullScreen(P3D);

  oscP5 = new OscP5(this, 9000);
  dest = new NetAddress("127.0.0.1",6448);
  
  ArrayList<Boid> boids = new ArrayList<Boid>();
  
  colorMode(HSB, COLOR_SCALE);
  for(int i = 0; i < BOID_COUNT; i++){
    int noteCount = notes.length;
    int hue = (i * 3*COLOR_SCALE/4) / noteCount;
    hue = hue % (3*COLOR_SCALE/4 - 1);
    boids.add(new Boid(
    random(-width/4,width/4), 
    random(-height/4, height/4), 
    random(-width/4, width/4),
    hue));
    
    f = createFont("Arial",16,true);
    textFont(f);
  }
  //for(int i = 0; i <= BOID_COUNT; i++){
  //  int noteCount = notes.length;
  //  int hue = (i * 3*COLOR_SCALE/4) / noteCount;
  //  println(hue);
  //  color colour = color(hue % (3*COLOR_SCALE/4 - 1), 0, (COLOR_SCALE)/2);
  //  boids.add(new Boid(
  //  random(-width/4,width/4), 
  //  random(-height/4, height/4), 
  //  random(-width/4, width/4),
  //  colour));
  //}
  int boundRadius = height;
  boidController = new BoidController(boids, boundRadius, oscP5, dest);
  
  synth = new Synth(this);
}

void drawCanvas(){
  background(#090C1A); 
}

void draw() {
  //line();
  drawCanvas();
  //boid.run();
     
  pushMatrix();
  translate(width/2, height/2, 100);
    boidController.runBoids();

  popMatrix();
  
  fill(255);
  textSize(16);
  text("Octave: " + currentOctave, 20, 30);
  
  textSize(14);
  for (int i = 0; i < notes.length; i++) {
    fill((i * 3*COLOR_SCALE/4) / notes.length, 0.65*COLOR_SCALE, 0.65*COLOR_SCALE);
    text(keys[i] + ": " + notes[i].toString(),  20, 60 + i * 20 );
  }
 
  fill(255, 200);
  text("</>: -/+ octave", 20, 200);
  text("space: retain boids", 20, 220);
  synth.play();
 }
 
void keyPressed() {
  int note = keyToNoteIndex(key);
  if(note != -1) {
    boidController.pullBoid(note + currentOctave * notes.length);
    synth.noteOn(notes[note], currentOctave);
  };
  handleOctaveChange(key);
  switch(key) {
    case ' ':
      boidController.holdingBoids = true;
  }
}

void keyReleased(){
  int note = keyToNoteIndex(key);
  if(note != -1) {
    //boidController.releaseBoid(note + currentOctave * notes.length);
    synth.noteOff(notes[note]);
  }
  
  switch(key) {
    case ' ':
      boidController.releaseAllBoids();
      boidController.holdingBoids = false;
  }
}

void handleOctaveChange(char key) {
  switch(key) {
    case '<':
    case ',':
      if (currentOctave > MIN_OCTAVE) currentOctave = currentOctave - 1;
      break;
    case '>':
    case '.':
      if (currentOctave < MAX_OCTAVE - 1) currentOctave++;
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
