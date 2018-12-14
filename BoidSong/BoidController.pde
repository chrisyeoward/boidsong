import java.util.*;

class BoidController {
  ArrayList<Boid> boids;
  float boundSize;
  HashSet<Boid> attractingBoids;
  
  PVector camera = new PVector(0,0,530);
  PVector orbitPoint = camera.copy().sub(new PVector(0,0,10));
   
  OscP5 oscP5;
  NetAddress netDest;
  
  boolean holdingBoids = false;
  
  BoidController(ArrayList<Boid> boids, float boundSize,  OscP5 oscChannel, NetAddress dest) {
    this.boids = boids;
    this.boundSize = boundSize;
    this.attractingBoids = new HashSet<Boid>();
    oscP5 = oscChannel;
    netDest = dest;
  }
  
  void applyForce(Boid boid, PVector force) {
    boid.applyForce(force);
  }
  
  void pullBoid(int noteIndex) {
    for(int i = noteIndex; i < boids.size(); i = i + (MAX_OCTAVE + 1) * notes.length) {
      Boid boid = boids.get(i);
      if(!attractingBoids.contains(boid) && boid.position.z < orbitPoint.z) {
        attractingBoids.add(boid);
        break;
      }
    }
  }
  
  void releaseBoid(Boid boid) {
    if(!holdingBoids) {
      attractingBoids.remove(boid);
    }
  }
  
  void releaseAllBoids() {
    attractingBoids.clear();
  }
  
  void runBoids(){
    for(int boidIndex = 0; boidIndex < boids.size(); boidIndex++) {
      Boid thisBoid = boids.get(boidIndex);
        
      PVector boundsForce = bound(thisBoid);
      boundsForce.mult(1.0);
      applyForce(thisBoid, boundsForce);
      
      if(attractingBoids.contains(thisBoid)) {  
        PVector pullForce = orbitPoint.copy()
          .sub(thisBoid.position)
          .normalize();
        pullForce.mult(0.15);
        //PVector pullForce = thisBoid.seek(orbitPoint);
        //pullForce.mult(6.0);
        applyForce(thisBoid, pullForce);
        //thisBoid.seek(orbitPoint);
        if(thisBoid.position.z > orbitPoint.z) {
          releaseBoid(thisBoid);
          thisBoid.setActive(false);
        }
        thisBoid.setActive(true);
      } else {
        thisBoid.setActive(false);
      }
      
      thisBoid.run(boids);
      dispatchPosition(thisBoid, boidIndex);
    } 
  }
    
  PVector bound(Boid boid) {
   
    float boundMag = 0.005;
    PVector boundsForce = new PVector(0,0,0);
    if(boid.position.x < -boundSize) {
      boundsForce.add(boundMag,0,0);
    } else if (boid.position.x > boundSize) {
      boundsForce.add(-boundMag,0,0);
    }
   
    if(boid.position.z < -boundSize) {
      boundsForce.add(0,0,boundMag);
    } else if (boid.position.z > boundSize) {
      boundsForce.add(0,0,-boundMag);
    } 
    
    if(boid.position.y < -boundSize) {
      boundsForce.add(0,boundMag,0);
    } else if (boid.position.y > boundSize) {
      boundsForce.add(0,-boundMag,0);
    } 
    return boundsForce;
  }
  
  void dispatchPosition(Boid boid, int index) {
     
    OscMessage msg = new OscMessage("/boidsong/boids/pos");

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
    
    msg.add(index + 1);
    msg.add("polar");
    msg.add(r/25);
    msg.add(azimuth);
    msg.add(elevation);
    
    oscP5.send(msg, netDest);
  }
 
}
