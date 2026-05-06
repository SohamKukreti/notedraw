import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { ROWS, SUBDIVISIONS } from '../constants.js';

export function useAudio(notes, bpm, numBars) {
  const synthsRef  = useRef(null);
  const partRef    = useRef(null);
  const notesRef   = useRef(notes);
  notesRef.current = notes;

  // ── Initialize synths once ───────────────────────────────────────────────
  useEffect(() => {
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.08 },
      volume: -6,
    }).toDestination();
    piano.maxPolyphony = 64;

    const hihat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -8,
    }).toDestination();

    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.15 },
      volume: -6,
    }).toDestination();

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 1.4 },
      volume: -3,
    }).toDestination();

    synthsRef.current = { piano, hihat, snare, kick };

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Object.values(synthsRef.current).forEach(s => s.dispose());
      synthsRef.current = null;
    };
  }, []);

  // ── Rebuild Part when notes change ───────────────────────────────────────
  useEffect(() => {
    if (!synthsRef.current) return;

    // Dispose old Part
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    if (notes.length === 0) return;

    // Pre-compute note duration in seconds at current BPM so it's unambiguous
    const sixteenthSecs = Tone.Time('16n').toSeconds();

    const events = notes.map(note => {
      const row = ROWS[note.rowId];
      const col  = note.startCol;
      const bar  = Math.floor(col / (SUBDIVISIONS * 4));
      const beat = Math.floor((col % (SUBDIVISIONS * 4)) / SUBDIVISIONS);
      const sixteenth = col % SUBDIVISIONS;
      const time = `${bar}:${beat}:${sixteenth}`;
      const durationSecs = note.durationCols * sixteenthSecs;
      return { time, row, durationSecs };
    });

    const part = new Tone.Part((time, event) => {
      const synths = synthsRef.current;
      if (!synths) return;
      const { row, durationSecs } = event;

      if (row.type === 'piano') {
        synths.piano.triggerAttackRelease(row.pitch, durationSecs, time);
      } else if (row.type === 'hihat') {
        synths.hihat.triggerAttackRelease('16n', time);
      } else if (row.type === 'snare') {
        synths.snare.triggerAttackRelease('16n', time);
      } else if (row.type === 'kick') {
        synths.kick.triggerAttackRelease('C1', '8n', time);
      }
    }, events);

    part.loop    = true;
    part.loopEnd = `${numBars}m`;
    part.start(0);

    partRef.current = part;
  }, [notes, numBars]);

  // ── Sync BPM ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // ── Transport controls ────────────────────────────────────────────────────
  const play = useCallback(async () => {
    await Tone.start(); // unlock AudioContext (requires user gesture)
    if (Tone.Transport.state === 'stopped') {
      Tone.Transport.position = 0;
    }
    Tone.Transport.start();
  }, []);

  const pause = useCallback(() => {
    Tone.Transport.pause();
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
  }, []);

  const getProgress = useCallback(() => {
    if (Tone.Transport.state !== 'started') return 0;
    const loopEnd = Tone.Time(`${numBars}m`).toSeconds();
    const pos     = Tone.Transport.seconds % loopEnd;
    return pos / loopEnd;
  }, [numBars]);

  return { play, pause, stop, getProgress };
}
