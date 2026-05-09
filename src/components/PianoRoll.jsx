import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CANVAS_H, getCanvasW, getTotalCols, CELL_W, CELL_H } from '../constants.js';
import { useCanvas } from '../hooks/useCanvas.js';
import { getCanvasPoint, xToCol, yToRow } from '../utils/gridMath.js';
import { snapStroke } from '../utils/snapStroke.js';
import { hitTestNote, findNotesInBox } from '../selection.js';

const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect x='2' y='9' width='24' height='15' rx='3' fill='%23FFB3B3' stroke='%23CC4444' stroke-width='1.5'/%3E%3Crect x='2' y='9' width='10' height='15' rx='2' fill='%23CC8888'/%3E%3Cline x1='12' y1='9' x2='12' y2='24' stroke='%23CC4444' stroke-width='1.5'/%3E%3C/svg%3E") 14 24, auto`;

export default function PianoRoll({
  notes,
  numBars,
  tool,
  isPlaying,
  selectedInstrument,
  displayW,
  selectedNoteIds,
  onStrokeComplete,
  onNoteDelete,
  onSelectNotes,
  onDeselectAll,
  onNotesMove,
  onDeleteSelected,
  getProgress,
}) {
  const { canvasRef, initHiDPI, redraw } = useCanvas();
  const draggingRef       = useRef(false);
  const rightErasingRef   = useRef(false);
  const pointsRef         = useRef([]);
  const rafRef            = useRef(null);
  const [livePoints,     setLivePoints]   = useState(null);
  const [rightErasing,   setRightErasing] = useState(false);

  const selectDragRef     = useRef(null);
  const selectionBoxRef   = useRef(null);
  const moveStartRef      = useRef(null);
  const [selectionBox,   setSelectionBox] = useState(null);
  const [moveDelta,      setMoveDelta]    = useState(null);

  const canvasW   = getCanvasW(numBars);
  const totalCols = getTotalCols(numBars);

  const notesRef = useRef(notes);
  notesRef.current = notes;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const selectedNoteIdsRef = useRef(selectedNoteIds);
  selectedNoteIdsRef.current = selectedNoteIds;

  useEffect(() => {
    if (displayW > 0) {
      initHiDPI(canvasW, displayW);
    }
  }, [canvasW, displayW, initHiDPI]);

  useEffect(() => {
    if (!isPlaying) {
      redraw(notes, livePoints ? { points: livePoints } : null, null,
        selectedInstrument.color, canvasW, totalCols, selectedNoteIds, selectionBox, moveDelta, displayW);
    }
  }, [notes, livePoints, isPlaying, selectedInstrument, canvasW, totalCols, displayW, redraw, selectedNoteIds, selectionBox, moveDelta]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        redraw(notes, null, getProgress(), null, canvasW, totalCols, selectedNoteIds, null, null, displayW);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(rafRef.current);
        redraw(notes, null, null, null, canvasW, totalCols, selectedNoteIds, null, null, displayW);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, notes, canvasW, totalCols, displayW]);

  const getRelativePt = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasW / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  }, [canvasRef, canvasW]);

  const findNoteAt = useCallback((x, y, notesList, cols) => {
    const col = xToCol(x, cols);
    const row = yToRow(y);
    return notesList.find(n =>
      n.rowId === row &&
      col >= n.startCol &&
      col < n.startCol + n.durationCols
    );
  }, []);

  useEffect(() => {
    const onGlobalMouseMove = (e) => {
      if (!draggingRef.current) return;

      const currentTool = toolRef.current;
      const currentNotes = notesRef.current;
      const pt = getRelativePt(e);

      if (rightErasingRef.current || currentTool === 'erase') {
        const hit = findNoteAt(pt.x, pt.y, currentNotes, totalCols);
        if (hit) onNoteDelete(hit.id);
        if (canvasRef.current) canvasRef.current.style.cursor = ERASER_CURSOR;
        return;
      }

      if (currentTool === 'select') {
        if (moveStartRef.current) {
          moveStartRef.current.endPt = pt;
          setMoveDelta({ dx: pt.x - moveStartRef.current.startPt.x, dy: pt.y - moveStartRef.current.startPt.y });
          return;
        }
        if (selectDragRef.current) {
          selectDragRef.current.active = true;
          const startPt = selectDragRef.current.startPt;
          selectionBoxRef.current = { x1: startPt.x, y1: startPt.y, x2: pt.x, y2: pt.y };
          setSelectionBox({ x1: startPt.x, y1: startPt.y, x2: pt.x, y2: pt.y });
          return;
        }
      }

      pointsRef.current = [...pointsRef.current, pt];
      setLivePoints([...pointsRef.current]);
    };

    const onGlobalMouseUp = (e) => {
      if (e.button === 2 && rightErasingRef.current) {
        rightErasingRef.current = false;
        draggingRef.current = false;
        setRightErasing(false);
        return;
      }
      if (e.button !== 0 || !draggingRef.current) return;

      const currentTool = toolRef.current;
      const currentNotes = notesRef.current;
      const currentIds = selectedNoteIdsRef.current;

      if (currentTool === 'select') {
        if (moveStartRef.current) {
          const drag = moveStartRef.current;
          const dx = drag.endPt.x - drag.startPt.x;
          const dy = drag.endPt.y - drag.startPt.y;
          const deltaCol = Math.round(dx / CELL_W);
          const deltaRow = Math.round(dy / CELL_H);
          if (deltaCol !== 0 || deltaRow !== 0) {
            onNotesMove(currentIds, deltaCol, deltaRow);
          }
          moveStartRef.current = null;
        } else if (selectDragRef.current && selectDragRef.current.active) {
          const box = selectionBoxRef.current;
          if (box) {
            const matched = findNotesInBox(box, currentNotes);
            if (matched.length > 0) {
              onSelectNotes(matched.map(n => n.id), false);
            }
            selectionBoxRef.current = null;
            setSelectionBox(null);
          }
        }
        selectDragRef.current = null;
        moveStartRef.current = null;
        draggingRef.current = false;
        setMoveDelta(null);
        return;
      }

      if (currentTool === 'erase' || rightErasingRef.current) {
        draggingRef.current = false;
        rightErasingRef.current = false;
        setRightErasing(false);
        return;
      }

      const pts = pointsRef.current;
      if (pts.length > 0) {
        const note = snapStroke(pts, selectedInstrument, totalCols);
        if (note) onStrokeComplete(note);
      }
      pointsRef.current = [];
      setLivePoints(null);
      draggingRef.current = false;
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [getRelativePt, findNoteAt, totalCols, selectedInstrument, onNoteDelete, onNotesMove, onSelectNotes, onStrokeComplete]);

  const getSelectionBounds = useCallback(() => {
    const selected = notes.filter(n => selectedNoteIds.includes(n.id));
    if (selected.length === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    selected.forEach(note => {
      note.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const pad = CELL_H * 0.35;
    return { x1: minX - pad, y1: minY - pad, x2: maxX + pad, y2: maxY + pad };
  }, [notes, selectedNoteIds]);

  const handleSelectMouseDown = useCallback((pt, shiftKey) => {
    const hit = hitTestNote(pt.x, pt.y, notes);

    if (hit && selectedNoteIds.includes(hit.id)) {
      draggingRef.current = true;
      moveStartRef.current = { startPt: pt, endPt: pt };
      return;
    }

    const bounds = getSelectionBounds();
    if (bounds && pt.x >= bounds.x1 && pt.x <= bounds.x2 && pt.y >= bounds.y1 && pt.y <= bounds.y2) {
      draggingRef.current = true;
      moveStartRef.current = { startPt: pt, endPt: pt };
      return;
    }

    if (hit) {
      onSelectNotes([hit.id], !shiftKey);
      return;
    }

    if (!shiftKey) {
      onDeselectAll();
    }

    draggingRef.current = true;
    selectDragRef.current = { startPt: pt, active: false };
  }, [notes, selectedNoteIds, onSelectNotes, onDeselectAll, getSelectionBounds]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 2) {
      rightErasingRef.current = true;
      draggingRef.current = true;
      setRightErasing(true);
      const pt = getCanvasPoint(e, canvasRef.current, canvasW);
      const hit = findNoteAt(pt.x, pt.y, notes, totalCols);
      if (hit) onNoteDelete(hit.id);
      return;
    }
    if (e.button !== 0) return;

    const pt = getCanvasPoint(e, canvasRef.current, canvasW);

    if (tool === 'select') {
      handleSelectMouseDown(pt, e.shiftKey);
      return;
    }

    draggingRef.current = true;
    if (tool === 'erase') {
      const hit = findNoteAt(pt.x, pt.y, notes, totalCols);
      if (hit) onNoteDelete(hit.id);
      return;
    }

    pointsRef.current = [pt];
    setLivePoints([pt]);
  }, [tool, notes, totalCols, findNoteAt, onNoteDelete, canvasRef, canvasW, handleSelectMouseDown]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

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
    if (tool === 'select') { handleSelectMouseDown(pt, false); return; }
    if (tool === 'erase') { const hit = findNoteAt(pt.x, pt.y, notes, totalCols); if (hit) onNoteDelete(hit.id); return; }
    pointsRef.current = [pt];
    setLivePoints([pt]);
  }, [tool, notes, totalCols, findNoteAt, onNoteDelete, getTouchPt, handleSelectMouseDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!draggingRef.current) return;
    const pt = getTouchPt(e);
    const currentTool = toolRef.current;
    const currentNotes = notesRef.current;
    if (currentTool === 'erase') { const hit = findNoteAt(pt.x, pt.y, currentNotes, totalCols); if (hit) onNoteDelete(hit.id); return; }
    if (currentTool === 'select') {
      if (moveStartRef.current) {
        moveStartRef.current.endPt = pt;
        setMoveDelta({ dx: pt.x - moveStartRef.current.startPt.x, dy: pt.y - moveStartRef.current.startPt.y });
        return;
      }
      if (selectDragRef.current) {
        selectDragRef.current.active = true;
        const startPt = selectDragRef.current.startPt;
        selectionBoxRef.current = { x1: startPt.x, y1: startPt.y, x2: pt.x, y2: pt.y };
        setSelectionBox({ x1: startPt.x, y1: startPt.y, x2: pt.x, y2: pt.y });
        return;
      }
    }
    pointsRef.current = [...pointsRef.current, pt];
    setLivePoints([...pointsRef.current]);
  }, [getTouchPt, findNoteAt, totalCols, onNoteDelete]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (!draggingRef.current) return;

    const currentTool = toolRef.current;
    const currentNotes = notesRef.current;
    const currentIds = selectedNoteIdsRef.current;

    if (currentTool === 'select') {
      if (moveStartRef.current) {
        const drag = moveStartRef.current;
        const dx = drag.endPt.x - drag.startPt.x;
        const dy = drag.endPt.y - drag.startPt.y;
        const deltaCol = Math.round(dx / CELL_W);
        const deltaRow = Math.round(dy / CELL_H);
        if (deltaCol !== 0 || deltaRow !== 0) {
          onNotesMove(currentIds, deltaCol, deltaRow);
        }
        moveStartRef.current = null;
      } else if (selectDragRef.current && selectDragRef.current.active) {
        const box = selectionBoxRef.current;
        if (box) {
          const matched = findNotesInBox(box, currentNotes);
          if (matched.length > 0) {
            onSelectNotes(matched.map(n => n.id), false);
          }
          selectionBoxRef.current = null;
          setSelectionBox(null);
        }
      }
      selectDragRef.current = null;
      moveStartRef.current = null;
      draggingRef.current = false;
      setMoveDelta(null);
      return;
    }

    const pts = pointsRef.current;
    if (pts.length > 0 && currentTool === 'draw') {
      const note = snapStroke(pts, selectedInstrument, totalCols);
      if (note) onStrokeComplete(note);
    }
    pointsRef.current = [];
    setLivePoints(null);
    draggingRef.current = false;
  }, [onNotesMove, onSelectNotes, onStrokeComplete, selectedInstrument, totalCols]);

  const getCursor = useCallback(() => {
    if (tool === 'erase' || rightErasing) return ERASER_CURSOR;
    if (tool !== 'select') return 'crosshair';

    const drag = selectDragRef.current;
    const move = moveStartRef.current;
    if (move) return 'grabbing';
    if (drag && drag.active) return 'crosshair';
    return 'default';
  }, [tool, rightErasing]);

  const handleCursorUpdate = useCallback((e) => {
    if (rightErasingRef.current || moveStartRef.current || selectDragRef.current?.active) return;

    const pt = getCanvasPoint(e, canvasRef.current, canvasW);
    const hit = hitTestNote(pt.x, pt.y, notes);

    if (hit && selectedNoteIds.includes(hit.id)) {
      canvasRef.current.style.cursor = 'grab';
      return;
    }

    const bounds = getSelectionBounds();
    if (bounds && pt.x >= bounds.x1 && pt.x <= bounds.x2 && pt.y >= bounds.y1 && pt.y <= bounds.y2) {
      canvasRef.current.style.cursor = 'grab';
      return;
    }

    canvasRef.current.style.cursor = 'default';
  }, [canvasRef, canvasW, notes, selectedNoteIds, getSelectionBounds]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: displayW || canvasW,
        height: CANVAS_H,
        cursor: getCursor(),
        touchAction: 'none',
        flexShrink: 0,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleCursorUpdate}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
