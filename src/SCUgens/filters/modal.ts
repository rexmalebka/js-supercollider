import { generateSCUgenBuilder } from "../SCUgen";

export const Resonz = generateSCUgenBuilder(
  "Resonz",
  {
    in: 0.0,
    freq: 440.0,
    bwr: 1.0,
  },
  (params) => [params.in, params.freq, params.bwr]
);

export const Ringz = generateSCUgenBuilder(
  "Ringz",
  {
    in: 0.0,
    freq: 440.0,
    decaytime: 1.0,
  },
  (params) => [params.in, params.freq, params.decaytime]
);

export const Formlet = generateSCUgenBuilder(
  "Formlet",
  {
    in: 0.0,
    freq: 440.0,
    attacktime: 1.0,
    decaytime: 1.0,
  },
  (params) => [params.in, params.freq, params.attacktime, params.decaytime]
);

export const MoogFF = generateSCUgenBuilder(
  "MoogFF",
  {
    in: 0,
    freq: 100,
    gain: 2,
    reset: 0,
  },
  (params) => [params.in, params.freq, params.gain, params.reset]
);

export const DFM1 = generateSCUgenBuilder(
  "DFM1",
  {
    in: 0,
    freq: 1000.0,
    res: 0.1,
    inputgain: 1.0,
    type: 0.0,
    noiselevel: 0.0003,
  },
  (params) => [
    params.in,
    params.freq,
    params.res,
    params.inputgain,
    params.type,
    params.noiselevel,
  ]
);
