var numOscillators = 0;
var oscPatches = new Array(64);
var networkReceiver;
var networkSender;

var unjoiner;
var joiner;
var hoaMap;
var hoaOptim;
var hoaDecoder;
var hoaDac;

var MAX_OCTAVE = 5;

var NOTE_B0 = 31;
var NOTE_C1 = 33;
var NOTE_CS1 = 35;
var NOTE_D1 = 37;
var NOTE_DS1 = 39;
var NOTE_E1  = 41;
var NOTE_F1  = 44;
var NOTE_FS1 = 46;
var NOTE_G1  = 49;
var NOTE_GS1 = 52;
var NOTE_A1  = 55;
var NOTE_AS1 = 58;
var NOTE_B1  = 62;
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
var NOTE_C3  = 131;
var NOTE_CS3 = 139;
var NOTE_D3  = 147;
var NOTE_DS3 = 156;
var NOTE_E3  = 165;
var NOTE_F3  = 175;
var NOTE_FS3 = 185;
var NOTE_G3  = 196;
var NOTE_GS3 = 208;
var NOTE_A3  = 220;
var NOTE_AS3 = 233;
var NOTE_B3  = 247;
var NOTE_C4  = 262;
var NOTE_CS4 = 277;
var NOTE_D4  = 294;
var NOTE_DS4 = 311;
var NOTE_E4  = 330;
var NOTE_F4  = 349;
var NOTE_FS4 = 370;
var NOTE_G4  = 392;
var NOTE_GS4 = 415;
var NOTE_A4  = 440;
var NOTE_AS4 = 466;
var NOTE_B4  = 494;
var NOTE_C5  = 523;
var NOTE_CS5 = 554;
var NOTE_D5  = 587;
var NOTE_DS5 = 622;
var NOTE_E5  = 659;
var NOTE_F5  = 698;
var NOTE_FS5 = 740;
var NOTE_G5  = 784;
var NOTE_GS5 = 831;
var NOTE_A5  = 880;
var NOTE_AS5 = 932;
var NOTE_B5  = 988;
var NOTE_C6  = 1047;
var NOTE_CS6 = 1109;
var NOTE_D6  = 1175;
var NOTE_DS6 = 1245;
var NOTE_E6  = 1319;
var NOTE_F6  = 1397;
var NOTE_FS6 = 1480;
var NOTE_G6  = 1568;
var NOTE_GS6 = 1661;
var NOTE_A6  = 1760;
var NOTE_AS6 = 1865;
var NOTE_B6  = 1976;
var NOTE_C7  = 2093;
var NOTE_CS7 = 2217;
var NOTE_D7  = 2349;
var NOTE_DS7 = 2489;
var NOTE_E7  = 2637;
var NOTE_F7  = 2794;
var NOTE_FS7 = 2960;
var NOTE_G7  = 3136;
var NOTE_GS7 = 3322;
var NOTE_A7  = 3520;
var NOTE_AS7 = 3729;
var NOTE_B7  = 3951;
var NOTE_C8  = 4186;
var NOTE_CS8 = 4435;
var NOTE_D8  = 4699;
var NOTE_DS8 = 4978;

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

function oscPatch(parentPatch, index) {
	var scale = cMinorNotes;
	var rowWidth = scale.length;
	var left = 150 + (index % rowWidth) * 200;
	var top = 320 + (Math.floor(index / rowWidth) * 200);
	var p = parentPatch;
	var octave = Math.floor(index / scale.length) + 1;
	octave = octave % MAX_OCTAVE;
 	var carrierFreq = scale[index % scale.length] * Math.pow(2, octave);
	
	var modulatorFreq = Math.random()*8 + 1;
	var carrier = parentPatch.newdefault(left,top,"cycle~", carrierFreq);
	var modDutyCycle = Math.random();
	var modulator = parentPatch.newdefault(left + 30,top + 20,"tri~", modulatorFreq, modDutyCycle);
	var signalMultiplier = parentPatch.newdefault(left, top + 50, "*~");
	var signalToFloat = parentPatch.newdefault(left, top + 80, 'number~');
	parentPatch.connect(carrier,0,signalMultiplier, 0);
	parentPatch.connect(modulator,0,signalMultiplier, 1);
	parentPatch.connect(signalMultiplier, 0, signalToFloat,0);
	
	return {
		patch: p,
		carrier: carrier,
		modulator: modulator,
		signalMultiplier: signalMultiplier,
		signalToFloat: signalToFloat,
		connect: function(){
			this.oscMessage = parentPatch.newdefault(left, top + 110, "message");// "/boidsong/oscs/" + index + "/amp", "$1");
			
			this.oscMessage.set("/boidsong/oscs/amp", index, modulatorFreq);
			this.oscMessage.size(150, 50);
			
			this.ampSend = parentPatch.newdefault(left, top + 140, "s", "amp");
			this.signalSend = parentPatch.newdefault(left + 60, top + 80, "s", "signal/" + index);
						
			parentPatch.connect(this.signalToFloat, 1, this.oscMessage, 0);
			parentPatch.connect(this.oscMessage, 0, this.ampSend, 0);
			parentPatch.connect(this.signalMultiplier, 0, hoaMap, index);
			parentPatch.connect(this.signalMultiplier, 0, this.signalSend, 0);

			return this;
		},
		remove: function() {
			parentPatch.remove(this.ampSend);
			parentPatch.remove(this.signalSend);
			parentPatch.remove(this.oscMessage);
			parentPatch.remove(this.signalToFloat);
			parentPatch.remove(this.carrier);
			parentPatch.remove(this.modulator);
			parentPatch.remove(this.signalMultiplier);
		}
	}
}

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
		// parse arguments
		for(var i=0;i<numOscillators;i++)
		{
			oscPatches[i].remove();
		}
		
		if(numOscillators) {
			this.patcher.remove(networkReceiver);
			this.patcher.remove(networkSender);
			this.patcher.remove(amplitudeReceiver);
			this.patcher.remove(unjoiner);
      		this.patcher.remove(joiner);
      		this.patcher.remove(hoaMap);
      		this.patcher.remove(hoaOptim);
      		this.patcher.remove(hoaDecoder);
      		this.patcher.remove(hoaDac);		
		}

		numOscillators = arguments[0];
		
		if(numOscillators) {
			amplitudeReceiver = this.patcher.newdefault(20, 220, "r", "amp");
			networkSender = this.patcher.newdefault(20, 250, "udpsend", "127.0.0.1", "6448");
			this.patcher.connect(amplitudeReceiver, 0, networkSender, 0);
			
			patchHoaAmbisonics();
		}

		for(var i=0;i<numOscillators;i++)
		{
			oscPatches[i] = oscPatch(this.patcher, i).connect();
		}
	}
}

function setOscillators(number) {
	numOscillators = number;
}

function save()
{
	embedmessage("setOscillators", numOscillators);
}
