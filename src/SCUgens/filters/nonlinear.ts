import { generateSCUgenBuilder } from "../SCUgen";

export const Median = generateSCUgenBuilder(
  "Median",
  {
    length: 3,
    in: 0.0,
  },
  (params) => [params.length, params.in]
);

export const LeakDC = generateSCUgenBuilder(
  "LeakDC",
  {
    in: 0.0,
    coef: 0.995,
  },
  (params) => [params.in, params.coef]
);

export const SOS = generateSCUgenBuilder(
  "SOS",
  {
    in: 0.0,
    a0: 0.0,
    a1: 0.0,
    a2: 0.0,
    b1: 0.0,
    b2: 0.0,
  },
  (params) => [params.in, params.a0, params.a1, params.a2, params.b1, params.b2]
);

export const LPZ1 = generateSCUgenBuilder(
  "LPZ1",
  {
    in: 0.0,
  },
  (params) => [params.in]
);

export const HPZ1 = generateSCUgenBuilder(
  "HPZ1",
  {
    in: 0.0,
  },
  (params) => [params.in]
);
