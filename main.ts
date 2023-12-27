/**
 * A basic example of playing a sine wave. This is directly ported from portaudio's paex_write_sine.c so the code is definitely more dubious then it has to be.
 *
 * @module
 */
import {
  PortAudio,
  SampleFormat,
  StreamFlags,
  type StreamParameters,
} from "https://deno.land/x/portaudio@0.2.0/mod.ts";

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

let t = 0;

while (true) {
  for (let i = 0; i < FRAMES_PER_BUFFER; i++) {
    const msec = t / SAMPLE_RATE;
    buffer[i * 2] = osc(msec, 880, 1);
    t++;
  }
  PortAudio.writeStream(stream, buffer, FRAMES_PER_BUFFER * 2);
}
