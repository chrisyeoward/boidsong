# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
BoidSong is an interactive sonified flocking algorithm that renders with ambisonics. It combines a Processing sketch for visual flocking simulation with Max MSP for spatial audio synthesis. The system uses OSC communication to send boid positions from Processing to Max for real-time ambisonics rendering.

## Setup and Running

### Processing Version
1. **Max MSP Setup**: Open the Max patch (`max/boids_oscs_ambison.maxpat`) and click on message (0-100) to determine how many oscillators to run
2. **Processing Setup**: Open the Processing sketch (`BoidSong/BoidSong.pde`) and run it
3. **Required Dependencies**: 
   - Processing (https://processing.org/)
   - Max MSP (https://cycling74.com/)
   - HoaLibrary for Max (http://hoalibrary.mshparisnord.fr/)

### p5.js Version (boidsong-js)
1. **Development**: `yarn dev` or `npm run dev` to start development server
2. **Build**: `yarn build` or `npm run build` to create production build
3. **Preview**: `yarn preview` or `npm run preview` to preview production build
4. **Dependencies**: 
   - Node.js and yarn/npm
   - p5.js (included in package.json)
   - Vite for build tooling

## Architecture

### Processing Sketch (`BoidSong/`)
- **BoidSong.pde**: Main application entry point, handles user input and coordinates system
- **Boid.pde**: Individual boid class implementing flocking behaviors (separation, alignment, cohesion) with 3D rendering
- **BoidsController.pde**: Manages the flock, applies constraints, handles user interaction, and dispatches OSC messages
- **Synth.pde**: Built-in polyphonic synthesizer using Processing's Sound library (SawOsc + WhiteNoise with ADSR envelope)
- **NOTES.pde**: Defines musical notes and scales (C minor melodic scale, C pentatonic)

### p5.js Version (`boidsong-js/`)
- **Vite-based project** with modern JavaScript tooling
- **p5.js 2.0.3** for graphics and interaction
- **ES6 modules** for modular code organization
- **Development server** with hot reload via Vite
- **Production builds** with optimization and bundling

### Max MSP Patches (`max/`)
- **boids_oscs_ambison.maxpat**: Main ambisonic rendering patch
- **autoosc.js**: JavaScript for dynamic oscillator creation and management
- **boids_oscs.maxpat**: Alternative simpler patch without ambisonics

### Communication Protocol
- OSC messages sent from Processing to Max on localhost:6448
- Message format: `/boidsong/boids/pos [index] "polar" [radius] [azimuth] [elevation]`
- Boid positions converted to polar coordinates relative to camera position for ambisonics

## Key Features
- **Interactive Control**: Keyboard controls (a,s,d,f,g,h,j) trigger note-mapped boid attraction
- **Visual Feedback**: Boids change color and brightness when active, with triangular 3D rendering
- **Spatial Audio**: Real-time ambisonics positioning based on boid locations
- **Dual Synthesis**: Both Processing-native synth and Max MSP ambisonics rendering
- **Octave Control**: `<` and `>` keys change octave (0-4 range)
- **Boid Retention**: Spacebar holds attracted boids near camera

## Code Conventions

### Processing Version
- Processing sketch uses standard .pde file structure
- 3D vectors extensively used for position/velocity calculations
- HSB color mode for boid visualization
- Flocking algorithm based on Reynolds' rules with line-of-sight modifications
- OSC communication for real-time audio positioning

### p5.js Version
- ES6 modules with import/export syntax
- Modern JavaScript features (classes, arrow functions, const/let)
- p5.js instance mode recommended for modular architecture
- Web Audio API for audio synthesis (instead of Processing Sound)
- WebSocket or Socket.IO for real-time communication with Max (instead of OSC)