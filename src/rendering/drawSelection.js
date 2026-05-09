import { CELL_W, CELL_H, CANVAS_H } from '../constants.js';

export function drawSelection(ctx, notes, selectedIds, totalCols, moveDelta = null, canvasW = null, displayW = null) {
  if (selectedIds.length === 0) return;

  const selected = notes.filter(n => selectedIds.includes(n.id));
  if (selected.length === 0) return;

  const dx = moveDelta ? moveDelta.dx : 0;
  const dy = moveDelta ? moveDelta.dy : 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  selected.forEach(note => {
    note.points.forEach(p => {
      const px = p.x + dx;
      const py = p.y + dy;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    });
  });

  const pad = CELL_H * 0.35;
  const bx = minX - pad;
  const by = minY - pad;
  const bw = (maxX - minX) + pad * 2;
  const bh = (maxY - minY) + pad * 2;

  if (canvasW != null && displayW != null) {
    const dpr = window.devicePixelRatio || 1;
    const deviceW = Math.round(displayW * dpr);
    const deviceH = Math.round(CANVAS_H * dpr);

    const deviceX = (bx / canvasW) * deviceW;
    const deviceY = (by / CANVAS_H) * deviceH;
    const deviceBW = (bw / canvasW) * deviceW;
    const deviceBH = (bh / CANVAS_H) * deviceH;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(deviceX, deviceY, deviceBW, deviceBH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
  }
}

export function drawSelectionBox(ctx, box, canvasW, displayW) {
  if (!box) return;

  const x = Math.min(box.x1, box.x2);
  const y = Math.min(box.y1, box.y2);
  const w = Math.abs(box.x2 - box.x1);
  const h = Math.abs(box.y2 - box.y1);

  const dpr = window.devicePixelRatio || 1;
  const deviceW = Math.round(displayW * dpr);
  const deviceH = Math.round(CANVAS_H * dpr);

  const deviceX = (x / canvasW) * deviceW;
  const deviceY = (y / CANVAS_H) * deviceH;
  const boxDeviceW = (w / canvasW) * deviceW;
  const boxDeviceH = (h / CANVAS_H) * deviceH;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5 * dpr;
  ctx.strokeRect(deviceX, deviceY, boxDeviceW, boxDeviceH);

  ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
  ctx.fillRect(deviceX, deviceY, boxDeviceW, boxDeviceH);
  ctx.restore();
}
