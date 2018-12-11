import java.util.*;

class BoidController {
  ArrayList<Boid> boids;
  float boundSphereRadius;
  HashSet<Boid> attractingBoids;
  
  PVector camera = new PVector(0,0,520);
  PVector orbitPoint = camera.copy().sub(new PVector(0,0,10));
   
  OscP5 oscP5;
  NetAddress netDest;
  
  boolean holdingBoids = false;
  
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
  
  void pullBoid(int noteIndex) {
    for(int i = noteIndex; i < boids.size(); i = i + (MAX_OCTAVE + 1) * notes.length) {
      Boid boid = boids.get(i);
      if(!attractingBoids.contains(boid) && boid.position.z < orbitPoint.z) {
        attractingBoids.add(boid);
        //boid.setActive(true);
        break;
      }
    }
  }
  
  void releaseBoid(int noteIndex) {
    if(!holdingBoids) {
      //for(int i = noteIndex; i < boids.size(); i = i + MAX_OCTAVE * notes.length) {
        Boid boid = boids.get(noteIndex);
        attractingBoids.remove(boid);
        //boid.setActive(false);
      //}
    }
  }
  
  void releaseAllBoids() {
    attractingBoids.clear();
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
          PVector pullForce = orbitPoint.copy()
            .sub(boid.position)
            .normalize();
          pullForce.mult(0.15);
          applyForce(boid, pullForce);
          if(boid.position.z > orbitPoint.z) {
            releaseBoid(currentBoid);
          }
          boid.setActive(true);
        } else {
          boid.setActive(false);
        }
        
        boid.run(boids);
        dispatchPosition(boid, currentBoid);
      //}
    } 
  }
  
  // Separation
  // Method checks for nearby boids and steers away
  //PVector separate (ArrayList<Boid> boids) {
  //  float desiredseparation = 20.0f;
  //  PVector steer = new PVector(0, 0, 0);
  //  int count = 0;
  //  // For every boid in the system, check if it's too close
  //  for (Boid other : boids) {
  //    float d = PVector.dist(position, other.position);
  //    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
  //    if ((d > 0) && canSeeBoid(other)) {
  //      // Calculate vector pointing away from neighbor
  //      PVector diff = PVector.sub(position, other.position);
  //      diff.normalize();
  //      //diff.div(d);     // Weight by distance
  //      diff.mult(max(desiredseparation - d, 0));
  //      steer.add(diff);
  //      count++;            // Keep track of how many
  //    }
  //  }
  //  // Average -- divide by how many
  //  if (count > 0) {
  //    steer.div((float)count);
  //  }

  //  // As long as the vector is greater than 0
  //  if (steer.mag() > 0) {
  //    // First two lines of code below could be condensed with new PVector setMag() method
  //    // Not using this method until Processing.js catches up
  //    // steer.setMag(maxspeed);

  //    // Implement Reynolds: Steering = Desired - Velocity
  //    steer.normalize();
  //    steer.mult(maxspeed);
  //    steer.sub(velocity);
  //    steer.limit(maxforce);
  //  }
  //  return steer;
  //}
    
  PVector bound(Boid boid) {
   
    float boundMag = 0.005;
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
    return boundsForce;
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
    msg.add(r/20);
    msg.add(azimuth);
    msg.add(elevation);
    
    oscP5.send(msg, netDest);
  }
 
}
