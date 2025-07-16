// Boid class for flocking behavior
// Converted from Processing Boid.pde

import p5 from "p5";

export class Boid {
  constructor(x, y, z, hue, p5Instance) {
    this.p = p5Instance;
    this.position = this.p.createVector(x, y, z);
    this.velocity = p5.Vector.random3D().setMag(3); // maxspeed
    this.velocityDiff = this.p.createVector(0, 0, 0);
    this.acceleration = this.p.createVector(0, 0, 0);

    this.r = 3.0;
    this.maxforce = 0.12;
    this.minSpeed = 2.5;
    this.maxspeed = 5;

    this.hue = hue;
    this.active = false;
  }

  run(boids) {
    this.flock(boids);
    this.render();
    this.update();
    this.reset();
  }

  reset() {
    this.acceleration.mult(0);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocityDiff = this.velocity.copy();
    this.velocity.add(this.acceleration);

    // Limit speed
    this.velocity.limit(this.maxspeed);
    if (this.velocity.mag() < this.minSpeed) {
      this.velocity.setMag(this.minSpeed);
    }

    this.position.add(this.velocity);
    this.velocityDiff.sub(this.velocity);
  }

  render() {
    const normVel = this.velocity.copy().normalize();
    const perpForceVel = normVel
      .copy()
      .cross(this.velocityDiff.copy().add(this.p.createVector(0, 0.1, 0)))
      .setMag(2);

    const leftWing = perpForceVel.copy().sub(normVel);
    const rightWing = perpForceVel.copy().mult(-1).sub(normVel);

    // Color intensity based on active state
    const colorScale = 360; // HSB color scale
    const intensity = this.active ? colorScale : 0.65 * colorScale;

    this.p.push();
    this.p.translate(this.position.x, this.position.y, this.position.z);

    // Render circle around active boids
    if (this.active) {
      this.p.noFill();
      this.p.stroke(this.hue, intensity, intensity, 70);
      this.p.ellipse(0, 0, 5 * this.r, 5 * this.r);
    }

    // Render boid body
    this.p.fill(this.hue, intensity, intensity, 50);
    this.p.stroke(this.hue, intensity, intensity);
    this.p.strokeWeight(1);

    // Draw triangular boid body
    this.p.beginShape(this.p.TRIANGLES);
    this.p.vertex(normVel.x * this.r, normVel.y * this.r, normVel.z * this.r);
    this.p.vertex(
      leftWing.x * this.r,
      leftWing.y * this.r,
      leftWing.z * this.r
    );
    this.p.vertex(0, 0, 0);
    this.p.endShape();

    this.p.beginShape(this.p.TRIANGLES);
    this.p.vertex(normVel.x * this.r, normVel.y * this.r, normVel.z * this.r);
    this.p.vertex(
      rightWing.x * this.r,
      rightWing.y * this.r,
      rightWing.z * this.r
    );
    this.p.vertex(0, 0, 0);
    this.p.endShape();

    this.p.pop();
  }

  setActive(state) {
    this.active = state;
  }

  // Line of sight check
  canSeeBoid(otherBoid) {
    const positionDiff = otherBoid.position.copy().sub(this.position);
    return p5.Vector.angleBetween(this.velocity, positionDiff) < this.p.HALF_PI;
  }

  // Flocking behavior
  flock(boids) {
    const sep = this.separate(boids);
    const ali = this.align(boids);
    const coh = this.cohesion(boids);

    // Weight the forces
    sep.mult(2.5);
    ali.mult(1.0);
    coh.mult(1.0);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  // Seek behavior
  seek(target) {
    const desired = p5.Vector.sub(target, this.position);
    desired.setMag(this.maxspeed);

    const steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  }

  // Separation behavior
  separate(boids) {
    const desiredSeparation = 25.0;
    const steer = this.p.createVector(0, 0, 0);
    let count = 0;

    for (const other of boids) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < desiredSeparation && this.canSeeBoid(other)) {
        const diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);
        diff.mult(Math.max(desiredSeparation - d, 0));
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }

    return steer;
  }

  // Alignment behavior
  align(boids) {
    const neighborDist = 50;
    const steer = this.p.createVector(0, 0, 0);
    let count = 0;

    for (const other of boids) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist && this.canSeeBoid(other)) {
        const otherVel = other.velocity.copy();
        otherVel.mult(Math.max(neighborDist - d, 0) / neighborDist);
        steer.add(otherVel);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
      return steer;
    }

    return this.p.createVector(0, 0, 0);
  }

  // Cohesion behavior
  cohesion(boids) {
    const neighborDist = 40;
    const sum = this.p.createVector(0, 0, 0);
    let count = 0;

    for (const other of boids) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && this.canSeeBoid(other)) {
        const otherPos = other.position.copy();
        otherPos.mult(Math.max(neighborDist - d, 0) / neighborDist);
        sum.add(otherPos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }

    return this.p.createVector(0, 0, 0);
  }
}
