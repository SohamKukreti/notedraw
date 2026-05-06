// ─── Cell dimensions ─────────────────────────────────────────────────────────
export const CELL_W = 40;   // pixels per subdivision (16th note)
export const CELL_H = 22;   // pixels per row

// ─── Beat grid ───────────────────────────────────────────────────────────────
export const SUBDIVISIONS  = 4;                        // 16th notes per beat
export const BEATS_PER_BAR = 4;                        // 4/4 time
export const COLS_PER_BAR  = SUBDIVISIONS * BEATS_PER_BAR; // 16 cols per bar

// ─── Row definitions ─────────────────────────────────────────────────────────
const CHROMATIC  = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const BLACK_KEYS = new Set(['A#', 'G#', 'F#', 'D#', 'C#']);

const PIANO_ROWS = [4, 3].flatMap(oct =>
  CHROMATIC.map((note, i) => ({
    id: (oct === 4 ? 0 : 12) + i,
    label: `${note}${oct}`,
    type: 'piano',
    color: '#4ade80',
    pitch: `${note}${oct}`,
    isBlackKey: BLACK_KEYS.has(note),
  }))
);

const DRUM_ROWS = [
  { id: 24, label: 'HH', type: 'hihat', color: '#ef4444', pitch: null, isBlackKey: false },
  { id: 25, label: 'SN', type: 'snare', color: '#f97316', pitch: null, isBlackKey: false },
  { id: 26, label: 'KK', type: 'kick',  color: '#1a1a1a', pitch: null, isBlackKey: false },
];

export const ROWS      = [...PIANO_ROWS, ...DRUM_ROWS];
export const TOTAL_ROWS = ROWS.length; // 27

// ─── Canvas height (fixed; width grows with numBars) ──────────────────────────
export const CANVAS_H = CELL_H * TOTAL_ROWS;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getCanvasW  = (numBars) => numBars * COLS_PER_BAR * CELL_W;
export const getTotalCols = (numBars) => numBars * COLS_PER_BAR;

// ─── Instruments (user-selectable from toolbar) ───────────────────────────────
export const INSTRUMENTS = [
  { id: 'piano', label: 'Piano',  color: '#22c55e', fixedRowId: null },
  { id: 'hihat', label: 'Hi-hat', color: '#ef4444', fixedRowId: 24  },
  { id: 'snare', label: 'Snare',  color: '#f97316', fixedRowId: 25  },
  { id: 'kick',  label: 'Kick',   color: '#1a1a1a', fixedRowId: 26  },
];

// ─── Left label panel ─────────────────────────────────────────────────────────
export const LABEL_W = 52;
