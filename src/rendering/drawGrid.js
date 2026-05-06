import { ROWS, CELL_W, CELL_H, CANVAS_H, SUBDIVISIONS, COLS_PER_BAR } from '../constants.js';

const DRUM_START_ROW = ROWS.findIndex(r => r.type !== 'piano');

export function drawGrid(ctx, totalCols, canvasW) {
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, CANVAS_H);

  // Row backgrounds
  ROWS.forEach((row, i) => {
    const y = i * CELL_H;
    ctx.fillStyle = row.type === 'piano' && row.isBlackKey
      ? 'rgba(0,0,0,0.04)'
      : 'transparent';
    if (ctx.fillStyle !== 'transparent') ctx.fillRect(0, y, canvasW, CELL_H);
  });

  // Horizontal row dividers
  ROWS.forEach((_, i) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, (i + 1) * CELL_H);
    ctx.lineTo(canvasW, (i + 1) * CELL_H);
    ctx.stroke();
  });

  // Bold separator between piano and drum sections
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, DRUM_START_ROW * CELL_H);
  ctx.lineTo(canvasW, DRUM_START_ROW * CELL_H);
  ctx.stroke();

  // Vertical subdivision / beat / bar lines
  for (let col = 0; col <= totalCols; col++) {
    const x      = col * CELL_W;
    const isBar  = col % COLS_PER_BAR === 0;
    const isBeat = col % SUBDIVISIONS === 0;

    ctx.strokeStyle = isBar
      ? 'rgba(0,0,0,0.25)'
      : isBeat
        ? 'rgba(0,0,0,0.1)'
        : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = isBar ? 1.5 : 0.5;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
}
