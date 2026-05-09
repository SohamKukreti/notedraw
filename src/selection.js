import { CELL_W, CELL_H } from './constants.js';

export function hitTestNote(x, y, notes) {
  const col = Math.floor(x / CELL_W);
  const row = Math.floor(y / CELL_H);
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    if (n.rowId === row && col >= n.startCol && col < n.startCol + n.durationCols) {
      return n;
    }
  }
  return null;
}

export function findNotesInBox(box, notes) {
  const x1 = Math.min(box.x1, box.x2);
  const y1 = Math.min(box.y1, box.y2);
  const x2 = Math.max(box.x1, box.x2);
  const y2 = Math.max(box.y1, box.y2);

  const leftCol   = Math.floor(x1 / CELL_W);
  const rightCol  = Math.floor(x2 / CELL_W);
  const topRow    = Math.floor(y1 / CELL_H);
  const bottomRow = Math.floor(y2 / CELL_H);

  return notes.filter(n => {
    const nLeft   = n.startCol;
    const nRight  = n.startCol + n.durationCols - 1;
    return n.rowId >= topRow && n.rowId <= bottomRow &&
           nLeft >= leftCol && nRight <= rightCol;
  });
}

export function moveNotes(notes, ids, deltaCol, deltaRow, totalCols) {
  return notes.map(n => {
    if (!ids.includes(n.id)) return n;
    const newStartCol = Math.max(0, Math.min(totalCols - 1, n.startCol + deltaCol));
    const newRowId    = Math.max(0, Math.min(131, n.rowId + deltaRow));
    return {
      ...n,
      startCol: newStartCol,
      rowId: newRowId,
      points: n.points.map(p => ({
        x: p.x + deltaCol * CELL_W,
        y: p.y + deltaRow * CELL_H,
      })),
    };
  });
}

export function serializeNotes(notes, ids) {
  const selected = notes.filter(n => ids.includes(n.id));
  return JSON.stringify(selected);
}

export function deserializeNotes(json, cursorCol, cursorRow) {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    let minCol = Infinity;
    let minRow = Infinity;
    parsed.forEach(n => {
      if (n.startCol < minCol) minCol = n.startCol;
      if (n.rowId < minRow) minRow = n.rowId;
    });

    const offsetCol = cursorCol - minCol;
    const offsetRow = cursorRow - minRow;
    const now = Date.now();

    return parsed.map((n, i) => ({
      ...n,
      id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      startCol: Math.max(0, n.startCol + offsetCol),
      rowId: Math.max(0, n.rowId + offsetRow),
      points: n.points.map(p => ({
        x: p.x + offsetCol * CELL_W,
        y: p.y + offsetRow * CELL_H,
      })),
    }));
  } catch {
    return null;
  }
}
