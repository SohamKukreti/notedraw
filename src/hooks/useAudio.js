import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { ROWS, SUBDIVISIONS } from '../constants.js';

export function useAudio(notes, bpm, numBars) {
  const synthsRef  = useRef(null);
  const partRef    = useRef(null);
  const notesRef   = useRef(notes);
  notesRef.current = notes;

  const extrasRef = useRef([]); // non-synth Tone nodes (filters, etc.)

  // ── Initialize synths once ───────────────────────────────────────────────
  useEffect(() => {
    // Piano — warm triangle, medium decay
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 1.2 },
      volume: -8,
    }).toDestination();
    piano.maxPolyphony = 32;

    // Kalimba — pure sine pluck, no sustain
    const kalimba = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.45, sustain: 0.0, release: 0.4 },
      volume: -6,
    }).toDestination();
    kalimba.maxPolyphony = 32;

    // Bass — fat sawtooth through a lowpass filter
    const bassFilter = new Tone.Filter({ frequency: 600, type: 'lowpass', rolloff: -24 }).toDestination();
    const bass = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.04, decay: 0.1, sustain: 0.9, release: 0.3 },
      volume: -5,
    }).connect(bassFilter);
    bass.maxPolyphony = 8;

    // Strings — slow-attack sawtooth pad
    const strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.35, decay: 0.1, sustain: 0.8, release: 1.5 },
      volume: -13,
    }).toDestination();
    strings.maxPolyphony = 32;

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

    synthsRef.current = { piano, kalimba, bass, strings, hihat, snare, kick };
    extrasRef.current = [bassFilter];

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Object.values(synthsRef.current).forEach(s => s.dispose());
      extrasRef.current.forEach(e => e.dispose());
      synthsRef.current = null;
      extrasRef.current = [];
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
      const velocity     = (note.volume ?? 100) / 100;
      return { time, noteType: note.type ?? 'piano', pitch: row.pitch, durationSecs, velocity };
    });

    const part = new Tone.Part((time, event) => {
      const synths = synthsRef.current;
      if (!synths) return;
      const { noteType, pitch, durationSecs, velocity } = event;

      if (noteType === 'piano') {
        synths.piano.triggerAttackRelease(pitch, durationSecs, time, velocity);
      } else if (noteType === 'kalimba') {
        synths.kalimba.triggerAttackRelease(pitch, durationSecs, time, velocity);
      } else if (noteType === 'bass') {
        synths.bass.triggerAttackRelease(pitch, durationSecs, time, velocity);
      } else if (noteType === 'strings') {
        synths.strings.triggerAttackRelease(pitch, durationSecs, time, velocity);
      } else if (noteType === 'hihat') {
        synths.hihat.triggerAttackRelease('16n', time, velocity);
      } else if (noteType === 'snare') {
        synths.snare.triggerAttackRelease('16n', time, velocity);
      } else if (noteType === 'kick') {
        synths.kick.triggerAttackRelease('C1', '8n', time, velocity);
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
