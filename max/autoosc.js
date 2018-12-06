var numOscillators = 0;
var oscPatches = new Array(64);
var networkReceiver;
var networkSender;

var MAX_OCTAVE = 4;

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

function makeOscSubpatch(patch, carrierFreq) {
	var modulatorFreq = Math.random()*8 + 1;
	var ins = [
		patch.newdefault(60,20, "inlet"),
		patch.newdefault(120,20, "inlet"),
		patch.newdefault(220,130, "inlet"),
		patch.newdefault(300,300, "inlet")
	];
	var carrier = patch.newdefault(20,90,"cycle~", carrierFreq);
	var modDutyCycle = Math.random();
	var modulator = patch.newdefault(150,90,"tri~", modulatorFreq, modDutyCycle);
	var signalMultiplier = patch.newdefault(100, 130, "*~");
	var signalToFloat = patch.newdefault(50, 200, 'number~');
	var inputGain = patch.newdefault(160, 180,"*~");
	var pan = patch.newdefault(150, 350, "pan2");
	var outs = [
		patch.newdefault(50,250, "outlet"),
		patch.newdefault(150,400, "outlet"),
		patch.newdefault(200,400, "outlet")
	];
	patch.connect(ins[0],0,carrier,0);
	patch.connect(ins[1],0,modulator,0);
	patch.connect(carrier,0,signalMultiplier, 0);
	patch.connect(modulator,0,signalMultiplier, 1);
	patch.connect(signalMultiplier,0,inputGain,0);
	patch.connect(ins[2],0,inputGain,0);
	patch.connect(inputGain,0,pan,0);
	patch.connect(ins[3],0,pan,1);
	patch.connect(signalMultiplier, 0, signalToFloat,0);
	patch.connect(signalToFloat, 1, outs[0],0);
	patch.connect(pan,0,outs[1],0);
	patch.connect(pan,1,outs[2],0);
}

function oscPatch(parentPatch, index) {
	var scale = cMinorNotes;
	var rowWidth = scale.length;
	var left = 200 + (index % rowWidth) * 200;
	var top = 200 + (Math.floor(index / rowWidth) * 200);
	var p = parentPatch.newdefault(left, top,"p","osc");
	var octave = Math.floor(index / scale.length) + 1;
	octave = octave % MAX_OCTAVE;
 	var carrierFreq = scale[index % scale.length] * Math.pow(2, octave);
	makeOscSubpatch(p.subpatcher(), carrierFreq);

	return {
		patch: p,
		connect: function(){
			this.routepass = parentPatch.newdefault(left, top - 80, "routepass", "/boidsong/boid/" + index + "/pos");
			this.unjoiner = parentPatch.newdefault(left, top - 40, "unjoin", "3");

			this.oscMessage = parentPatch.newdefault(left, top + 80, "message");// "/boidsong/oscs/" + index + "/amp", "$1");

			this.oscMessage.set("/boidsong/oscs/" + index + "/amp","$1");

			this.leftSend = parentPatch.newdefault(left, top + 40, "s", "left");
			this.rightSend = parentPatch.newdefault(left + 100, top + 40, "s", "right");
			parentPatch.hiddenconnect(networkReceiver, 0, this.routepass, 0);
			parentPatch.connect(this.routepass, 0, this.unjoiner, 0);
			parentPatch.connect(this.unjoiner, 1, this.patch, 2);
			parentPatch.connect(this.unjoiner, 2, this.patch, 3);
			parentPatch.connect(this.patch,1,this.leftSend,0);
			parentPatch.connect(this.patch,2,this.rightSend,0);
			parentPatch.connect(this.patch,0,this.oscMessage,0);
			parentPatch.hiddenconnect(this.oscMessage, 0, networkSender, 0)

			return this;
		},
		remove: function() {
			parentPatch.remove(this.patch);
			parentPatch.remove(this.OSCreceiver);
			parentPatch.remove(this.routepass);
			parentPatch.remove(this.unjoiner);
			parentPatch.remove(this.leftSend);
			parentPatch.remove(this.rightSend);
			parentPatch.remove(this.oscMessage);
		}
	}
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

		if(numOscillators && !!networkReceiver) {
			this.patcher.remove(networkReceiver);
			this.patcher.remove(networkSender);
		}

		numOscillators = arguments[0];

		if(numOscillators) {
			networkReceiver = this.patcher.newdefault(30, 400, "udpreceive", "6448");
			networkSender = this.patcher.newdefault(30, 450, "udpsend", "127.0.0.1", "6448");
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
