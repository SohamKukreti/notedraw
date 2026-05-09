import { useRef, useCallback } from 'react';
import { CANVAS_H } from '../constants.js';
import { drawGrid }       from '../rendering/drawGrid.js';
import { drawNotes }      from '../rendering/drawNotes.js';
import { drawStroke }     from '../rendering/drawStroke.js';
import { drawPlayhead }   from '../rendering/drawPlayhead.js';
import { drawSelection, drawSelectionBox } from '../rendering/drawSelection.js';

export function useCanvas() {
  const canvasRef = useRef(null);

  const initHiDPI = useCallback((canvasW, displayW) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr * displayW / canvasW, dpr);
  }, []);

  const redraw = useCallback((notes, liveStroke, playheadProgress, strokeColor, canvasW, totalCols, selectedNoteIds, selectionBox, moveDelta, displayW) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, CANVAS_H);
    drawGrid(ctx, totalCols, canvasW);
    drawNotes(ctx, notes, selectedNoteIds, moveDelta);
    if (liveStroke)           drawStroke(ctx, liveStroke, strokeColor);
    if (playheadProgress != null) drawPlayhead(ctx, playheadProgress, canvasW);
    drawSelection(ctx, notes, selectedNoteIds || [], totalCols, moveDelta, canvasW, displayW);
    drawSelectionBox(ctx, selectionBox, canvasW, displayW);
  }, []);

  return { canvasRef, initHiDPI, redraw };
}
