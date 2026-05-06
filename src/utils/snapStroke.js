import { xToCol, yToRow } from './gridMath.js';
import { CELL_H } from '../constants.js';

/**
 * Converts raw freehand points + selected instrument into a snapped Note.
 * totalCols is passed in so xToCol clamps correctly to the current grid width.
 */
export function snapStroke(points, instrument, totalCols) {
  if (!points || points.length === 0) return null;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  // Determine target row
  let rowId;
  if (instrument.fixedRowId !== null) {
    rowId = instrument.fixedRowId;
  } else {
    const sortedYs = [...ys].sort((a, b) => a - b);
    const medianY  = sortedYs[Math.floor(sortedYs.length / 2)];
    rowId = yToRow(medianY);
    rowId = Math.min(rowId, 23); // clamp to piano rows
  }

  const rowCenterY    = rowId * CELL_H + CELL_H / 2;
  const sortedYsAll   = [...ys].sort((a, b) => a - b);
  const strokeMedianY = sortedYsAll[Math.floor(sortedYsAll.length / 2)];

  const snappedPoints = points.map(p => ({
    x: p.x,
    y: rowCenterY + (p.y - strokeMedianY) * 0.25,
  }));

  const startCol     = xToCol(Math.min(...xs), totalCols);
  const endCol       = xToCol(Math.max(...xs), totalCols);
  const durationCols = Math.max(1, endCol - startCol + 1);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rowId,
    startCol,
    durationCols,
    color: instrument.color,
    points: snappedPoints,
  };
}
