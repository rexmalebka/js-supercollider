import { createUGenFactory } from "../SCUgen";

export const Decay = createUGenFactory("Decay", {
  in: 0.0,
  decayTime: 1.0,
});

export const Decay2 = createUGenFactory("Decay2", {
  in: 0.0,
  attackTime: 0.01,
  decayTime: 1.0,
});

export const Integrator = createUGenFactory("Integrator", {
  in: 0.0,
  coef: 1.0,
});

export const Lag = createUGenFactory("Lag", {
  in: 0.0,
  lagTime: 0.1,
});

export const Ramp = createUGenFactory("Ramp", {
  in: 0.0,
  lagTime: 0.1,
});
