import { createUGenFactory } from "../SCUgen";

export const Median = createUGenFactory("Median", {
  length: 3,
  in: 0.0,
});

export const LeakDC = createUGenFactory("LeakDC", {
  in: 0.0,
  coef: 0.995,
});

export const SOS = createUGenFactory("SOS", {
  in: 0.0,
  a0: 0.0,
  a1: 0.0,
  a2: 0.0,
  b1: 0.0,
  b2: 0.0,
});

export const LPZ1 = createUGenFactory("LPZ1", {
  in: 0.0,
});

export const HPZ1 = createUGenFactory("HPZ1", {
  in: 0.0,
});
