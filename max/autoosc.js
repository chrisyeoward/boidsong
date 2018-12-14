var numOscillators = 0;
var oscPatches = new Array(64);
var networkReceiver;

var unjoiner;
var joiner;
var hoaMap;
var hoaOptim;
var hoaDecoder;
var hoaDac;

var MAX_OCTAVE = 4;

var NOTE_C2  = 65;
var NOTE_CS2 = 69;
var NOTE_D2  = 73;
var NOTE_DS2 = 78;
var NOTE_E2  = 82;
var NOTE_F2  = 87;
var NOTE_FS2 = 93;
var NOTE_G2  = 98;
var NOTE_GS2 = 104;
var NOTE_A2  = 110;
var NOTE_AS2 = 117;
var NOTE_B2  = 123;


var cMinorNotes = [
  NOTE_C2,
NOTE_D2,
  NOTE_DS2,
  NOTE_F2,
  NOTE_G2,
  NOTE_GS2,
  NOTE_AS2,
];

var cPentatonicNotes = [
  NOTE_C2,
  NOTE_DS2,
  NOTE_F2,
  NOTE_G2,
  NOTE_AS2,
];

// creates an oscillator module with carrier and amp mod
function oscPatch(parentPatch, index) {
	var scale = cMinorNotes; // set which key to use
	var rowWidth = scale.length;
	var left = 150 + (index % rowWidth) * 200;
	var top = 320 + (Math.floor(index / rowWidth) * 100);
	
	var octave = Math.floor(index / scale.length) + 1;
	octave = octave % (MAX_OCTAVE + 1);
 	var carrierFreq = scale[index % scale.length] * Math.pow(2, octave);
	var carrier = parentPatch.newdefault(left,top,"cycle~", carrierFreq);
	
	var modulatorFreq = Math.random()*8 + 1;
	var modDutyCycle = Math.random();
	var modulator = parentPatch.newdefault(left + 30,top + 20,"tri~", modulatorFreq, modDutyCycle);
	var signalMultiplier = parentPatch.newdefault(left, top + 50, "*~");

	parentPatch.connect(carrier,0,signalMultiplier, 0);
	parentPatch.connect(modulator,0,signalMultiplier, 1);
	parentPatch.connect(signalMultiplier, 0, hoaMap, index);
	
	return {
		patch: parentPatch,
		carrier: carrier,
		modulator: modulator,
		signalMultiplier: signalMultiplier,

		// include function to be able to disconnect patch
		remove: function() { 
			parentPatch.remove(this.ampSend);
			parentPatch.remove(this.carrier);
			parentPatch.remove(this.modulator);
			parentPatch.remove(this.signalMultiplier);
		}
	}
}

// patches the hoa ambisonics, once
function patchHoaAmbisonics() {
	var top = 80;
	var left = 250;
		networkReceiver = this.patcher.newdefault(left, top, "udpreceive", "6448");
		unjoiner = this.patcher.newdefault(left, top + 30, "unjoin", 6);
		joiner = this.patcher.newdefault(left, top + 2*30, "join", 5);
		hoaMap = this.patcher.newdefault(left, top + 3*30, "hoa.2d.map~", 3, numOscillators + 1);
  		hoaOptim = this.patcher.newdefault(left, top + 4*30, "hoa.2d.optim~", 3, "inPhase");
		hoaDecoder = this.patcher.newdefault(left, top + 5*30, "hoa.2d.decoder~", 3, "@mode", "binaural");
 		hoaDac = this.patcher.newdefault(left, top + 6*30, "hoa.dac~", "1:2");

		this.patcher.connect(networkReceiver, 0, unjoiner, 0);
		for(var i=0;i<5;i++) {
			this.patcher.connect(unjoiner, i+1, joiner, i);
		}
		this.patcher.connect(joiner, 0, hoaMap, 0);
		for(var i=0;i<=6;i++) {
			this.patcher.connect(hoaMap, i, hoaOptim, i);
			this.patcher.connect(hoaOptim, i, hoaDecoder, i);
		}
		this.patcher.connect(hoaDecoder, 0, hoaDac, 0);
		this.patcher.connect(hoaDecoder, 1, hoaDac, 1);
}

function oscillators(val)
{
	if(arguments.length) // bail if no arguments
	{
		// remove all oscillators to begin
		for(var i=0;i<numOscillators;i++)
		{
			oscPatches[i].remove();
		}
		
		// if more than 0 oscillators, remove hoa ambisonics patches
		if(numOscillators) {
			this.patcher.remove(networkReceiver);
			this.patcher.remove(unjoiner);
      		this.patcher.remove(joiner);
      		this.patcher.remove(hoaMap);
      		this.patcher.remove(hoaOptim);
      		this.patcher.remove(hoaDecoder);
      		this.patcher.remove(hoaDac);
		}

		numOscillators = arguments[0];
		
		// patch ambisonics 
		if(numOscillators) {
			patchHoaAmbisonics();
		}
		
		// for all the oscillators, create module
		for(var i=0;i<numOscillators;i++)
		{
			oscPatches[i] = new oscPatch(this.patcher, i);
		}
	}
}
