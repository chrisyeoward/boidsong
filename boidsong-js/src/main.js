import "./style.css";
import p5 from "p5";
import { Boid } from "./Boid.js";
import { BoidsController } from "./BoidsController.js";
import { cMinorNotes } from "./notes.js";
import { Synth } from "./Synth.js";
import { AudioEngine } from "./BoidsAudio.js";

// BoidSong main application
function sketch(p) {
  let boidsController;
  let synth;
  let audioEngine;
  let notes = cMinorNotes;
  let currentOctave = 0;
  let audioStarted = false;
  let uiDiv;

  const BOID_COUNT = 32;
  const MIN_OCTAVE = 0;
  const MAX_OCTAVE = 4;
  const COLOR_SCALE = 360;

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.colorMode(p.HSB, COLOR_SCALE);

    // Create HTML overlay for UI
    createUI();

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

    // Create audio engine for boid sonification first
    audioEngine = new AudioEngine(BOID_COUNT);

    // Create controller
    const cameraPosition = p.createVector(0, 0, 530);
    const boundRadius = p.height;
    boidsController = new BoidsController(
      boids,
      boundRadius,
      cameraPosition,
      p,
      audioEngine
    );

    // Create synth (3 voices matching Processing version)
    synth = new Synth(3);
  };

  p.draw = function () {
    drawCanvas();

    // Translate matrix such that (0,0) is in centre of screen.
    p.push();
    p.translate(0, 0, 100); // + 100 on the z axis brings boids closer, matching Processing version
    boidsController.runBoids();
    p.pop();

    updateUI();
  };

  function drawCanvas() {
    p.background(9, 12, 26); // Dark blue matching Processing version
  }

  function createUI() {
    // Create HTML overlay div
    uiDiv = document.createElement("div");
    uiDiv.style.position = "fixed";
    uiDiv.style.top = "20px";
    uiDiv.style.left = "20px";
    uiDiv.style.color = "white";
    uiDiv.style.fontFamily = "Space Mono, monospace";
    uiDiv.style.fontSize = "14px";
    uiDiv.style.pointerEvents = "none";
    uiDiv.style.zIndex = "1000";
    uiDiv.style.textShadow = "1px 1px 2px rgba(0,0,0,0.8)";
    document.body.appendChild(uiDiv);

    updateUI();
  }

  function updateUI() {
    if (!uiDiv) return;

    const keys = ["a", "s", "d", "f", "g", "h", "j"];
    let html = `<div style="font-size: 16px; margin-bottom: 10px;">Octave: ${currentOctave}</div>`;

    for (let i = 0; i < notes.length; i++) {
      const hue = (i * 270) / notes.length;
      html += `<div style="color: hsl(${hue}, 65%, 65%); margin: 2px 0;">${keys[i]}: ${notes[i]}</div>`;
    }

    html += `
      <div style="margin-top: 10px; color: rgba(255,255,255,0.8);">
        <div>&lt;/&gt;: -/+ octave</div>
        <div>space: retain boids</div>
        <div>FPS: ${p.frameRate().toFixed(1)}</div>
        ${
          !audioStarted
            ? '<div style="color: #ff6666;">Click to start audio</div>'
            : ""
        }
      </div>
    `;

    uiDiv.innerHTML = html;
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
        note,
        notes.length
      );

      // Play note with synth
      if (synth && audioStarted) {
        synth.noteOn(notes[note], currentOctave);
      }
      console.log(`Note pressed: ${notes[note]} at octave ${currentOctave}`);
    }

    handleOctaveChange(p.key);

    if (p.key === " ") {
      boidsController.setHoldingBoids(true);
    }
  };

  p.keyReleased = function () {
    const note = keyToNoteIndex(p.key);
    if (note !== -1) {
      // Stop audio note
      if (synth && audioStarted) {
        synth.noteOff(notes[note]);
      }
      console.log(`Note released: ${notes[note]}`);
    }

    if (p.key === " ") {
      boidsController.releaseAllBoids();
    }
  };

  p.mousePressed = async function () {
    // Start audio context on first click
    if (!audioStarted && synth && audioEngine) {
      await synth.start();
      await audioEngine.start();
      audioStarted = true;
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}

// Create p5 instance
new p5(sketch);
