import { generateSCUgenBuilder } from "../SCUgen";

export const Pluck = generateSCUgenBuilder(
  "Pluck",
  {
    in: 0.0,
    trig: 1.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
    coef: 0.5,
  },
  (params) => [
    params.in,
    params.trig,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
    params.coef,
  ]
);

export const Spring = generateSCUgenBuilder(
  "Spring",
  {
    in: 0.0,
    spring: 1,
    damp: 0,
  },
  (params) => [params.in, params.spring, params.damp]
);

export const Ball = generateSCUgenBuilder(
  "Ball",
  {
    in: 0.0,
    g: 1,
    damp: 0,
    friction: 0.01,
  },
  (params) => [params.in, params.g, params.damp, params.friction]
);

export const TBall = generateSCUgenBuilder(
  "TBall",
  {
    in: 0.0,
    g: 10,
    damp: 0,
    friction: 0.01,
  },
  (params) => [params.in, params.g, params.damp, params.friction]
);
