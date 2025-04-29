import { createUGenFactory } from "../SCUgen";

export const LPF = createUGenFactory("LPF", {
  in: 0.0,
  freq: 440.0,
});

export const HPF = createUGenFactory("HPF", {
  in: 0.0,
  freq: 440.0,
});

export const BPF = createUGenFactory("BPF", {
  in: 0.0,
  freq: 440.0,
  rq: 1.0,
});

export const BRF = createUGenFactory("BRF", {
  in: 0.0,
  freq: 440.0,
  rq: 1.0,
});

export const RLPF = createUGenFactory("RLPF", {
  in: 0.0,
  freq: 440.0,
  rq: 1.0,
});

export const RHPF = createUGenFactory("RHPF", {
  in: 0.0,
  freq: 440.0,
  rq: 1.0,
});
