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
  let helpButton;
  let helpModal;
  let helpContent;
  let closeButton;
  let showHelp = false;
  let noiseTexture;

  const BOID_COUNT = 40;
  const MIN_OCTAVE = 0;
  const MAX_OCTAVE = 4;
  const COLOR_SCALE = 360;

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.colorMode(p.HSB, COLOR_SCALE);

    // Generate noise texture once during setup
    generateNoiseTexture();

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
          p,
        ),
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
      audioEngine,
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

    // Draw noise overlay on top of everything
    drawNoiseOverlay();

    updateUI();
  };

  function drawCanvas() {
    p.background(9, 12, 26); // Dark blue matching Processing version
  }

  function drawNoiseOverlay() {
    if (noiseTexture) {
      // Reset camera to screen space for overlay
      p.camera();
      p.push();
      p.resetMatrix();
      p.translate(-p.width / 2, -p.height / 2);
      p.tint(255, 200); // More visible for testing
      p.image(noiseTexture, 0, 0, p.width, p.height);
      p.noTint();
      p.pop();
    }
  }

  function generateNoiseTexture() {
    // Create a smaller graphics buffer for larger grain size
    const grainSize = 2; // Adjust this for different grain sizes
    const noiseWidth = Math.ceil(p.width / grainSize);
    const noiseHeight = Math.ceil(p.height / grainSize);
    const noiseBuffer = p.createGraphics(noiseWidth, noiseHeight);
    noiseBuffer.loadPixels();

    // Generate noise pattern at lower resolution
    for (let i = 0; i < noiseBuffer.pixels.length; i += 4) {
      const brightness = p.random(0, 255);
      noiseBuffer.pixels[i] = brightness; // R
      noiseBuffer.pixels[i + 1] = brightness; // G
      noiseBuffer.pixels[i + 2] = brightness; // B
      noiseBuffer.pixels[i + 3] = p.random(10, 30); // A (low alpha for subtle effect)
    }
    noiseBuffer.updatePixels();

    noiseTexture = noiseBuffer;
  }

  function createUI() {
    createBasicUI();
    createHelpButton();
    createHelpModal();
    createCloseButton();
    createHelpContent();
    updateUI();
  }

  function createBasicUI() {
    // Create HTML overlay div for basic info
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
  }

  function createHelpButton() {
    helpButton = document.createElement("button");
    helpButton.innerHTML = "?";
    helpButton.style.position = "fixed";
    helpButton.style.top = "20px";
    helpButton.style.right = "20px";
    helpButton.style.width = "32px";
    helpButton.style.height = "32px";
    helpButton.style.borderRadius = "50%";
    helpButton.style.border = "1px solid rgba(255,255,255,0.2)";
    helpButton.style.background = "rgba(0,0,0,0.3)";
    helpButton.style.color = "white";
    helpButton.style.fontSize = "16px";
    helpButton.style.fontWeight = "bold";
    helpButton.style.cursor = "pointer";
    helpButton.style.zIndex = "1001";
    helpButton.style.fontFamily = "Space Mono, monospace";
    helpButton.style.display = "flex";
    helpButton.style.alignItems = "center";
    helpButton.style.justifyContent = "center";
    helpButton.addEventListener("click", toggleHelp);
    document.body.appendChild(helpButton);
  }

  function createHelpModal() {
    helpModal = document.createElement("div");
    helpModal.style.position = "fixed";
    helpModal.style.top = "20px";
    helpModal.style.right = "20px";
    helpModal.style.width = "300px";
    helpModal.style.maxHeight = "400px";
    helpModal.style.background = "rgba(0,0,0,1)";
    helpModal.style.border = "1px solid rgba(255,255,255,0.2)";
    helpModal.style.borderRadius = "8px";
    helpModal.style.padding = "20px";
    helpModal.style.color = "white";
    helpModal.style.fontFamily = "Space Mono, monospace";
    helpModal.style.fontSize = "14px";
    helpModal.style.zIndex = "1002";
    helpModal.style.display = "none";
    helpModal.style.overflowY = "auto";
    helpModal.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
    document.body.appendChild(helpModal);
  }

  function createCloseButton() {
    closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "8px";
    closeButton.style.right = "8px";
    closeButton.style.width = "24px";
    closeButton.style.height = "24px";
    closeButton.style.border = "none";
    closeButton.style.background = "transparent";
    closeButton.style.color = "white";
    closeButton.style.fontSize = "18px";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "50%";
    closeButton.style.display = "flex";
    closeButton.style.alignItems = "center";
    closeButton.style.justifyContent = "center";
    closeButton.addEventListener("click", toggleHelp);
    helpModal.appendChild(closeButton);
  }

  function createHelpContent() {
    helpContent = document.createElement("div");
    helpContent.style.marginTop = "10px";
    helpModal.appendChild(helpContent);
  }

  function toggleHelp() {
    showHelp = !showHelp;
    if (helpModal) {
      helpModal.style.display = showHelp ? "block" : "none";
    }
  }

  function updateUI() {
    if (!uiDiv) return;

    // Update basic info (always visible)
    let basicHtml = `<div style="font-size: 16px; margin-bottom: 10px;">Octave: ${currentOctave}</div>`;
    basicHtml += `<div style="color: rgba(255,255,255,0.8);">FPS: ${p.frameRate().toFixed(1)}</div>`;
    if (!audioStarted) {
      basicHtml += '<div style="color: #ff6666;">Click to start audio</div>';
    }
    uiDiv.innerHTML = basicHtml;

    // Update help content (only when help is shown)
    if (helpContent) {
      const keys = ["a", "s", "d", "f", "g", "h", "j"];
      let helpHtml = `<div style="font-size: 16px; margin-bottom: 10px; font-weight: bold;">Controls</div>`;

      for (let i = 0; i < notes.length; i++) {
        const hue = (i * 270) / notes.length;
        helpHtml += `<div style="color: hsl(${hue}, 65%, 65%); margin: 2px 0;">${keys[i]}: ${notes[i]}</div>`;
      }

      helpHtml += `
        <div style="margin-top: 15px; color: rgba(255,255,255,0.8);">
          <div>&lt;/&gt;: -/+ octave</div>
        </div>
      `;

      helpContent.innerHTML = helpHtml;
    }
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
      boidsController.pullBoid(note, notes.length);

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
