import React from 'react';
import { INSTRUMENTS } from '../constants.js';
import notedrawLogo from '../assets/notedraw.svg';

export default function Toolbar({
  bpm, isPlaying, tool, spaceHeld,
  selectedInstrument,
  onPlay, onPause, onStop, onClear,
  onBpmChange, onToolChange,
  onInstrumentChange,
  onExport, exporting,
  onUndo, onRedo, canUndo, canRedo,
  volume, onVolumeChange,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      background: '#ffffff',
      borderBottom: '1px solid #e5e5e5',
      flexShrink: 0,
      flexDirection: 'column',
    }}>

      {/* ── Row 1: Instrument / color picker ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px 8px',
        width: '100%',
        borderBottom: '1px solid #f0f0f0',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 8 }}>
          <img src={notedrawLogo} style={{ height: 28, width: 28 }} alt="" />
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.01em' }}>notedraw</span>
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e5e5', marginRight: 8 }} />

        <span style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: '0.08em', marginRight: 4, whiteSpace: 'nowrap' }}>
          INSTRUMENT
        </span>
        {INSTRUMENTS.map(inst => {
          const active = selectedInstrument.id === inst.id;
          return (
            <button
              key={inst.id}
              onClick={() => onInstrumentChange(inst)}
              title={inst.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 6,
                background: active ? inst.color + '18' : 'transparent',
                border: active ? `2px solid ${inst.color}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {/* Painted swatch */}
              <span style={{
                display: 'block',
                width: 32,
                height: 6,
                borderRadius: 3,
                background: inst.color,
                opacity: active ? 1 : 0.45,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                color: active ? inst.color : '#888',
                letterSpacing: '0.03em',
              }}>
                {inst.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Row 2: Transport + BPM + tool ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 16px',
        width: '100%',
      }}>

        {/* Tool toggle */}
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
          {[['select', '🔲', 'Select'], ['draw', '✏️', 'Draw'], ['erase', '🧹', 'Erase']].map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => onToolChange(t)}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: tool === t && !spaceHeld ? '#f0f0f0' : '#fff',
                color:      tool === t && !spaceHeld ? '#333'    : '#aaa',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              background: '#fff',
              color: canUndo ? '#555' : '#ccc',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ↩ Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              background: '#fff',
              color: canRedo ? '#555' : '#ccc',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ↪ Redo
          </button>
        </div>

        {/* Space = hand tool indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid',
          borderColor: spaceHeld ? '#bbb' : '#e0e0e0',
          background:  spaceHeld ? '#f0f0f0' : '#fff',
          color:       spaceHeld ? '#333'    : '#ccc',
          fontSize: 12, fontWeight: 600,
          transition: 'all 0.1s',
        }}>
          ✋ <span style={{ fontSize: 11 }}>Space</span>
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e5e5' }} />

        {/* Transport */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={isPlaying ? onPause : onPlay}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              background: isPlaying ? '#f5f5f5' : '#1a1a1a',
              color: isPlaying ? '#333' : '#fff',
              border: '1px solid ' + (isPlaying ? '#e0e0e0' : '#1a1a1a'),
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={onStop}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: '#fff',
              color: '#555',
              border: '1px solid #e0e0e0',
              cursor: 'pointer',
            }}
          >
            ⏹ Stop
          </button>
          <button
            onClick={onClear}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: '#fff',
              color: '#e55',
              border: '1px solid #fcc',
              cursor: 'pointer',
            }}
          >
            🗑 Clear
          </button>
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e5e5' }} />

        {/* BPM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: '0.08em' }}>BPM</span>
          <input
            type="range"
            min={40}
            max={220}
            step={1}
            value={bpm}
            onChange={e => onBpmChange(Number(e.target.value))}
            style={{ width: 100, accentColor: '#1a1a1a' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#333', minWidth: 28, textAlign: 'right' }}>
            {bpm}
          </span>
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e5e5' }} />

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: '0.08em' }}>VOL</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={e => onVolumeChange(Number(e.target.value))}
            style={{ width: 80, accentColor: '#1a1a1a' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#333', minWidth: 28, textAlign: 'right' }}>
            {volume}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Export */}
        <button
          onClick={onExport}
          disabled={exporting}
          title="Export as MP3"
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: exporting ? '#f5f5f5' : '#fff',
            color: exporting ? '#aaa' : '#555',
            border: '1px solid ' + (exporting ? '#e0e0e0' : '#d0d0d0'),
            cursor: exporting ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {exporting ? '⏳ Rendering…' : '⬇ Export WAV'}
        </button>

        {/* Hint */}
        <span style={{ fontSize: 10, color: '#ccc' }}>right-click to erase</span>
      </div>
    </div>
  );
}
