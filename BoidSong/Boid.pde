// The Boid class

class Boid {
  PVector position;
  PVector velocity;
  PVector velocityDiff = new PVector(0,0,0);
  PVector acceleration;
  float r;
  float maxforce;    // Maximum steering force

  float minSpeed = 1.5;
  float maxspeed = 3;
  
  color baseColour;
  float colourPhaseShift = 0;
  float colourFreq = 0.01;
  
    Boid(float x, float y, float z, color baseColour) {
    acceleration = new PVector(0, 0, 0);
    this.baseColour = baseColour;
    maxforce = 0.04;
    
    velocity = PVector.random3D().mult(maxspeed) ;

    position = new PVector(x, y, z);
    r = 3.0;
  }

  void run(ArrayList<Boid> boids) {
    flock(boids);
    render();
    update();
    reset();
  }
  
  void reset(){
    // Reset accelertion to 0 each cycle
    acceleration.mult(0);
  }

  void applyForce(PVector force) {
    // We could add mass here if we want A = F / M
    acceleration.add(force);
  }
  
  // We accumulate a new acceleration each time based on three rules
  void flock(ArrayList<Boid> boids) {
    PVector sep = separate(boids);   // Separation
    PVector ali = align(boids);      // Alignment
    PVector coh = cohesion(boids);   // Cohesion
    // Arbitrarily weight these forces
    sep.mult(2.0);
    ali.mult(1.0);
    coh.mult(1.15);
    // Add the force vectors to acceleration
    applyForce(sep);
    applyForce(ali);
    applyForce(coh);
  }

  // Method to update position
  void update() {
    // Update velocity
    velocityDiff = velocity.copy();
    velocity.add(acceleration);
    // Limit speed
    //velocity.normalize();
    //velocity.mult(maxspeed);
    velocity.limit(maxspeed);
    if(velocity.mag() < minSpeed) velocity.setMag(minSpeed);
    position.add(velocity);
    velocityDiff.sub(velocity);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  PVector seek(PVector target) {
    PVector desired = PVector.sub(target, position);  // A vector pointing from the position to the target
    // Scale to maximum speed
    desired.normalize();
    desired.mult(maxspeed);

    // Above two lines of code below could be condensed with new PVector setMag() method
    // Not using this method until Processing.js catches up
    // desired.setMag(maxspeed);

    // Steering = Desired minus Velocity
    PVector steer = PVector.sub(desired, velocity);
    steer.limit(maxforce);  // Limit to maximum steering force
    return steer;
  }
  
  void updateColour() {
      colorMode(HSB, COLOR_SCALE);

    float amplitude = sin((TWO_PI*millis())*colourFreq + colourPhaseShift);
    int centreValue = (2*COLOR_SCALE)/3;
    float colourValue = centreValue + amplitude * centreValue / 2;

    float hue = hue(baseColour);
    baseColour = color(hue, colourValue, colourValue + 50);
  }
  
  void setColourPulse(float pulseFrequency) {
    colourFreq = pulseFrequency*1e-3;
    colourPhaseShift = 0;
  }
  
  void render() {    
    PVector normVel = velocity.copy().normalize();
    PVector perpForceVel = normVel.copy().cross(velocityDiff.copy().add(new PVector(0,0.1,0))).setMag(2);
    PVector leftWing = perpForceVel.copy().sub(normVel);
    PVector rightWing = perpForceVel.copy().mult(-1).sub(normVel);
    
    //updateColour();
    
    fill(baseColour, 50);
    stroke(baseColour);
    strokeWeight(1);
    pushMatrix();
    translate(position.x, position.y, position.z);
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

  // Separation
  // Method checks for nearby boids and steers away
  PVector separate (ArrayList<Boid> boids) {
    float desiredseparation = 20.0f;
    PVector steer = new PVector(0, 0, 0);
    int count = 0;
    // For every boid in the system, check if it's too close
    for (Boid other : boids) {
      float d = PVector.dist(position, other.position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0)) {
        // Calculate vector pointing away from neighbor
        PVector diff = PVector.sub(position, other.position);
        diff.normalize();
        //diff.div(d);     // Weight by distance
        diff.mult(max(desiredseparation - d, 0));
        steer.add(diff);
        count++;            // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div((float)count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // First two lines of code below could be condensed with new PVector setMag() method
      // Not using this method until Processing.js catches up
      // steer.setMag(maxspeed);

      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(maxspeed);
      steer.sub(velocity);
      steer.limit(maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  PVector align (ArrayList<Boid> boids) {
    float neighbordist = 50;
    PVector sum = new PVector(0, 0, 0);
    int count = 0;
    for (Boid other : boids) {
      float d = PVector.dist(position, other.position);
      if ((d > 0) && (d < neighbordist)) {
        PVector otherVel = other.velocity.copy();
        otherVel.mult(max(neighbordist - d, 0)/neighbordist);
        sum.add(otherVel);     
        count++;
      }
    }
    if (count > 0) {
      sum.div((float)count);
      sum.setMag(maxspeed);

      // Implement Reynolds: Steering = Desired - Velocity
      PVector steer = PVector.sub(sum, velocity);
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
    float neighbordist = 50;
    PVector sum = new PVector(0, 0, 0);   // Start with empty vector to accumulate all positions
    int count = 0;
    for (Boid other : boids) {
      float d = PVector.dist(position, other.position);
      if ((d > 0) ) {
        PVector otherPos = other.position.copy();
        otherPos.mult(max(neighbordist - d, 1/pow(d,2))/neighbordist);
        sum.add(otherPos); // Add position
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return seek(sum);  // Steer towards the position
    } 
    else {
      return new PVector(0, 0);
    }
  }
}
