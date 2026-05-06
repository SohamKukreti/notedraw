import { useRef, useCallback } from 'react';
import { CANVAS_H } from '../constants.js';
import { drawGrid }     from '../rendering/drawGrid.js';
import { drawNotes }    from '../rendering/drawNotes.js';
import { drawStroke }   from '../rendering/drawStroke.js';
import { drawPlayhead } from '../rendering/drawPlayhead.js';

export function useCanvas() {
  const canvasRef = useRef(null);

  /**
   * Call when canvas logical size or display size changes.
   * displayW/displayH are the CSS pixel dimensions the canvas is shown at.
   * canvasW/CANVAS_H are the logical coordinate space used by all draw calls.
   */
  const initHiDPI = useCallback((canvasW, displayW) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr * displayW / canvasW, dpr);
  }, []);

  const redraw = useCallback((notes, liveStroke, playheadProgress, strokeColor, canvasW, totalCols) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, CANVAS_H);
    drawGrid(ctx, totalCols, canvasW);
    drawNotes(ctx, notes);
    if (liveStroke)           drawStroke(ctx, liveStroke, strokeColor);
    if (playheadProgress != null) drawPlayhead(ctx, playheadProgress, canvasW);
  }, []);

  return { canvasRef, initHiDPI, redraw };
}
