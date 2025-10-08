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
  let currentOctave = 1;
  let audioStarted = false;
  let uiDiv;
  let helpButton;
  let helpModal;
  let helpContent;
  let closeButton;
  let showHelp = false;
  let audioStartModal;
  let audioStartContent;
  let noiseTexture;
  let boidCountDropdown;
  let currentBoidCount = 56; // Default to 84 boids (12 * 7)

  const MIN_OCTAVE = 0;
  const MAX_OCTAVE = 4;
  const COLOR_SCALE = 360;
  const BOID_COUNT_OPTIONS = [21, 28, 35, 42, 49, 56, 63, 70, 77, 84];

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.colorMode(p.HSB, COLOR_SCALE);

    // Generate noise texture once during setup
    generateNoiseTexture();

    // Create HTML overlay for UI
    createUI();

    // Create boids with note-based coloring
    const boids = createBoids(currentBoidCount);

    // Create audio engine for boid sonification first
    audioEngine = new AudioEngine(currentBoidCount);

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
      p.tint(255, 200);

      // Tile the noise texture across the screen
      const tileSize = noiseTexture.width;
      for (let x = 0; x < p.width; x += tileSize) {
        for (let y = 0; y < p.height; y += tileSize) {
          p.image(noiseTexture, x, y);
        }
      }

      p.noTint();
      p.pop();
    }
  }

  function generateNoiseTexture() {
    // Create a small tileable noise pattern (much faster than full screen)
    const tileSize = 256; // Small tile that will be repeated
    const noiseBuffer = p.createGraphics(tileSize, tileSize);
    noiseBuffer.loadPixels();

    // Generate noise pattern for the tile
    for (let i = 0; i < noiseBuffer.pixels.length; i += 4) {
      const brightness = p.random(0, 255);
      noiseBuffer.pixels[i] = brightness; // R
      noiseBuffer.pixels[i + 1] = brightness; // G
      noiseBuffer.pixels[i + 2] = brightness; // B
      noiseBuffer.pixels[i + 3] = p.random(0, 10); // A (low alpha for subtle effect)
    }
    noiseBuffer.updatePixels();

    noiseTexture = noiseBuffer;
  }

  function createBoids(count) {
    const boids = [];
    for (let i = 0; i < count; i++) {
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
    return boids;
  }

  function createUI() {
    createBasicUI();
    createBoidCountDropdown();
    createHelpButton();
    createHelpModal();
    createCloseButton();
    createHelpContent();
    createAudioStartModal();
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
    uiDiv.style.zIndex = "1000";
    uiDiv.style.textShadow = "1px 1px 2px rgba(0,0,0,0.8)";
    document.body.appendChild(uiDiv);
  }

  function createBoidCountDropdown() {
    // Create dropdown container
    const dropdownContainer = document.createElement("div");
    dropdownContainer.style.marginRight = "20px";
    dropdownContainer.style.pointerEvents = "auto";
    dropdownContainer.style.display = "inline-block";

    // Create label
    const label = document.createElement("label");
    label.textContent = "Boids: ";
    label.style.color = "white";
    label.style.fontFamily = "Space Mono, monospace";
    label.style.fontSize = "14px";
    label.style.marginRight = "8px";
    label.style.textShadow = "1px 1px 2px rgba(0,0,0,0.8)";

    // Create dropdown
    boidCountDropdown = document.createElement("select");
    boidCountDropdown.style.background = "rgba(0,0,0,0.7)";
    boidCountDropdown.style.border = "1px solid rgba(255,255,255,0.3)";
    boidCountDropdown.style.borderRadius = "4px";
    boidCountDropdown.style.color = "white";
    boidCountDropdown.style.fontFamily = "Space Mono, monospace";
    boidCountDropdown.style.fontSize = "14px";
    boidCountDropdown.style.padding = "4px 8px";
    boidCountDropdown.style.cursor = "pointer";

    // Add options
    BOID_COUNT_OPTIONS.forEach(count => {
      const option = document.createElement("option");
      option.value = count;
      option.textContent = count;
      if (count === currentBoidCount) {
        option.selected = true;
      }
      boidCountDropdown.appendChild(option);
    });

    // Add change handler
    boidCountDropdown.addEventListener("change", function() {
      const newCount = parseInt(this.value);
      if (newCount !== currentBoidCount) {
        changeBoidCount(newCount);
      }
    });

    dropdownContainer.appendChild(label);
    dropdownContainer.appendChild(boidCountDropdown);
    uiDiv.appendChild(dropdownContainer);
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
    helpModal.style.width = "400px";
    helpModal.style.background = "rgba(0,0,0,1)";
    helpModal.style.border = "1px solid rgba(255,255,255,0.2)";
    helpModal.style.borderRadius = "8px";
    helpModal.style.padding = "20px";
    helpModal.style.color = "white";
    helpModal.style.fontFamily = "Space Mono, monospace";
    helpModal.style.fontSize = "14px";
    helpModal.style.zIndex = "1002";
    helpModal.style.display = "none";
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

  function createAudioStartModal() {
    // Create modal backdrop
    audioStartModal = document.createElement("div");
    audioStartModal.style.position = "fixed";
    audioStartModal.style.top = "0";
    audioStartModal.style.left = "0";
    audioStartModal.style.width = "100%";
    audioStartModal.style.height = "100%";
    audioStartModal.style.background = "rgba(0,0,0,0.5)";
    audioStartModal.style.display = "flex";
    audioStartModal.style.alignItems = "center";
    audioStartModal.style.justifyContent = "center";
    audioStartModal.style.zIndex = "2000";
    audioStartModal.style.pointerEvents = "auto";
    audioStartModal.style.cursor = "pointer";
    document.body.appendChild(audioStartModal);

    // Create modal content
    audioStartContent = document.createElement("div");
    audioStartContent.style.background = "rgba(0,0,0,1)";
    audioStartContent.style.border = "1px solid rgba(255,255,255,0.3)";
    audioStartContent.style.borderRadius = "12px";
    audioStartContent.style.padding = "20px";
    audioStartContent.style.textAlign = "center";
    audioStartContent.style.color = "white";
    audioStartContent.style.fontFamily = "Space Mono, monospace";
    audioStartContent.style.fontSize = "14px";
    audioStartContent.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
    audioStartContent.style.maxWidth = "400px";
    audioStartContent.innerHTML = `
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 30px;">BoidSong</div>
      <div style="margin-bottom: 15px;">Play notes using keys A-J.</div>
      <div style="margin-bottom: 15px;">Use headphones for optimal experience.</div>
      <div style="margin-top: 25px;">Click anywhere to begin.</div>
    `;
    
    // Add click handler to start audio
    audioStartModal.addEventListener("click", async function() {
      if (!audioStarted && synth && audioEngine) {
        await synth.start();
        await audioEngine.start();
        audioStarted = true;
        audioStartModal.style.display = "none";
      }
    });
    
    audioStartModal.appendChild(audioStartContent);
  }

  function toggleHelp() {
    showHelp = !showHelp;
    if (helpModal) {
      helpModal.style.display = showHelp ? "block" : "none";
    }
  }

  function changeBoidCount(newCount) {
    currentBoidCount = newCount;
    
    // Create new boids
    const newBoids = createBoids(currentBoidCount);
    
    // Update boidsController with new boids
    boidsController.boids = newBoids;
    
    // Update audio engine with new count
    if (audioEngine && audioStarted) {
      audioEngine.updateBoidCount(currentBoidCount);
    }
    
    console.log(`Boid count changed to: ${currentBoidCount}`);
  }

  function updateUI() {
    if (!uiDiv) return;

    // Find the octave and FPS elements to update them
    let octaveElement = uiDiv.querySelector('.octave-display');
    let fpsElement = uiDiv.querySelector('.fps-display');
    
    // Create octave element if it doesn't exist
    if (!octaveElement) {
      octaveElement = document.createElement("div");
      octaveElement.className = "octave-display";
      octaveElement.style.fontSize = "14px";
      octaveElement.style.marginRight = "20px";
      octaveElement.style.display = "inline-block";
      uiDiv.appendChild(octaveElement);
    }
    
    // Create FPS element if it doesn't exist
    if (!fpsElement) {
      fpsElement = document.createElement("div");
      fpsElement.className = "fps-display";
      fpsElement.style.color = "rgba(255,255,255,0.8)";
      fpsElement.style.display = "inline-block";
      uiDiv.appendChild(fpsElement);
    }
    
    // Update the content
    octaveElement.textContent = `Octave: ${currentOctave}`;
    fpsElement.textContent = `FPS: ${p.frameRate().toFixed(1)}`;

    // Show/hide audio start modal
    if (audioStartModal) {
      audioStartModal.style.display = audioStarted ? "none" : "flex";
    }

    // Update help content (only when help is shown)
    if (helpContent) {
      const keys = ["a", "s", "d", "f", "g", "h", "j"];
      let helpHtml = `
        <div style="font-size: 20px; margin-bottom: 15px; font-weight: bold; color: #ffffff;">BoidSong</div>
        <div style="font-size: 14px; margin-bottom: 20px; color: rgba(255,255,255,0.9); line-height: 1.4;">
          An interactive, sonified boids simulation using spatial audio.<br><br>
          Play notes using keys A-J, and listen to the boids response.
        </div>
        <div style="font-size: 16px; margin-bottom: 10px; font-weight: bold;">Controls</div>
      `;

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
    // Audio start is now handled by the modal click handler
    // This function can be used for other mouse interactions if needed
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}

// Create p5 instance
new p5(sketch);
