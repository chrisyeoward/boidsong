import "./style.css";
import p5 from "p5";
import { Boid } from "./Boid.js";
import { BoidsController } from "./BoidsController.js";
import { cMinorNotes } from "./notes.js";

// BoidSong main application
function sketch(p) {
  let boidsController;
  let notes = cMinorNotes;
  let currentOctave = 0;

  const BOID_COUNT = 80;
  const MIN_OCTAVE = 0;
  const MAX_OCTAVE = 4;
  const COLOR_SCALE = 360;

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.colorMode(p.HSB, COLOR_SCALE);

    // Create boids with note-based coloring
    const boids = [];
    for (let i = 0; i < BOID_COUNT; i++) {
      const noteCount = notes.length;
      let hue = (i * ((3 * COLOR_SCALE) / 4)) / noteCount;
      hue = hue % ((3 * COLOR_SCALE) / 4 - 1);

      boids.push(
        new Boid(
          p.random(-p.width / 4, p.width / 4),
          p.random(-p.height / 4, p.height / 4),
          p.random(-p.width / 4, p.width / 4),
          hue,
          p
        )
      );
    }

    // Create controller
    const cameraPosition = p.createVector(0, 0, 530);
    const boundRadius = p.height;
    boidsController = new BoidsController(
      boids,
      boundRadius,
      cameraPosition,
      p
    );
  };

  p.draw = function () {
    drawCanvas();

    // Translate matrix such that (0,0) is in centre of screen.
    p.push();
    p.translate(0, 0, 100); // + 100 on the z axis brings boids closer, matching Processing version
    boidsController.runBoids();
    p.pop();

    drawInstructions();
  };

  function drawCanvas() {
    p.background(9, 12, 26); // Dark blue matching Processing version
  }

  function drawInstructions() {
    p.fill(255);
    p.textSize(16);
    p.text(`Octave: ${currentOctave}`, 20, 30);

    p.textSize(14);
    const keys = ["a", "s", "d", "f", "g", "h", "j"];
    for (let i = 0; i < notes.length; i++) {
      const noteHue = (i * 3 * COLOR_SCALE) / 4 / notes.length;
      p.fill(noteHue, 0.65 * COLOR_SCALE, 0.65 * COLOR_SCALE);
      p.text(`${keys[i]}: ${notes[i].toString()}`, 20, 60 + i * 20);
    }

    p.fill(255, 200);
    p.text("</>: -/+ octave", 20, 200);
    p.text("space: retain boids", 20, 220);
    p.text(`FPS: ${p.frameRate().toFixed(1)}`, 20, 250);
  }

  function keyToNoteIndex(key) {
    const keyMap = {
      a: 0,
      A: 0,
      s: 1,
      S: 1,
      d: 2,
      D: 2,
      f: 3,
      F: 3,
      g: 4,
      G: 4,
      h: 5,
      H: 5,
      j: 6,
      J: 6,
    };
    return keyMap[key] !== undefined ? keyMap[key] : -1;
  }

  function handleOctaveChange(key) {
    if ((key === "<" || key === ",") && currentOctave > MIN_OCTAVE) {
      currentOctave--;
    } else if ((key === ">" || key === ".") && currentOctave < MAX_OCTAVE - 1) {
      currentOctave++;
    }
  }

  p.keyPressed = function () {
    const note = keyToNoteIndex(p.key);
    if (note !== -1) {
      // Pull boid corresponding to that note towards the camera
      boidsController.pullBoid(
        note + currentOctave * notes.length,
        MAX_OCTAVE,
        notes.length
      );

      // TODO: Add audio synthesis
      console.log(
        `Note pressed: ${notes[note].toString()} at octave ${currentOctave}`
      );
    }

    handleOctaveChange(p.key);

    if (p.key === " ") {
      boidsController.setHoldingBoids(true);
    }
  };

  p.keyReleased = function () {
    const note = keyToNoteIndex(p.key);
    if (note !== -1) {
      // TODO: Stop audio note
      console.log(`Note released: ${notes[note].toString()}`);
    }

    if (p.key === " ") {
      boidsController.releaseAllBoids();
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}

// Create p5 instance
new p5(sketch);
