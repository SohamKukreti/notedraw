// ─── Cell dimensions ─────────────────────────────────────────────────────────
export const CELL_W = 40;   // pixels per subdivision (16th note)
export const CELL_H = 26;   // pixels per row (22 × 1.2 zoom)

// ─── Beat grid ───────────────────────────────────────────────────────────────
export const SUBDIVISIONS  = 4;                        // 16th notes per beat
export const BEATS_PER_BAR = 4;                        // 4/4 time
export const COLS_PER_BAR  = SUBDIVISIONS * BEATS_PER_BAR; // 16 cols per bar

// ─── Row definitions ─────────────────────────────────────────────────────────
const CHROMATIC  = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const BLACK_KEYS = new Set(['A#', 'G#', 'F#', 'D#', 'C#']);

// Octaves 10 → 0 (highest pitch at top of grid)
const OCTAVES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

const PIANO_ROWS = OCTAVES.flatMap((oct, octIdx) =>
  CHROMATIC.map((note, noteIdx) => ({
    id: octIdx * 12 + noteIdx,
    label: `${note}${oct}`,
    type: 'piano',
    color: '#4ade80',
    pitch: `${note}${oct}`,
    isBlackKey: BLACK_KEYS.has(note),
  }))
);

export const PIANO_ROW_COUNT = PIANO_ROWS.length; // 132

const DRUM_ROWS = [
  { id: PIANO_ROW_COUNT,     label: 'HH', type: 'hihat', color: '#ef4444', pitch: null, isBlackKey: false },
  { id: PIANO_ROW_COUNT + 1, label: 'SN', type: 'snare', color: '#f97316', pitch: null, isBlackKey: false },
  { id: PIANO_ROW_COUNT + 2, label: 'KK', type: 'kick',  color: '#1a1a1a', pitch: null, isBlackKey: false },
];

export const ROWS       = [...PIANO_ROWS, ...DRUM_ROWS];
export const TOTAL_ROWS = ROWS.length; // 135

// ─── Canvas height (fixed; width grows with numBars) ──────────────────────────
export const CANVAS_H = CELL_H * TOTAL_ROWS;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getCanvasW  = (numBars) => numBars * COLS_PER_BAR * CELL_W;
export const getTotalCols = (numBars) => numBars * COLS_PER_BAR;

// ─── Instruments (user-selectable from toolbar) ───────────────────────────────
export const INSTRUMENTS = [
  { id: 'piano', label: 'Synth',  color: '#22c55e', fixedRowId: null                },
  { id: 'hihat', label: 'Hi-hat', color: '#ef4444', fixedRowId: PIANO_ROW_COUNT     },
  { id: 'snare', label: 'Snare',  color: '#f97316', fixedRowId: PIANO_ROW_COUNT + 1 },
  { id: 'kick',  label: 'Kick',   color: '#1a1a1a', fixedRowId: PIANO_ROW_COUNT + 2 },
];

// ─── Left label panel ─────────────────────────────────────────────────────────
export const LABEL_W = 52;
