import java.util.*;

class BoidController {
  ArrayList<Boid> boids;
  float boundSphereRadius;
  HashSet<Boid> attractingBoids;
  
  PVector camera = new PVector(0,0,600);
   
  OscP5 oscP5;
  NetAddress netDest;
  
  BoidController(ArrayList<Boid> boids, float boundSphereRadius,  OscP5 oscChannel, NetAddress dest) {
    this.boids = boids;
    this.boundSphereRadius = boundSphereRadius;
    this.attractingBoids = new HashSet<Boid>();
    oscP5 = oscChannel;
    netDest = dest;
  }
  
  void applyForce(Boid boid, PVector force) {
    boid.applyForce(force);
  }
  
  void attractBoid(int note) {
    for(int i = note; i < boids.size(); i = i + MAX_OCTAVE * notes.length) {
      attractingBoids.add(boids.get(i));
    }
  }
  
  void stopAttractingBoid(int note) {
    for(int i = note; i < boids.size(); i = i + MAX_OCTAVE * notes.length) {
      attractingBoids.remove(boids.get(i));
    }
  }
  
  void runBoids(){
    for(int currentBoid = 0; currentBoid < boids.size(); currentBoid++) {
      //for(int otherBoid = currentBoid + 1; otherBoid < boids.size(); otherBoid++) {
        Boid boid = boids.get(currentBoid);
        
        PVector boundsForce = bound(boid);
        boundsForce.mult(1.0);
        applyForce(boid, boundsForce);
        
        if(attractingBoids.contains(boid)) {
          //PVector pullForce = new PVector(0,0,570); // point around which to orbit
          PVector pullForce = camera.copy()
            .sub(new PVector(0,0,50))
            .sub(boid.position)
            .normalize();
          pullForce.mult(0.15);
          applyForce(boid, pullForce);
        }
        
        boid.run(boids);
        dispatchPosition(boid, currentBoid);
      //}
    } 
  }
    
  PVector bound(Boid boid) {
    float maxforce = 0.04;
    
    //float radius = min(boid.position.mag(), boundSphereRadius);
    //float forceMagnitude = 1/(boundSphereRadius - radius); 
    //PVector forceUnitVector = boid.position.copy().normalize();
    //forceUnitVector.mult(-1);
    //return forceUnitVector.setMag(forceMagnitude).limit(maxforce);
    
    float boundMag = 0.02;
    PVector boundsForce = new PVector(0,0,0);
    if(boid.position.x < -boundSphereRadius) {
      boundsForce.add(boundMag,0,0);
    } else if (boid.position.x > boundSphereRadius) {
      boundsForce.add(-boundMag,0,0);
    }
    
    if(boid.position.z < -boundSphereRadius) {
      boundsForce.add(0,0,boundMag);
    } else if (boid.position.z > boundSphereRadius) {
      boundsForce.add(0,0,-boundMag);
    } 
    
    if(boid.position.y < -boundSphereRadius) {
      boundsForce.add(0,boundMag,0);
    } else if (boid.position.y > boundSphereRadius) {
      boundsForce.add(0,-boundMag,0);
    } 
    return boundsForce.limit(maxforce);
  }
  
  void dispatchPosition(Boid boid, int noteIndex) {
     
    OscMessage msg = new OscMessage("/boidsong/boid/" + noteIndex + "/pos");
    //float amp = map(boid.position.copy().sub(camera).mag(), 0, 600, 1.0, 0);
    //float pan = (float) boid.position.x * 5 / width;
    //pan = constrain(pan, (float) -1, (float) 1);
    //msg.add(amp); 
    //msg.add(pan);

    PVector position = boid.position.copy().sub(camera);
    PVector xzPosition = new PVector(position.x, 0, position.z);
    PVector yzPosition = new PVector(0, position.y, position.z);
    float r = position.mag();
    float azimuth = position.x > 0 
    ? (float) (2*Math.PI - PVector.angleBetween(xzPosition, new PVector (0,0,-400)))
    : PVector.angleBetween(xzPosition, new PVector (0,0,-400));
    
    float elevation = position.y > 0 
    ? (float) (2*Math.PI - PVector.angleBetween(yzPosition, new PVector (0,0,-400)))
    : PVector.angleBetween(yzPosition, new PVector (0,0,-400));
    
    msg.add(noteIndex + 1);
    msg.add("polar");
    msg.add(r/30);
    msg.add(azimuth);
    msg.add(elevation);
    
    oscP5.send(msg, netDest);
  }
  
  void receivePulse(int boidIndex, float pulseFrequency) {
    Boid boid = boids.get(boidIndex);
    boid.setColourPulse(pulseFrequency);
  }
}
