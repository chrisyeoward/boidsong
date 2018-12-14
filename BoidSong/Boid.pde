
/* Boid Class
The boid knows about it's own location, velocity and rendering,
as well as the rest of the flock. It updates it's velocity based
on the position and velocity of the rest of the boids.

Class adapted from the Processing flocking example.
*/
class Boid {
  PVector position;
  PVector velocity;
  PVector velocityDiff = new PVector(0,0,0);
  PVector acceleration;
  float r;
  float maxforce;    // Maximum steering force

  float minSpeed = 1.5;
  float maxspeed = 3;
  
  float hue;
  boolean active; // when true the boid will glow brighter
  
  Boid(float x, float y, float z, float hue) {
    acceleration = new PVector(0, 0, 0);
    this.hue = hue;
    maxforce = 0.04;
    
    velocity = PVector.random3D().setMag(maxspeed) ;

    position = new PVector(x, y, z);
    r = 3.0;
  }

  void run(ArrayList<Boid> boids) {
    flock(boids); // calculates forces applied by rest of flock
    render(); 
    update();
    reset();
  }
  
  void reset(){
    // Reset acceleration to 0 each cycle
    acceleration.mult(0);
  }

  void applyForce(PVector force) {
    acceleration.add(force);
  }
  
  // 
  void update() {
    // Update velocity
    velocityDiff = velocity.copy();
    velocity.add(acceleration);
    
    // Limit speed
    velocity.limit(maxspeed);
    if(velocity.mag() < minSpeed) velocity.setMag(minSpeed);
    
    // update position based on velocity
    position.add(velocity);
    
    velocityDiff.sub(velocity);
  }
  
  void render() {    
    PVector normVel = velocity.copy().normalize(); 
    PVector perpForceVel = normVel.copy()
      .cross(velocityDiff.copy().add(new PVector(0,0.1,0)))
      .setMag(2); // returns a vector for the wings that is perpendicular to both the velocity and velocity differential
    PVector leftWing = perpForceVel.copy().sub(normVel); // Vector describing left wing
    PVector rightWing = perpForceVel.copy().mult(-1).sub(normVel); // Vector describing right wing
    
    float intensity = active ? COLOR_SCALE : 0.65*COLOR_SCALE; // brighten boid if active
    color baseColour = color(hue, intensity, intensity);
    
    pushMatrix();
    translate(position.x, position.y, position.z);
    if(active) { // render circle around boid if active
      noFill();
      stroke(baseColour, 70);
      ellipse(0, 0, 5*r, 5*r);
    }
    fill(baseColour, 50);
    stroke(baseColour);
    strokeWeight(1);
    beginShape(TRIANGLES);
    vertex(normVel.x*r, normVel.y*r, normVel.z*r);
    vertex(leftWing.x*r, leftWing.y*r, leftWing.z*r);
    vertex(0, 0, 0);
    endShape();
    beginShape(TRIANGLES);
    vertex(normVel.x*r, normVel.y*r, normVel.z*r);
    vertex(rightWing.x*r, rightWing.y*r, rightWing.z*r);
    vertex(0, 0, 0);
    endShape();
    popMatrix();
  }
  
  void setActive(boolean state) {
    active = state;
  }
  
  // determines if the current boid can see the other boid, in order to update positions 
  boolean canSeeBoid(Boid otherBoid) { 
    PVector positionDiff = otherBoid.position.copy().sub(position);
    return PVector.angleBetween(velocity, positionDiff) < HALF_PI;
  }
  
  
  /* Methods below adapted from the flocking example */
  void flock(ArrayList<Boid> boids) {
    PVector sep = separate(boids);   // Separation
    PVector ali = align(boids);      // Alignment
    PVector coh = cohesion(boids);   // Cohesion
    
    // Arbitrarily weight these forces
    sep.mult(2.5);
    ali.mult(1.0);
    coh.mult(1.0);
    
    // Add the force vectors to acceleration
    applyForce(sep);
    applyForce(ali);
    applyForce(coh);
  }
  
  // A method that calculates and applies a steering force towards a target
  PVector seek(PVector target) {
    PVector desired = PVector.sub(target, position);  // A vector pointing from the position to the target
    // Scale to maximum speed
     desired.setMag(maxspeed);

    // Steering = Desired minus Velocity
    PVector steer = PVector.sub(desired, velocity);
    steer.limit(maxforce);  // Limit to maximum steering force
    return steer;
  }

  // Separation
  // Method checks for nearby boids and steers away
  PVector separate (ArrayList<Boid> boids) {
    float desiredseparation = 25.0f;
    PVector steer = new PVector(0, 0, 0);
    int count = 0;
    // For every boid in the system, check if it's too close
    for (Boid other : boids) {
      float d = PVector.dist(position, other.position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation) && canSeeBoid(other)) {
        // Calculate vector pointing away from neighbor
        PVector diff = PVector.sub(position, other.position);
        diff.normalize();
        diff.div(d);     // Weight by distance
        diff.mult(max(desiredseparation - d, 0));
        steer.add(diff);
        count++;            // Keep track of how many
      }
    }

    // As long as the vector is greater than 0
    if (count > 0) {
      steer.div((float)count);
      steer.setMag(maxspeed);

      // Implement Reynolds: Steering = Desired - Velocity
      steer.sub(velocity);
      steer.limit(maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  PVector align (ArrayList<Boid> boids) {
    float neighbordist = 50;
    PVector steer = new PVector(0, 0, 0);
    int count = 0;
    for (Boid other : boids) {
      float d = PVector.dist(position, other.position);
      if ((d > 0) && (d < neighbordist) && canSeeBoid(other)) {
        PVector otherVel = other.velocity.copy();
        otherVel.mult(max(neighbordist - d, 0)/neighbordist);
        steer.add(otherVel);     
        count++;
      }
    }
    if (count > 0) {
      steer.div((float)count);
      steer.setMag(maxspeed);

      // Implement Reynolds: Steering = Desired - Velocity
      steer.sub(velocity);
      steer.limit(maxforce);
      return steer;
    } 
    else {
      return new PVector(0, 0, 0);
    }
  }
  
  // Cohesion
  // For the average position (i.e. center) of all nearby boids, calculate steering vector towards that position
  PVector cohesion (ArrayList<Boid> boids) {
    float neighbordist = 40;
    PVector sum = new PVector(0, 0, 0);   // Start with empty vector to accumulate all positions
    int count = 0;
    for (Boid other : boids) {
      float d = PVector.dist(position, other.position);
      if ((d > 0) && canSeeBoid(other)) {
        PVector otherPos = other.position.copy();
        otherPos.mult(max(neighbordist - d, 0)/neighbordist);
        //otherPos.mult((1/d)/neighbordist);
        sum.add(otherPos); // Add position
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return seek(sum);  // Steer towards the position
    } 
    else {
      return new PVector(0, 0, 0);
    }
  }
}
