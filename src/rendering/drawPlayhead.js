import { CANVAS_H } from '../constants.js';

export function drawPlayhead(ctx, progress, canvasW) {
  if (progress == null || progress <= 0) return;
  const x = progress * canvasW;

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, CANVAS_H);
  ctx.stroke();
}
