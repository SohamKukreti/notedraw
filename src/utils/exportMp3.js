import { ROWS } from '../constants.js';

// ── Note name → frequency ─────────────────────────────────────────────────────
const SEMITONES = { C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11 };
function noteToFreq(pitch) {
  const m = pitch && pitch.match(/^([A-G]#?)(\d+)$/);
  if (!m) return 440;
  const midi = (parseInt(m[2]) + 1) * 12 + SEMITONES[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ── White-noise buffer ────────────────────────────────────────────────────────
function makeNoiseBuffer(ctx) {
  const buf  = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// ── Instrument schedulers ─────────────────────────────────────────────────────
function schedulePiano(ctx, master, pitch, t, dur, vel) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = noteToFreq(pitch);
  const env = ctx.createGain();
  const pk = 0.3 * vel;
  const sus = 0.12 * vel;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(pk, t + 0.005);
  env.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + 0.1);
  env.gain.setValueAtTime(Math.max(sus, 0.0001), Math.max(t + 0.11, t + dur - 0.02));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  osc.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + dur + 0.1);
}

function scheduleHihat(ctx, master, noiseBuf, t, vel) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 7000;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.5 * vel, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  src.connect(filter); filter.connect(env); env.connect(master);
  src.start(t); src.stop(t + 0.1);
}

function scheduleSnare(ctx, master, noiseBuf, t, vel) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 1500; filter.Q.value = 0.8;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.6 * vel, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  src.connect(filter); filter.connect(env); env.connect(master);
  src.start(t); src.stop(t + 0.25);
}

function scheduleKick(ctx, master, t, vel) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.9 * vel, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  osc.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + 0.55);
}

function scheduleKalimba(ctx, master, pitch, t, dur, vel) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = noteToFreq(pitch);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.35 * vel, t + 0.001);
  env.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.8));
  osc.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + Math.min(dur, 0.9));
}

function scheduleBass(ctx, master, pitch, t, dur, vel) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = noteToFreq(pitch);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 1;
  const env = ctx.createGain();
  const pk = 0.4 * vel;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(pk, t + 0.04);
  env.gain.setValueAtTime(pk, Math.max(t + 0.05, t + dur - 0.05));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
  osc.connect(filter); filter.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + dur + 0.2);
}

function scheduleStrings(ctx, master, pitch, t, dur, vel) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = noteToFreq(pitch);
  const env = ctx.createGain();
  const pk = 0.126 * vel;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(pk, t + 0.35);
  env.gain.setValueAtTime(pk, Math.max(t + 0.36, t + dur - 0.1));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
  osc.connect(env); env.connect(master);
  osc.start(t); osc.stop(t + dur + 1.3);
}

// ── WAV encoder (no external deps) ───────────────────────────────────────────
function encodeWAV(audioBuffer) {
  const numCh      = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numFrames  = audioBuffer.length;
  const bps        = 16;
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
  view.setUint16(34, bps, true);
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

// ── Main export ───────────────────────────────────────────────────────────────
export async function exportMp3(notes, bpm, numBars) {
  const sampleRate    = 44100;
  const sixteenth     = (60 / bpm) / 4;
  const totalDuration = numBars * 4 * (60 / bpm) + 2;
  const frameCount    = Math.ceil(totalDuration * sampleRate);

  const offCtx   = new OfflineAudioContext(2, frameCount, sampleRate);
  const noiseBuf = makeNoiseBuffer(offCtx);

  const master = offCtx.createGain();
  master.gain.value = 0.7;
  master.connect(offCtx.destination);

  for (const note of notes) {
    const t    = note.startCol * sixteenth;
    const dur  = note.durationCols * sixteenth;
    const type = note.type ?? 'piano';
    const row  = ROWS[note.rowId];
    const vel  = (note.volume ?? 100) / 100;

    if      (type === 'piano')   schedulePiano(offCtx, master, row.pitch, t, dur, vel);
    else if (type === 'kalimba') scheduleKalimba(offCtx, master, row.pitch, t, dur, vel);
    else if (type === 'bass')    scheduleBass(offCtx, master, row.pitch, t, dur, vel);
    else if (type === 'strings') scheduleStrings(offCtx, master, row.pitch, t, dur, vel);
    else if (type === 'hihat')   scheduleHihat(offCtx, master, noiseBuf, t, vel);
    else if (type === 'snare')   scheduleSnare(offCtx, master, noiseBuf, t, vel);
    else if (type === 'kick')    scheduleKick(offCtx, master, t, vel);
  }

  const audioBuffer = await offCtx.startRendering();
  const wavBuffer   = encodeWAV(audioBuffer);

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
