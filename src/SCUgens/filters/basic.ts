import { generateSCUgenBuilder } from "../SCUgen";

export const LPF = generateSCUgenBuilder(
  "LPF",
  {
    in: 0.0,
    freq: 440.0,
  },
  (params) => [params.in, params.freq]
);

export const HPF = generateSCUgenBuilder(
  "HPF",
  {
    in: 0.0,
    freq: 440.0,
  },
  (params) => [params.in, params.freq]
);

export const BPF = generateSCUgenBuilder(
  "BPF",
  {
    in: 0.0,
    freq: 440.0,
    rq: 1.0,
  },
  (params) => [params.in, params.freq, params.rq]
);

export const BRF = generateSCUgenBuilder(
  "BRF",
  {
    in: 0.0,
    freq: 440.0,
    rq: 1.0,
  },
  (params) => [params.in, params.freq, params.rq]
);

export const RLPF = generateSCUgenBuilder(
  "RLPF",
  {
    in: 0.0,
    freq: 440.0,
    rq: 1.0,
  },
  (params) => [params.in, params.freq, params.rq]
);

export const RHPF = generateSCUgenBuilder(
  "RHPF",
  {
    in: 0.0,
    freq: 440.0,
    rq: 1.0,
  },
  (params) => [params.in, params.freq, params.rq]
);
