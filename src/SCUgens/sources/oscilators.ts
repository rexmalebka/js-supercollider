import { generateSCUgenBuilder, SCUgen } from "../SCUgen";

export const SinOsc = generateSCUgenBuilder(
  "SinOsc",
  {
    freq: 440.0,
    phase: 0.0,
  },
  (params) => [params.freq, params.phase]
);

export const Saw = generateSCUgenBuilder(
  "Saw",
  {
    freq: 440.0,
  },
  (params) => [params.freq]
);

export const Pulse = generateSCUgenBuilder(
  "Pulse",
  {
    freq: 440.0,
    width: 0.5,
  },
  (params) => [params.freq, params.width]
);

export const VarSaw = generateSCUgenBuilder(
  "VarSaw",
  {
    freq: 440.0,
    iphase: 0.0,
    width: 0.5,
  },
  (params) => [params.freq, params.iphase, params.width]
);

export const LFSaw = generateSCUgenBuilder(
  "LFSaw",
  {
    freq: 440.0,
    iphase: 0.0,
  },
  (params) => [params.freq, params.iphase]
);

export const LFTri = generateSCUgenBuilder(
  "LFTri",
  {
    freq: 440.0,
    iphase: 0.0,
  },
  (params) => [params.freq, params.iphase]
);

export const LFPar = generateSCUgenBuilder(
  "LFPar",
  {
    freq: 440.0,
    iphase: 0.0,
  },
  (params) => [params.freq, params.iphase]
);

export const LFCub = generateSCUgenBuilder(
  "LFCub",
  {
    freq: 440.0,
    iphase: 0.0,
  },
  (params) => [params.freq, params.iphase]
);

export const Osc = generateSCUgenBuilder(
  "Osc",
  {
    bufnum: 0,
    freq: 440.0,
    phase: 0.0,
  },
  (params) => [params.bufnum, params.phase]
);

export const COsc = generateSCUgenBuilder(
  "COsc",
  {
    bufnum: 0,
    freq: 440.0,
    beats: 0.5,
  },
  (params) => [params.bufnum, params.freq, params.beats]
);

export const VOsc = generateSCUgenBuilder(
  "VOsc",
  {
    bufpos: 0,
    freq: 440.0,
    phase: 0.0,
  },
  (params) => [params.bufpos, params.freq, params.phase]
);

export const VOsc3 = generateSCUgenBuilder(
  "VOsc3",
  {
    bufpos: 0,
    freq1: 110.0,
    freq2: 220.0,
    freq3: 440.0,
  },
  (params) => [params.bufpos, params.freq1, params.freq2, params.freq3]
);

export const PMOsc = generateSCUgenBuilder(
  "PMOsc",
  {
    carfreq: 0,
    modfreq: 0,
    pmindex: 0.0,
    modphase: 0.0,
  },
  (params) => [params.carfreq, params.modfreq, params.pmindex, params.modphase]
);

export const FSinOsc = generateSCUgenBuilder(
  "FSinOsc",
  {
    freq: 440.0,
    iphase: 0.0,
  },
  (params) => [params.freq, params.iphase]
);

export const Formant = generateSCUgenBuilder(
  "Formant",
  {
    fundfreq: 440.0,
    formfreq: 1760.0,
    bwfreq: 880.0,
  },
  (params) => [params.fundfreq, params.formfreq, params.bwfreq]
);

export const SyncSaw = generateSCUgenBuilder(
  "SyncSaw",
  {
    syncFreq: 440.0,
    sawFreq: 440.0,
  },
  (params) => [params.syncFreq, params.sawFreq]
);

export const Blip = generateSCUgenBuilder(
  "Blip",
  {
    freq: 440.0,
    numharm: 200.0,
  },
  (params) => [params.freq, params.numharm]
);

//  Klang (additive),  Klank (resonant bank).
