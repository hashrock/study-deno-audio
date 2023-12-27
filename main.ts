import {
  PortAudio,
  SampleFormat,
  StreamFlags,
  type StreamParameters,
} from "https://deno.land/x/portaudio@0.2.0/mod.ts";
import { writeGraph } from "./image.ts";

const SAMPLE_RATE = 44100;
const FRAMES_PER_BUFFER = 1024;

const buffer = new Float32Array(FRAMES_PER_BUFFER * 2);

console.log(
  `PortAudio Test: output sine wave. SR = ${SAMPLE_RATE}, BufSize = ${FRAMES_PER_BUFFER}`,
);

PortAudio.initialize();

const outputParameters: StreamParameters = {
  device: PortAudio.getDefaultOutputDevice(), /* default output device */
  channelCount: 1,
  sampleFormat: SampleFormat.float32, /* 32 bit floating point output */
  suggestedLatency: 0.050, // Pa_GetDeviceInfo( outputParameters.device )->defaultLowOutputLatency;
};

const stream = PortAudio.openStream(
  null, /* no input */
  outputParameters,
  SAMPLE_RATE,
  FRAMES_PER_BUFFER,
  StreamFlags
    .clipOff, /* we won't output out of range samples so don't bother clipping them */
);

PortAudio.startStream(stream);

function osc(t: number, freq: number, amp = 1) {
  return Math.sin(t * freq * 2 * Math.PI) * amp;
}

let frame = 0;

function envelope(t: number, dur: number) {
  const attack = 0;
  const decay = 1000;
  const sustain = 0;
  const release = 0;

  if (t < attack) {
    return t / attack;
  } else if (t < attack + decay) {
    return 1 - ((t - attack) / decay) * (1 - sustain);
  } else if (t < dur - release) {
    return sustain;
  } else if (t < dur) {
    return sustain * (1 - (t - (dur - release)) / release);
  } else {
    return 0;
  }
}
function ar(attack: number, release: number) {
  return (t: number, dur: number) => {
    if (t < attack) {
      return t / attack;
    } else if (t < dur) {
      return 1 - (t - attack) / release;
    } else {
      return 0;
    }
  };
}

const kick = {
  pitch: ar(0, 200),
  amp: ar(0, 220),
};

const check: number[] = [];

function tune(msec: number) {
  const kickPitch = 100;
  const notes = [
    { freq: kickPitch, start: 0, dur: 0.25 },
    { freq: kickPitch, start: 0.25, dur: 0.25 },
    { freq: kickPitch, start: 0.5, dur: 0.25 },
    { freq: kickPitch, start: 0.75, dur: 0.25 },
  ];

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (msec >= note.start * 1000 && msec < (note.start + note.dur) * 1000) {
      const t = msec - note.start * 1000;
      const amp = kick.amp(t, note.dur * 1000);
      const pitch = kick.pitch(t, note.dur * 1000) * 200;
      return osc(t / 1000, pitch > 50 ? pitch : 50, amp > 0 ? amp : 0);
    }
  }
  return 0;
}

while (true) {
  for (let i = 0; i < FRAMES_PER_BUFFER; i++) {
    const msec = frame / SAMPLE_RATE * 1000;
    buffer[i * 2] = tune(msec);
    frame++;
  }
  // writeGraph(check);
  PortAudio.writeStream(stream, buffer, FRAMES_PER_BUFFER * 2);
}
