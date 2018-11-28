// import * as p5 from './p5.min.js';
import Boid from './Boid';

let s = (sk) => {
  var flock;
  // const {setup, draw, mouseDragged} = sk;
  sk.setup = () => {
    // sk.createCanvas(window.innerWidth, window.innerHeight);
    // sk.background(40);
    // sk.stroke(200);
    // sk.strokeWeight(3);
    // sk.ellipse(window.innerWidth/2, window.innerHeight/2, 50, 50);

    sk.createCanvas(screen.width, screen.height);
    // createP("Drag the mouse to generate new boids.");

    flock = new Flock();
    // Add an initial set of boids into the system
    for (var i = 0; i < 50; i++) {
      var b = new Boid(sk, screen.width/2,screen.height/2);
      flock.addBoid(b);
    }
  }

  sk.draw = () => {
    sk.background(51);
    flock.run();
  }

  // Add a new boid into the System
  sk.mouseDragged = () => {
    flock.addBoid(new Boid(sk.mouseX,sk.mouseY));
  }
}

const P5 = new p5(s);

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function() {
  for (var i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}
