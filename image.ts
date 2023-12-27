import { createCanvas } from "https://deno.land/x/canvas/mod.ts";

export function writeGraphRaw(
  buffer: Float32Array,
  sampleRate: number,
  framesPerBuffer: number,
) {
  const canvas = createCanvas(2000, 200);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 200, 200);

  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(0, 100);
  for (let i = 0; i < framesPerBuffer; i++) {
    ctx.lineTo(i / framesPerBuffer * 200, 100 - buffer[i] * 100);
  }
  ctx.stroke();

  Deno.writeFile("image.png", canvas.toBuffer());
}

export function writeGraph(
  buffer: number[],
) {
  const canvas = createCanvas(2000, 200);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 2000, 200);

  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(0, 100);
  for (let i = 0; i < buffer.length; i++) {
    ctx.lineTo(i / buffer.length * 2000, 100 - buffer[i] * 100);
  }
  ctx.stroke();

  Deno.writeFile("image.png", canvas.toBuffer());
}
