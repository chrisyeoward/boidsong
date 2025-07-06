import './style.css'
import p5 from 'p5'

// Simple p5.js test sketch
function sketch(p) {
  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(255, 255, 0); // Yellow background
  };

  p.draw = function() {
    p.background(255, 255, 0); // Yellow background
    
    // Red circle in center
    p.fill(255, 0, 0);
    p.noStroke();
    p.ellipse(p.width / 2, p.height / 2, 100, 100);
    
    // Show framerate
    p.fill(0);
    p.text(`FPS: ${p.frameRate().toFixed(1)}`, 10, 20);
  };

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}

// Create p5 instance
new p5(sketch);
