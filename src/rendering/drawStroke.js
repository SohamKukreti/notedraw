import { CELL_H } from '../constants.js';

export function drawStroke(ctx, liveStroke, color) {
  const { points } = liveStroke;
  if (!points || points.length < 2) return;

  ctx.strokeStyle = color || 'rgba(0,0,0,0.3)';
  ctx.globalAlpha = 0.45;
  ctx.lineWidth   = CELL_H * 0.52;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();

  ctx.globalAlpha = 1;
}
