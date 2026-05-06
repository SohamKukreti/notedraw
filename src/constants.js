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

export const ROWS       = PIANO_ROWS;
export const TOTAL_ROWS = ROWS.length; // 132

// ─── Canvas height (fixed; width grows with numBars) ──────────────────────────
export const CANVAS_H = CELL_H * TOTAL_ROWS;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getCanvasW  = (numBars) => numBars * COLS_PER_BAR * CELL_W;
export const getTotalCols = (numBars) => numBars * COLS_PER_BAR;

// ─── Instruments (user-selectable from toolbar) ───────────────────────────────
export const INSTRUMENTS = [
  { id: 'piano', label: 'Synth',  color: '#22c55e' },
  { id: 'hihat', label: 'Hi-hat', color: '#ef4444' },
  { id: 'snare', label: 'Snare',  color: '#f97316' },
  { id: 'kick',  label: 'Kick',   color: '#1a1a1a' },
];

// ─── Left label panel ─────────────────────────────────────────────────────────
export const LABEL_W = 52;
