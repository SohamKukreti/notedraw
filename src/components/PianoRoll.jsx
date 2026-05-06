import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CANVAS_H, getCanvasW, getTotalCols } from '../constants.js';
import { useCanvas } from '../hooks/useCanvas.js';
import { getCanvasPoint, xToCol, yToRow } from '../utils/gridMath.js';
import { snapStroke } from '../utils/snapStroke.js';

const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect x='2' y='9' width='24' height='15' rx='3' fill='%23FFB3B3' stroke='%23CC4444' stroke-width='1.5'/%3E%3Crect x='2' y='9' width='10' height='15' rx='2' fill='%23CC8888'/%3E%3Cline x1='12' y1='9' x2='12' y2='24' stroke='%23CC4444' stroke-width='1.5'/%3E%3C/svg%3E") 14 24, auto`;

export default function PianoRoll({
  notes,
  numBars,
  tool,
  isPlaying,
  selectedInstrument,
  displayW,
  displayH,
  onStrokeComplete,
  onNoteDelete,
  getProgress,
}) {
  const { canvasRef, initHiDPI, redraw } = useCanvas();
  const draggingRef     = useRef(false);
  const rightErasingRef = useRef(false);
  const pointsRef       = useRef([]);
  const rafRef          = useRef(null);
  const [livePoints,   setLivePoints]   = useState(null);
  const [rightErasing, setRightErasing] = useState(false);

  const canvasW   = getCanvasW(numBars);
  const totalCols = getTotalCols(numBars);

  // Reinitialise HiDPI buffer whenever logical or display size changes
  useEffect(() => {
    if (displayW > 0 && displayH > 0) {
      initHiDPI(canvasW, displayW, displayH);
    }
  }, [canvasW, displayW, displayH, initHiDPI]);

  // Redraw whenever visible content or canvas size changes (not during animation)
  useEffect(() => {
    if (!isPlaying) {
      redraw(notes, livePoints ? { points: livePoints } : null, null,
        selectedInstrument.color, canvasW, totalCols);
    }
  }, [notes, livePoints, isPlaying, selectedInstrument, canvasW, totalCols, displayW, displayH, redraw]);

  // Playhead animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        redraw(notes, null, getProgress(), null, canvasW, totalCols);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(rafRef.current);
        redraw(notes, null, null, null, canvasW, totalCols);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, notes, canvasW, totalCols]);

  // ── Global right-click release listener ──────────────────────────────────
  useEffect(() => {
    const onGlobalMouseUp = (e) => {
      if (e.button === 2 && rightErasingRef.current) {
        rightErasingRef.current = false;
        setRightErasing(false);
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // ── Hit-test ──────────────────────────────────────────────────────────────
  const findNote = useCallback((x, y) => {
    const col = xToCol(x, totalCols);
    const row = yToRow(y);
    return notes.find(n =>
      n.rowId === row &&
      col >= n.startCol &&
      col < n.startCol + n.durationCols
    );
  }, [notes, totalCols]);

  // ── Commit stroke ─────────────────────────────────────────────────────────
  const commitCurrentStroke = useCallback(() => {
    const pts = pointsRef.current;
    if (pts.length > 0 && tool === 'draw') {
      const note = snapStroke(pts, selectedInstrument, totalCols);
      if (note) onStrokeComplete(note);
    }
    pointsRef.current = [];
    setLivePoints(null);
    draggingRef.current = false;
  }, [tool, selectedInstrument, totalCols, onStrokeComplete]);

  // ── Mouse events ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button === 2) {
      // Right-click: activate temporary erase mode
      rightErasingRef.current = true;
      setRightErasing(true);
      const pt = getCanvasPoint(e, canvasRef.current, canvasW);
      const hit = findNote(pt.x, pt.y);
      if (hit) onNoteDelete(hit.id);
      return;
    }
    if (e.button !== 0) return;
    const pt = getCanvasPoint(e, canvasRef.current, canvasW);
    draggingRef.current = true;
    if (tool === 'erase') {
      const hit = findNote(pt.x, pt.y);
      if (hit) onNoteDelete(hit.id);
      return;
    }
    pointsRef.current = [pt];
    setLivePoints([pt]);
  }, [tool, findNote, onNoteDelete, canvasRef, canvasW]);

  const handleMouseMove = useCallback((e) => {
    if (rightErasingRef.current) {
      const pt = getCanvasPoint(e, canvasRef.current, canvasW);
      const hit = findNote(pt.x, pt.y);
      if (hit) onNoteDelete(hit.id);
      return;
    }
    if (!draggingRef.current) return;
    const pt = getCanvasPoint(e, canvasRef.current, canvasW);
    if (tool === 'erase') {
      const hit = findNote(pt.x, pt.y);
      if (hit) onNoteDelete(hit.id);
      return;
    }
    pointsRef.current = [...pointsRef.current, pt];
    setLivePoints([...pointsRef.current]);
  }, [tool, findNote, onNoteDelete, canvasRef, canvasW]);

  const handleMouseUp = useCallback((e) => {
    if (e.button === 2) {
      rightErasingRef.current = false;
      setRightErasing(false);
      return;
    }
    if (e.button !== 0) return;
    commitCurrentStroke();
  }, [commitCurrentStroke]);

  const handleMouseLeave = useCallback(() => {
    if (rightErasingRef.current) {
      rightErasingRef.current = false;
      setRightErasing(false);
    }
    if (draggingRef.current) commitCurrentStroke();
  }, [commitCurrentStroke]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  // ── Touch events ──────────────────────────────────────────────────────────
  const getTouchPt = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const t      = e.touches[0];
    return {
      x: (t.clientX - rect.left) * (canvasW  / rect.width),
      y: (t.clientY - rect.top)  * (CANVAS_H / rect.height),
    };
  }, [canvasRef, canvasW]);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const pt = getTouchPt(e);
    draggingRef.current = true;
    if (tool === 'erase') { const hit = findNote(pt.x, pt.y); if (hit) onNoteDelete(hit.id); return; }
    pointsRef.current = [pt];
    setLivePoints([pt]);
  }, [tool, findNote, onNoteDelete, getTouchPt]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!draggingRef.current) return;
    const pt = getTouchPt(e);
    if (tool === 'erase') { const hit = findNote(pt.x, pt.y); if (hit) onNoteDelete(hit.id); return; }
    pointsRef.current = [...pointsRef.current, pt];
    setLivePoints([...pointsRef.current]);
  }, [tool, findNote, onNoteDelete, getTouchPt]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    commitCurrentStroke();
  }, [commitCurrentStroke]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: displayW || canvasW,
        height: displayH || CANVAS_H,
        cursor: (rightErasing || tool === 'erase') ? ERASER_CURSOR : 'crosshair',
        touchAction: 'none',
        flexShrink: 0,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
