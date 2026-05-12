import * as Tone from 'tone';
import { ROWS, SUBDIVISIONS } from '../constants.js';

// ── WAV encoder ───────────────────────────────────────────────────────────────
function encodeWAV(audioBuffer) {
  const numCh      = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numFrames  = audioBuffer.length;
  const dataBytes  = numFrames * numCh * 2;

  const buf  = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);
  const str  = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

  str(0,  'RIFF');
  view.setUint32(4,  36 + dataBytes, true);
  str(8,  'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1,  true);  // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, dataBytes, true);

  let off = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = audioBuffer.getChannelData(ch)[i];
      view.setInt16(off, Math.max(-32768, Math.min(32767, s * 32767)), true);
      off += 2;
    }
  }
  return buf;
}

// ── Trim trailing silence ─────────────────────────────────────────────────────
function trimSilence(audioBuffer, threshold = 0.0001) {
  const numCh = audioBuffer.numberOfChannels;
  const len   = audioBuffer.length;
  let lastAudible = 0;
  for (let ch = 0; ch < numCh; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = len - 1; i >= lastAudible; i--) {
      if (Math.abs(data[i]) > threshold) { lastAudible = Math.max(lastAudible, i); break; }
    }
  }
  const trimmedLen = lastAudible + 1;
  const buf = new AudioBuffer({ numberOfChannels: numCh, length: trimmedLen, sampleRate: audioBuffer.sampleRate });
  for (let ch = 0; ch < numCh; ch++) {
    buf.copyToChannel(audioBuffer.getChannelData(ch).slice(0, trimmedLen), ch);
  }
  return buf;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function exportMp3(notes, bpm, numBars) {
  const sixteenthSecs = (60 / bpm) / 4;

  // Longest release tails per instrument (seconds)
  const releaseTail = { piano: 1.2, kalimba: 0.4, bass: 0.3, strings: 1.5, kick: 1.4, snare: 0.15, hihat: 0.01 };

  // Total duration = loop length + the longest release tail that extends past the loop
  let maxTail = 0;
  for (const note of notes) {
    const endSecs = (note.startCol + note.durationCols) * sixteenthSecs;
    const tail    = releaseTail[note.type ?? 'piano'] ?? 0;
    maxTail = Math.max(maxTail, Math.max(0, endSecs + tail - numBars * 4 * (60 / bpm)));
  }
  const totalDuration = numBars * 4 * (60 / bpm) + maxTail + 0.2;

  const toneBuffer = await Tone.Offline(async () => {
    Tone.Transport.bpm.value = bpm;

    // ── Identical synth setup to useAudio.js ──────────────────────────────
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 1.2 },
      volume: -8,
    }).toDestination();
    piano.maxPolyphony = 16;

    const kalimba = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.45, sustain: 0.0, release: 0.4 },
      volume: -6,
    }).toDestination();
    kalimba.maxPolyphony = 16;

    const bassFilter = new Tone.Filter({ frequency: 600, type: 'lowpass', rolloff: -24 }).toDestination();
    const bass = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.04, decay: 0.1, sustain: 0.9, release: 0.3 },
      volume: -5,
    }).connect(bassFilter);
    bass.maxPolyphony = 8;

    const strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.35, decay: 0.1, sustain: 0.8, release: 1.5 },
      volume: -13,
    }).toDestination();
    strings.maxPolyphony = 16;

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

    // ── Schedule notes (identical logic to useAudio.js Part callback) ─────
    const s16 = Tone.Time('16n').toSeconds();

    for (const note of notes) {
      const row      = ROWS[note.rowId];
      const col      = note.startCol;
      const bar      = Math.floor(col / (SUBDIVISIONS * 4));
      const beat     = Math.floor((col % (SUBDIVISIONS * 4)) / SUBDIVISIONS);
      const sixteenth = col % SUBDIVISIONS;
      const time     = `${bar}:${beat}:${sixteenth}`;
      const dur      = note.durationCols * s16;
      const velocity = (note.volume ?? 100) / 100;
      const type     = note.type ?? 'piano';

      if      (type === 'piano')   piano.triggerAttackRelease(row.pitch, dur, time, velocity);
      else if (type === 'kalimba') kalimba.triggerAttackRelease(row.pitch, dur, time, velocity);
      else if (type === 'bass')    bass.triggerAttackRelease(row.pitch, dur, time, velocity);
      else if (type === 'strings') strings.triggerAttackRelease(row.pitch, dur, time, velocity);
      else if (type === 'hihat')   hihat.triggerAttackRelease('16n', time, velocity);
      else if (type === 'snare')   snare.triggerAttackRelease('16n', time, velocity);
      else if (type === 'kick')    kick.triggerAttackRelease('C1', '8n', time, velocity);
    }

    Tone.Transport.start();
  }, totalDuration);

  const audioBuffer = toneBuffer.get();
  const trimmed     = trimSilence(audioBuffer);
  const wavBuffer   = encodeWAV(trimmed);

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'notedraw-track.wav';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
