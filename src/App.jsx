import React, { useState, useCallback, useRef, useEffect } from 'react';
import Toolbar   from './components/Toolbar.jsx';
import RowLabels from './components/RowLabels.jsx';
import PianoRoll from './components/PianoRoll.jsx';
import { useAudio } from './hooks/useAudio.js';
import { INSTRUMENTS, CANVAS_H, COLS_PER_BAR } from './constants.js';

export default function App() {
  const [notes,              setNotes]              = useState([]);
  const [numBars,            setNumBars]            = useState(1);
  const [bpm,                setBpm]                = useState(120);
  const [isPlaying,          setIsPlaying]          = useState(false);
  const [tool,               setTool]               = useState('draw');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);

  // ── Spacebar panning ──────────────────────────────────────────────────────
  const scrollRef   = useRef(null);
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

  // ── Bar management ────────────────────────────────────────────────────────
  const { play, pause, stop, getProgress } = useAudio(notes, bpm, numBars);

  const handleAddBar = useCallback(() => setNumBars(n => n + 1), []);

  const handleRemoveBar = useCallback(() => {
    if (numBars <= 1) return;
    const newNumBars   = numBars - 1;
    const cutoffCol    = newNumBars * COLS_PER_BAR;
    setNumBars(newNumBars);
    setNotes(prev => prev.filter(n => n.startCol < cutoffCol));
  }, [numBars]);

  const handlePlay  = useCallback(async () => { await play(); setIsPlaying(true);  }, [play]);
  const handlePause = useCallback(() => { pause(); setIsPlaying(false); }, [pause]);
  const handleStop  = useCallback(() => { stop();  setIsPlaying(false); }, [stop]);
  const handleClear = useCallback(() => { stop();  setIsPlaying(false); setNotes([]); }, [stop]);

  // ── Section button shared style ───────────────────────────────────────────
  const sectionBtn = (color, hoverBg, hoverColor, disabled) => ({
    width: 36,
    height: CANVAS_H,
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
      />

      {/* Scrollable canvas area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          background: '#f5f5f5',
          padding: 12,
          userSelect: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          minWidth: 'max-content',
          boxShadow: '0 1px 12px rgba(0,0,0,0.1)',
          borderRadius: 4,
        }}>
          {/* Labels + canvas */}
          <div style={{ display: 'flex', borderRadius: '4px 0 0 4px', overflow: 'hidden' }}>
            <RowLabels />
            <PianoRoll
              notes={notes}
              numBars={numBars}
              tool={tool}
              isPlaying={isPlaying}
              spaceHeld={spaceHeld}
              selectedInstrument={selectedInstrument}
              onStrokeComplete={note => setNotes(prev => [...prev, note])}
              onNoteDelete={id   => setNotes(prev => prev.filter(n => n.id !== id))}
              getProgress={getProgress}
            />
          </div>

          {/* Remove bar button */}
          <button
            onClick={handleRemoveBar}
            disabled={numBars <= 1}
            title="Remove last bar"
            style={{
              ...sectionBtn('#e55', '#fff0f0', '#e55', numBars <= 1),
              borderLeft: '1px solid #e8e8e8',
            }}
            onMouseEnter={e => { if (numBars > 1) { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#e55'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.color = numBars <= 1 ? '#ddd' : '#aaa'; }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>−</span>
            <span style={{ fontSize: 8, letterSpacing: '0.06em', fontWeight: 600, writingMode: 'vertical-rl' }}>DEL BAR</span>
          </button>

          {/* Add bar button */}
          <button
            onClick={handleAddBar}
            title="Add one bar"
            style={{
              ...sectionBtn('#22c55e', '#f0f7f0', '#22c55e', false),
              borderLeft: '2px dashed #d0d0d0',
              borderRadius: '0 4px 4px 0',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f7f0'; e.currentTarget.style.color = '#22c55e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.color = '#aaa'; }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>+</span>
            <span style={{ fontSize: 8, letterSpacing: '0.06em', fontWeight: 600, writingMode: 'vertical-rl' }}>ADD BAR</span>
          </button>
        </div>
      </div>

      {/* Spacebar pan overlay — intercepts all mouse events when space is held */}
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
