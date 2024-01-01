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

interface Instrument {
  pitch: (t: number, dur: number) => number;
  amp: (t: number, dur: number) => number;
}

interface Note {
  freq: number;
  start: number;
  dur: number;
  vel?: number;
}

const kick: Instrument = {
  pitch: ar(0, 200),
  amp: ar(0, 220),
};

const hihat: Instrument = {
  pitch: () => {
    return 1;
  },
  amp: ar(0, 20),
};

const check: number[] = [];

function noise(amp: number) {
  return (Math.random() * 2 - 1) * amp;
}

function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

function tune(msec: number) {
  const kickPitch = 100;
  const notes: Note[] = [
    { freq: kickPitch, start: 0, dur: 0.25 },
    { freq: kickPitch, start: 0.25, dur: 0.25 },
    { freq: kickPitch, start: 0.5, dur: 0.25 },
    { freq: kickPitch, start: 0.75, dur: 0.25 },
  ];

  const hihatNotes: Note[] = [
    { freq: 1000, start: 0 / 16, dur: 1 / 16 },
    { freq: 1000, start: 1 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 2 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 3 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 4 / 16, dur: 1 / 16 },
    { freq: 1000, start: 5 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 6 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 7 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 8 / 16, dur: 1 / 16 },
    { freq: 1000, start: 9 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 10 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 11 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 12 / 16, dur: 1 / 16 },
    { freq: 1000, start: 13 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 14 / 16, dur: 1 / 16, vel: 0.5 },
    { freq: 1000, start: 15 / 16, dur: 1 / 16, vel: 0.5 },
  ];

  function match(notes: Note[], msec: number): Note | null {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (msec >= note.start * 1000 && msec < (note.start + note.dur) * 1000) {
        return note;
      }
    }
    return null;
  }

  for (let i = 0; i < notes.length; i++) {
    const matchedNote = match(notes, msec);
    let ch1 = 0;
    let ch2 = 0;
    if (matchedNote) {
      const note = matchedNote;
      const t = msec - note.start * 1000;
      const amp = clamp(kick.amp(t, note.dur * 1000), 0, 1);
      const pitch = clamp(kick.pitch(t, note.dur * 1000) * 200, 80, 1000);

      ch1 = osc(t / 1000, pitch, amp);
    }

    const matchedHiHatNote = match(hihatNotes, msec);
    if (matchedHiHatNote) {
      const note = matchedHiHatNote;
      const t = msec - note.start * 1000;
      const amp = clamp(hihat.amp(t, note.dur * 1000), 0, 1);
      ch2 = noise(amp) * 0.1 * (note.vel ?? 0.8);
    }

    const ch = ch1 + ch2;
    return ch;
  }
  return 0;
}

const LENGTH = 2;

while (true) {
  for (let i = 0; i < FRAMES_PER_BUFFER; i++) {
    const msec = frame / SAMPLE_RATE * 1000;
    buffer[i * 2] = tune(msec);
    frame++;
  }
  check.push(...buffer);
  PortAudio.writeStream(stream, buffer, FRAMES_PER_BUFFER * 2);
  if (frame > LENGTH * SAMPLE_RATE) break;
}

writeGraph(check);
