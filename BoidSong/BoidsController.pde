import java.util.*;

class BoidsController {
  ArrayList<Boid> boids;
  float boundSize;
  
  PVector camera;
  PVector orbitPoint;
   
  OscP5 oscP5;
  NetAddress netDest;
  
  boolean holdingBoids = false;
  
  BoidsController(ArrayList<Boid> boids, float boundSize, PVector camera, OscP5 oscChannel, NetAddress dest) {
    this.camera = camera;
    this.orbitPoint = camera.copy().sub(new PVector(0,0,10));
   
    this.boids = boids;
    this.boundSize = boundSize;
    oscP5 = oscChannel;
    netDest = dest;
  }
  
  void runBoids(){
    for(int boidIndex = 0; boidIndex < boids.size(); boidIndex++) {
      Boid thisBoid = boids.get(boidIndex);
        
      constrainBoid(thisBoid);
      pullBoid(thisBoid);
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
  
  void pullBoid(int noteIndex) {
    for(int i = noteIndex; i < boids.size(); i = i + (MAX_OCTAVE + 1) * notes.length) {
      Boid boid = boids.get(i);
      if(!boid.active && boid.position.z < orbitPoint.z) {
        boid.setActive(true);
        break;
      }
    }
  }
  
  void releaseBoid(Boid boid) {
    if(!holdingBoids) {
      boid.setActive(false);
    }
  }
  
  void releaseAllBoids() {
    for(Boid boid : boids) {
      boid.setActive(false);
    }
    holdingBoids = false;
  }
  
  void constrainBoid(Boid boid) {
    PVector boundsForce = bound(boid);
    boundsForce.mult(1.0);
    boid.applyForce(boundsForce);
  }
  
  void pullBoid(Boid boid) {
    if(boid.active) {  
        PVector pullForce = orbitPoint.copy()
          .sub(boid.position)
          .normalize();
        pullForce.mult(0.15);
        //PVector pullForce = thisBoid.seek(orbitPoint);
        //pullForce.mult(6.0);
        
        boid.applyForce(pullForce);
        
        if(boid.position.z > orbitPoint.z) {
          releaseBoid(boid);
        }
      }
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
