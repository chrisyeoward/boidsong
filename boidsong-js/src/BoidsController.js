// BoidsController class for managing the flock
// Converted from Processing BoidsController.pde

import p5 from 'p5'

export class BoidsController {
  constructor(boids, boundSize, camera, p5Instance, audioEngine = null) {
    this.p = p5Instance;
    this.boids = boids;
    this.boundSize = boundSize;
    this.camera = camera;
    this.orbitPoint = camera.copy().sub(this.p.createVector(0, 0, 10));
    this.holdingBoids = false;
    this.audioEngine = audioEngine;
    
    // For future OSC/WebSocket implementation
    this.oscP5 = null;
    this.netDest = null;
  }

  setHoldingBoids(value) {
    this.holdingBoids = value;
  }

  runBoids() {
    for (let boidIndex = 0; boidIndex < this.boids.length; boidIndex++) {
      const thisBoid = this.boids[boidIndex];
      
      this.constrainBoid(thisBoid);
      this.attractBoid(thisBoid);
      thisBoid.run(this.boids);
      
      // Update audio engine with boid position relative to camera (listener)
      if (this.audioEngine) {
        const relativePosition = thisBoid.position.copy().sub(this.camera);
        this.audioEngine.updateBoidPosition(
          boidIndex,
          relativePosition.x,
          relativePosition.y,
          relativePosition.z
        );
        this.audioEngine.setBoidActive(boidIndex, thisBoid.active);
      }
      
      // TODO: Implement OSC dispatch when needed
      // this.dispatchPosition(thisBoid, boidIndex);
    }
  }

  // Calculate boundary force
  bound(boid) {
    const boundMag = 0.005;
    const boundsForce = this.p.createVector(0, 0, 0);
    
    if (boid.position.x < -this.boundSize) {
      boundsForce.add(boundMag, 0, 0);
    } else if (boid.position.x > this.boundSize) {
      boundsForce.add(-boundMag, 0, 0);
    }
    
    if (boid.position.z < -this.boundSize) {
      boundsForce.add(0, 0, boundMag);
    } else if (boid.position.z > this.boundSize) {
      boundsForce.add(0, 0, -boundMag);
    }
    
    if (boid.position.y < -this.boundSize) {
      boundsForce.add(0, boundMag, 0);
    } else if (boid.position.y > this.boundSize) {
      boundsForce.add(0, -boundMag, 0);
    }
    
    return boundsForce;
  }

  // Find and pull a boid for the given note
  pullBoid(noteIndex, notesLength) {
    // Find the first inactive boid that matches this note
    const boid = this.boids.find((boid, index) => {
      // Check if this boid corresponds to the note index
      const boidNoteIndex = index % notesLength;
      const targetNoteIndex = noteIndex;
      return boidNoteIndex === targetNoteIndex && !boid.active && boid.position.z < this.orbitPoint.z;
    });
    
    // If we found a matching inactive boid, activate it
    if (boid) {
      boid.setActive(true);
    }
  }

  // Release a specific boid
  releaseBoid(boid) {
    if (!this.holdingBoids) {
      boid.setActive(false);
    }
  }

  // Release all boids
  releaseAllBoids() {
    for (const boid of this.boids) {
      boid.setActive(false);
    }
    this.setHoldingBoids(false);
  }

  // Apply boundary constraints
  constrainBoid(boid) {
    const boundsForce = this.bound(boid);
    boid.applyForce(boundsForce);
  }

  // Apply attraction force to active boids
  attractBoid(boid) {
    if (boid.active) {
      const pullForce = this.orbitPoint.copy()
        .sub(boid.position)
        .normalize()
        .mult(0.15);
      
      boid.applyForce(pullForce);
      
      // Release boid if it moves beyond orbit point
      if (boid.position.z > this.orbitPoint.z) {
        this.releaseBoid(boid);
      }
    }
  }

  // TODO: Implement OSC dispatch when WebSocket/communication is added
  dispatchPosition(boid, index) {
    // Convert to polar coordinates relative to camera
    const position = boid.position.copy().sub(this.camera);
    const xzPosition = this.p.createVector(position.x, 0, position.z);
    const yzPosition = this.p.createVector(0, position.y, position.z);
    
    const r = position.mag();
    const azimuth = position.x > 0 
      ? (2 * this.p.PI - p5.Vector.angleBetween(xzPosition, this.p.createVector(0, 0, -400)))
      : p5.Vector.angleBetween(xzPosition, this.p.createVector(0, 0, -400));
    
    const elevation = position.y > 0
      ? (2 * this.p.PI - p5.Vector.angleBetween(yzPosition, this.p.createVector(0, 0, -400)))
      : p5.Vector.angleBetween(yzPosition, this.p.createVector(0, 0, -400));
    
    // Future: Send via WebSocket
    console.log(`Boid ${index + 1}: r=${r/25}, azimuth=${azimuth}, elevation=${elevation}`);
  }
}