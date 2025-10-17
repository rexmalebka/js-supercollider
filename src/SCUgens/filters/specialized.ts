import { generateSCUgenBuilder } from "../SCUgen";

export const Decay = generateSCUgenBuilder(
  "Decay",
  {
    in: 0.0,
    decayTime: 1.0,
  },
  (params) => [params.in, params.decayTime]
);

export const Decay2 = generateSCUgenBuilder(
  "Decay2",
  {
    in: 0.0,
    attackTime: 0.01,
    decayTime: 1.0,
  },
  (params) => [params.in, params.attackTime, params.decayTime]
);

export const Integrator = generateSCUgenBuilder(
  "Integrator",
  {
    in: 0.0,
    coef: 1.0,
  },
  (params) => [params.in, params.coef]
);

export const Lag = generateSCUgenBuilder(
  "Lag",
  {
    in: 0.0,
    lagTime: 0.1,
  },
  (params) => [params.in, params.lagTime]
);

export const Ramp = generateSCUgenBuilder(
  "Ramp",
  {
    in: 0.0,
    lagTime: 0.1,
  },
  (params) => [params.in, params.lagTime]
);
