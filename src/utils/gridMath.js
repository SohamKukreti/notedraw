import { CELL_W, CELL_H, TOTAL_ROWS, CANVAS_H } from '../constants.js';

/** Canvas-relative {x, y} in logical pixels, accounting for any CSS scaling */
export function getCanvasPoint(e, canvas, canvasW) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvasW / rect.width),
    y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
  };
}

/** Pixel X → column index (clamped) */
export function xToCol(x, totalCols) {
  return Math.max(0, Math.min(totalCols - 1, Math.floor(x / CELL_W)));
}

/** Pixel Y → row index (clamped) */
export function yToRow(y) {
  return Math.max(0, Math.min(TOTAL_ROWS - 1, Math.floor(y / CELL_H)));
}

/** Column index → left pixel edge */
export function colToX(col) { return col * CELL_W; }

/** Row index → top pixel edge */
export function rowToY(row) { return row * CELL_H; }
