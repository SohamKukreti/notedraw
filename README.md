# Note Draw

A browser-based music loop creator where you draw freehand strokes on a MIDI grid and hear them play back. Each stroke snaps to the grid while preserving the hand-drawn shape — the canvas is your score.

## How it works

Draw horizontally across any row to place a note. The row determines the pitch or drum sound; the horizontal span determines the timing and duration. Strokes are rendered as smooth brush curves, so the canvas looks like a painting.

## Instruments

Select from the toolbar before drawing:

| Instrument | Rows | Sound |
|------------|------|-------|
| Piano | Top 24 rows (B4 → C3) | Triangle-wave PolySynth |
| Hi-hat | Row 25 | MetalSynth |
| Snare | Row 26 | NoiseSynth |
| Kick | Row 27 | MembraneSynth |

## Controls

| Action | How |
|--------|-----|
| Draw a note | Click and drag horizontally |
| Erase a note | Right-click, or switch to Erase tool and click/drag |
| Pan the canvas | Hold **Space** and drag |
| Add a bar | Click **+ ADD BAR** on the right edge |
| Remove a bar | Click **− DEL BAR** (removes notes in the deleted bar) |
| Play / Pause | Toolbar button |
| Stop | Resets playhead to start |
| Clear | Removes all notes |
| BPM | Drag the slider (40 – 220) |

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Stack

- **React 18** + **Vite** — UI and bundling
- **HTML5 Canvas** — freehand drawing and MIDI grid rendering with HiDPI support
- **Tone.js** — Web Audio synthesis and transport scheduling
