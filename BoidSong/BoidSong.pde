import oscP5.*;
import netP5.*;

OscP5 oscP5;
NetAddress dest;

Synth synth;

BoidsController boidsController;
int BOID_COUNT = 100;

Note notes[] = cMinorNotes; // use c minor melodic scale
int MIN_OCTAVE = 0;
int MAX_OCTAVE = 4;
int currentOctave = MIN_OCTAVE;

int COLOR_SCALE = 360; // scale for colour setup 

PFont f;

void setup() {
  size(1000, 800, P3D);
  //fullScreen(P3D);

  oscP5 = new OscP5(this, 9000);
  dest = new NetAddress("127.0.0.1",6448);
  
  ArrayList<Boid> boids = new ArrayList<Boid>();
  
  colorMode(HSB, COLOR_SCALE);
  for(int i = 0; i < BOID_COUNT; i++){
    int noteCount = notes.length;
    int hue = (i * 3*COLOR_SCALE/4) / noteCount;
    hue = hue % (3*COLOR_SCALE/4 - 1);
    
    // create new boid at random position
    boids.add(new Boid(
    random(-width/4,width/4), 
    random(-height/4, height/4), 
    random(-width/4, width/4),
    hue)); 
    
    f = createFont("Arial",16,true);
    textFont(f);
  }
  
  // define location of viewer in the canvas
  PVector cameraPosition = new PVector(0,0,530);
  
  // size of area in which boids can move, outside of this they will be force to turn around
  int boundRadius = height;
  boidsController = new BoidsController(boids, boundRadius, cameraPosition, oscP5, dest);
  
  // create new 3 voice synth
  synth = new Synth(this, 3);
}

void drawCanvas(){
  background(#090C1A); 
}

void drawInstructions() {
  fill(255);
  textSize(16);
  text("Octave: " + currentOctave, 20, 30);
  
  textSize(14);
  char[] keys = {'a', 's' , 'd', 'f', 'g', 'h', 'j'};
  for (int i = 0; i < notes.length; i++) {
    fill((i * 3*COLOR_SCALE/4) / notes.length, 0.65*COLOR_SCALE, 0.65*COLOR_SCALE);
    text(keys[i] + ": " + notes[i].toString().replaceAll("[0-9]", ""),  20, 60 + i * 20 );
  }
 
  fill(255, 200);
  text("</>: -/+ octave", 20, 200);
  text("space: retain boids", 20, 220);
}

void draw() {
  drawCanvas();    
  
  // translate matrix such that (0,0) is in centre of screen.
  pushMatrix();
  translate(width/2, height/2, 100); // + 100 on the z axis brings boids closer, such that they will move closer to the camera, increasing immersion for the viewer
  boidsController.runBoids(); // run the flocking and steering behaviours
  popMatrix();
  drawInstructions();
  synth.play();
 }
 
void keyPressed() {
  int note = keyToNoteIndex(key);
  if(note != -1) { // if is one of the designated notes 
    boidsController.pullBoid(note + currentOctave * notes.length); // pull boid corresponding to that note towards the camera
    synth.noteOn(notes[note], currentOctave); // play that note corresponding to that index with the synth, at the current octave
  };
  handleOctaveChange(key); 
  if(key == ' ') {
    boidsController.setHoldingBoids(true); // if spacebar pressed then retain boids closer to the camera
  }
}

void keyReleased(){
  int note = keyToNoteIndex(key);
  if(note != -1) {
    synth.noteOff(notes[note]); // octave information not required for key release 
  }
  
  if(key == ' ') {
    boidsController.releaseAllBoids();
  }
}

void handleOctaveChange(char key) {
  switch(key) {
    case '<':
    case ',':
      if (currentOctave > MIN_OCTAVE) currentOctave--;
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
