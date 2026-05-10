import React, { useState, useCallback, useRef, useEffect } from 'react';
import Toolbar   from './components/Toolbar.jsx';
import RowLabels from './components/RowLabels.jsx';
import PianoRoll from './components/PianoRoll.jsx';
import { useAudio } from './hooks/useAudio.js';
import { useUndoRedo } from './hooks/useUndoRedo.js';
import { exportMp3 } from './utils/exportMp3.js';
import { INSTRUMENTS, COLS_PER_BAR, LABEL_W, CELL_H, CELL_W, getTotalCols } from './constants.js';
import { serializeNotes } from './selection.js';

const E4_Y = (6 * 12 + 7) * CELL_H;

const MAX_FIT_BARS  = 4;
const BTN_W         = 72;
const GRID_ZOOM     = 1.2;

export default function App() {
  const { present: notes, set: setNotes, undo, redo, canUndo, canRedo } = useUndoRedo([]);
  const [numBars,            setNumBars]            = useState(1);
  const [bpm,                setBpm]                = useState(120);
  const [isPlaying,          setIsPlaying]          = useState(false);
  const [tool,               setTool]               = useState('draw');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [exporting,          setExporting]          = useState(false);
  const [selectedNoteIds,    setSelectedNoteIds]    = useState([]);
  const [currentVolume,      setCurrentVolume]      = useState(100);

  const scrollRef           = useRef(null);
  const initialScrollDone   = useRef(false);
  const [gridDims, setGridDims] = useState({ w: 0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setGridDims({ w: Math.round(width) });
      if (!initialScrollDone.current && el.clientHeight > 0) {
        el.scrollTop = E4_Y - el.clientHeight / 2;
        initialScrollDone.current = true;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseCanvasW    = Math.max(0, gridDims.w - LABEL_W - BTN_W);
  const canvasDisplayW = Math.round((numBars <= MAX_FIT_BARS
    ? baseCanvasW
    : Math.round(baseCanvasW * numBars / MAX_FIT_BARS)) * GRID_ZOOM);

  const panStart    = useRef(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning,   setPanning]   = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setPanning(false);
        panStart.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, []);

  const handlePanMouseDown = useCallback((e) => {
    setPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollRef.current?.scrollLeft ?? 0,
      scrollTop:  scrollRef.current?.scrollTop  ?? 0,
    };
  }, []);

  const handlePanMouseMove = useCallback((e) => {
    if (!panning || !panStart.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x);
    scrollRef.current.scrollTop  = panStart.current.scrollTop  - (e.clientY - panStart.current.y);
  }, [panning]);

  const handlePanEnd = useCallback(() => {
    setPanning(false);
    panStart.current = null;
  }, []);

  const { play, pause, stop, getProgress } = useAudio(notes, bpm, numBars);

  const handleAddBar = useCallback(() => setNumBars(n => n + 1), []);

  const handleRemoveBar = useCallback(() => {
    if (numBars <= 1) return;
    const newNumBars = numBars - 1;
    const cutoffCol  = newNumBars * COLS_PER_BAR;
    setNumBars(newNumBars);
    setNotes(prev => prev.filter(n => n.startCol < cutoffCol));
  }, [numBars, setNotes]);

  const handlePlay  = useCallback(async () => { await play(); setIsPlaying(true);  }, [play]);
  const handlePause = useCallback(() => { pause(); setIsPlaying(false); }, [pause]);
  const handleStop  = useCallback(() => { stop();  setIsPlaying(false); }, [stop]);
  const handleClear = useCallback(() => { stop();  setIsPlaying(false); setNotes([]); setSelectedNoteIds([]); }, [stop, setNotes]);

  const handleExport = useCallback(async () => {
    if (exporting || notes.length === 0) return;
    setExporting(true);
    try {
      await exportMp3(notes, bpm, numBars);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }, [exporting, notes, bpm, numBars]);

  const handleSelectNotes = useCallback((ids, replace) => {
    setSelectedNoteIds(prev => {
      if (replace) return ids;
      const set = new Set(prev);
      ids.forEach(id => set.add(id));
      return Array.from(set);
    });
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedNoteIds([]);
  }, []);

  const handleNotesMove = useCallback((ids, deltaCol, deltaRow) => {
    const totalCols = getTotalCols(numBars);
    setNotes(prev => {
      return prev.map(n => {
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
    });
  }, [numBars, setNotes]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNoteIds.length === 0) return;
    setNotes(prev => prev.filter(n => !selectedNoteIds.includes(n.id)));
    setSelectedNoteIds([]);
  }, [selectedNoteIds, setNotes]);

  const clipboardRef = useRef(null);

  const handleCopy = useCallback(() => {
    if (selectedNoteIds.length === 0) return;
    clipboardRef.current = JSON.parse(serializeNotes(notes, selectedNoteIds));
  }, [notes, selectedNoteIds]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.length === 0) return;

    const src = clipboardRef.current;
    let minCol = Infinity;
    let minRow = Infinity;
    src.forEach(n => {
      if (n.startCol < minCol) minCol = n.startCol;
      if (n.rowId < minRow) minRow = n.rowId;
    });

    const now = Date.now();
    const totalCols = getTotalCols(numBars);
    const newNotes = src.map((n, i) => {
      const newCol = Math.max(0, Math.min(totalCols - 1, n.startCol + 1));
      const newRow = Math.max(0, Math.min(131, n.rowId + 1));
      return {
        ...n,
        id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        startCol: newCol,
        rowId: newRow,
        points: n.points.map(p => ({
          x: p.x + CELL_W,
          y: p.y + CELL_H,
        })),
      };
    });

    clipboardRef.current = clipboardRef.current.map(n => {
      const newCol = Math.max(0, Math.min(totalCols - 1, n.startCol + 1));
      const newRow = Math.max(0, Math.min(131, n.rowId + 1));
      return {
        ...n,
        startCol: newCol,
        rowId: newRow,
        points: n.points.map(p => ({
          x: p.x + CELL_W,
          y: p.y + CELL_H,
        })),
      };
    });

    setNotes(prev => [...prev, ...newNotes]);
    setSelectedNoteIds(newNotes.map(n => n.id));
  }, [numBars, setNotes]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((isCtrl && e.shiftKey && e.key === 'Z') || (isCtrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (isCtrl && e.key === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }
      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
          handleDeleteSelected();
          return;
        }
      }
      if (e.key === 'Escape') {
        handleDeselectAll();
        return;
      }
      if (e.key === 'v' && !isCtrl && e.target.tagName !== 'INPUT') {
        setTool('select');
        return;
      }
      if (e.key === 'd' && !isCtrl && e.target.tagName !== 'INPUT') {
        setTool('draw');
        return;
      }
      if (e.key === 'e' && !isCtrl && e.target.tagName !== 'INPUT') {
        setTool('erase');
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, handleCopy, handlePaste, handleDeleteSelected, handleDeselectAll]);

  const sectionBtn = (disabled) => ({
    width: 36,
    alignSelf: 'stretch',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: '#fafafa',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#ddd' : '#aaa',
    transition: 'background 0.15s, color 0.15s',
    padding: 0,
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#f5f5f5',
    }}>
      <Toolbar
        bpm={bpm}
        isPlaying={isPlaying}
        tool={tool}
        spaceHeld={spaceHeld}
        selectedInstrument={selectedInstrument}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onClear={handleClear}
        onBpmChange={setBpm}
        onToolChange={setTool}
        onInstrumentChange={setSelectedInstrument}
        onExport={handleExport}
        exporting={exporting}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        volume={currentVolume}
        onVolumeChange={setCurrentVolume}
      />

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'stretch',
          background: '#f5f5f5',
          userSelect: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          minWidth: LABEL_W + canvasDisplayW + BTN_W,
          flex: 1,
        }}>
          <RowLabels />
          <PianoRoll
            notes={notes}
            numBars={numBars}
            tool={tool}
            isPlaying={isPlaying}
            spaceHeld={spaceHeld}
            selectedInstrument={selectedInstrument}
            displayW={canvasDisplayW}
            selectedNoteIds={selectedNoteIds}
            onStrokeComplete={note => setNotes(prev => [...prev, { ...note, volume: currentVolume }])}
            onNoteDelete={id   => setNotes(prev => prev.filter(n => n.id !== id))}
            onSelectNotes={handleSelectNotes}
            onDeselectAll={handleDeselectAll}
            onNotesMove={handleNotesMove}
            onDeleteSelected={handleDeleteSelected}
            getProgress={getProgress}
          />

          <button
            onClick={handleRemoveBar}
            disabled={numBars <= 1}
            title="Remove last bar"
            style={{
              ...sectionBtn(numBars <= 1),
              borderLeft: '1px solid #e8e8e8',
            }}
            onMouseEnter={e => { if (numBars > 1) { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#e55'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.color = numBars <= 1 ? '#ddd' : '#aaa'; }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>−</span>
            <span style={{ fontSize: 8, letterSpacing: '0.06em', fontWeight: 600, writingMode: 'vertical-rl' }}>DEL BAR</span>
          </button>

          <button
            onClick={handleAddBar}
            title="Add one bar"
            style={{
              ...sectionBtn(false),
              borderLeft: '2px dashed #d0d0d0',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f7f0'; e.currentTarget.style.color = '#22c55e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.color = '#aaa'; }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>+</span>
            <span style={{ fontSize: 8, letterSpacing: '0.06em', fontWeight: 600, writingMode: 'vertical-rl' }}>ADD BAR</span>
          </button>
        </div>
      </div>

      {spaceHeld && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            cursor: panning ? 'grabbing' : 'grab',
          }}
          onMouseDown={handlePanMouseDown}
          onMouseMove={handlePanMouseMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        />
      )}
    </div>
  );
}
