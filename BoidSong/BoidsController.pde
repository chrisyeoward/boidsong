/*
Controller for the boids
This class knows about the boundary of the simulation,
the position of the viewer and orbit point, and all of the boids

It is responsible for dispatching the position of each boid each 
render cycle 
*/

class BoidsController {
  ArrayList<Boid> boids;
  float boundSize;
  
  PVector camera;
  PVector orbitPoint;
   
  OscP5 oscP5;
  NetAddress netDest;
  
  boolean holdingBoids = false;
  
  BoidsController(ArrayList<Boid> boids, float boundSize, PVector camera, OscP5 oscChannel, NetAddress dest) {
    this.camera = camera; // position of the viewer 
    this.orbitPoint = camera.copy().sub(new PVector(0,0,10)); // coordinate about which the attracted boids will orbit
   
    this.boids = boids;
    this.boundSize = boundSize;
    oscP5 = oscChannel;
    netDest = dest;
  }
  
  void setHoldingBoids(boolean value) {
    holdingBoids = value;
  }
  
  void runBoids(){
    for(int boidIndex = 0; boidIndex < boids.size(); boidIndex++) {
      Boid thisBoid = boids.get(boidIndex);
        
      constrainBoid(thisBoid); // limit to be within bounds 
      attractBoid(thisBoid); // pull boid if it's active
      thisBoid.run(boids); // run flocking algorithm for boid
      dispatchPosition(thisBoid, boidIndex); // send position via OSC
    } 
  }
   
  // calculates the force to apply to a boid if it is outside of the defined bounds 
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
  
  // finds first boid for that note that isn't already being pulled, or is behind the camera to be pulled towards the camera 
  void pullBoid(int noteIndex) {
    for(int i = noteIndex; i < boids.size(); i = i + (MAX_OCTAVE + 1) * notes.length) {
      Boid boid = boids.get(i);
      if(!boid.active && boid.position.z < orbitPoint.z) {  // if a boid is found that is not active nor is behind camera
        boid.setActive(true);
        break;
      }
    }
  }
  
  // stops pulling a boid
  void releaseBoid(Boid boid) {
    if(!holdingBoids) {
      boid.setActive(false);
    }
  }
  
  // stops pulling all boids
  void releaseAllBoids() {
    for(Boid boid : boids) {
      boid.setActive(false);
    }
    setHoldingBoids(false);
  }
  
  // applies the bounds force to the boid
  void constrainBoid(Boid boid) {
    PVector boundsForce = bound(boid);
    boid.applyForce(boundsForce);
  }
  
  // applies attracting force to boid if it is currently active
  // boid attracted to an orbit point that is slightly in front of the viewer
  void attractBoid(Boid boid) {
    if(boid.active) {  
        PVector pullForce = orbitPoint.copy()
          .sub(boid.position)
          .normalize();
        pullForce.mult(0.15);
        
        boid.applyForce(pullForce);
        
        if(boid.position.z > orbitPoint.z) { // if boid moves beyond the orbit point, set it to no longer be active
          releaseBoid(boid);
        }
      }
  }
  
  // dispatch boid position over osc in polar coordinates, with the origin at the viewer/camera's position
  void dispatchPosition(Boid boid, int index) {  
    OscMessage msg = new OscMessage("/boidsong/boids/pos");

    PVector position = boid.position.copy().sub(camera);
    PVector xzPosition = new PVector(position.x, 0, position.z);
    PVector yzPosition = new PVector(0, position.y, position.z);
    float r = position.mag();
    float azimuth = position.x > 0 
    ? (float) (2*PI - PVector.angleBetween(xzPosition, new PVector (0,0,-400)))
    : PVector.angleBetween(xzPosition, new PVector (0,0,-400));
    
    float elevation = position.y > 0 
    ? (float) (2*PI - PVector.angleBetween(yzPosition, new PVector (0,0,-400)))
    : PVector.angleBetween(yzPosition, new PVector (0,0,-400)); // for 3D ambisonics, but not currently used by the Max patch
    
    msg.add(index + 1);
    msg.add("polar");
    msg.add(r/25);
    msg.add(azimuth);
    msg.add(elevation);
    
    oscP5.send(msg, netDest);
  }
}
