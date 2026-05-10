import { CELL_H } from '../constants.js';

/** Draws a smoothed brush stroke through the given points */
function drawBrushPath(ctx, points) {
  if (points.length < 2) {
    // Single point — draw a dot
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Smooth with quadratic bezier through midpoints
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }

  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

export function drawNotes(ctx, notes, selectedNoteIds = [], moveDelta = null) {
  const selectedSet = new Set(selectedNoteIds);

  notes.forEach(note => {
    if (!note.points || note.points.length === 0) return;

    const isSelected = selectedSet.has(note.id);
    const offsetX = (isSelected && moveDelta) ? moveDelta.dx : 0;
    const offsetY = (isSelected && moveDelta) ? moveDelta.dy : 0;

    const pts = note.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

    ctx.globalAlpha = (note.volume ?? 100) / 100;
    ctx.strokeStyle = note.color;
    ctx.lineWidth   = CELL_H * 0.52;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    drawBrushPath(ctx, pts);
  });
  ctx.globalAlpha = 1;
}
