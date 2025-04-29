import { createUGenFactory } from "../SCUgen";

export const SinOsc = createUGenFactory("SinOsc", {
  freq: 440.0,
  phase: 0.0,
});

export const Saw = createUGenFactory("Saw", {
  freq: 440.0,
});

export const Pulse = createUGenFactory("Pulse", {
  freq: 440.0,
  width: 0.5,
});

export const VarSaw = createUGenFactory("VarSaw", {
  freq: 440.0,
  iphase: 0.0,
  width: 0.5,
});

export const LFSaw = createUGenFactory("LFSaw", {
  freq: 440.0,
  iphase: 0.0,
});

export const LFTri = createUGenFactory("LFTri", {
  freq: 440.0,
  iphase: 0.0,
});

export const LFPar = createUGenFactory("LFPar", {
  freq: 440.0,
  iphase: 0.0,
});

export const LFCub = createUGenFactory("LFCub", {
  freq: 440.0,
  iphase: 0.0,
});

export const Osc = createUGenFactory("Osc", {
  bufnum: 0,
  freq: 440.0,
  phase: 0.0,
});

export const COsc = createUGenFactory("COsc", {
  bufnum: 0,
  freq: 440.0,
  beats: 0.5,
});

export const VOsc = createUGenFactory("VOsc", {
  bufpos: 0,
  freq: 440.0,
  phase: 0.0,
});

export const VOsc3 = createUGenFactory("VOsc3", {
  bufpos: 0,
  freq1: 110.0,
  freq2: 220.0,
  freq3: 440.0,
});

export const PMOsc = createUGenFactory("PMOsc", {
  carfreq: 0,
  modfreq: 0,
  pmindex: 0.0,
  modphase: 0.0,
});

export const FSinOsc = createUGenFactory("FSinOsc", {
  freq: 440.0,
  iphase: 0.0,
});

export const Formant = createUGenFactory("Formant", {
  fundfreq: 440.0,
  formfreq: 1760.0,
  bwfreq: 880.0,
});

export const SyncSaw = createUGenFactory("SyncSaw", {
  syncFreq: 440.0,
  sawFreq: 440.0,
});

export const Blip = createUGenFactory("Blip", {
  freq: 440.0,
  numharm: 200.0,
});

//  Klang (additive),  Klank (resonant bank).
