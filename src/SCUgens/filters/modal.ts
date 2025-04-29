import { createUGenFactory } from "../SCUgen";

export const Resonz = createUGenFactory("Resonz", {
  in: 0.0,
  freq: 440.0,
  bwr: 1.0,
});

export const Ringz = createUGenFactory("Ringz", {
  in: 0.0,
  freq: 440.0,
  decaytime: 1.0,
});

export const Formlet = createUGenFactory("Formlet", {
  in: 0.0,
  freq: 440.0,
  attacktime: 1.0,
  decaytime: 1.0,
});

export const MoogFF = createUGenFactory("MoogFF", {
  in: 0,
  freq: 100,
  gain: 2,
  reset: 0,
});

export const DFM1 = createUGenFactory("DFM1", {
  in: 0,
  freq: 1000.0,
  res: 0.1,
  inputgain: 1.0,
  type: 0.0,
  noiselevel: 0.0003,
});
