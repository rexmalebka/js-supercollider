import { generateSCUgenBuilder } from "../SCUgen";

export const CombN = generateSCUgenBuilder(
  "CombN",
  {
    in: 0.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
  },
  (params) => [
    params.in,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
  ]
);

export const CombC = generateSCUgenBuilder(
  "CombC",
  {
    in: 0.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
  },
  (params) => [
    params.in,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
  ]
);

export const CombL = generateSCUgenBuilder(
  "CombL",
  {
    in: 0.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
  },
  (params) => [
    params.in,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
  ]
);

export const AllpassN = generateSCUgenBuilder(
  "AllpassN",
  {
    in: 0.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
  },
  (params) => [
    params.in,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
  ]
);

export const AllpassC = generateSCUgenBuilder(
  "AllpassC",
  {
    in: 0.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
  },
  (params) => [
    params.in,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
  ]
);

export const AllpassL = generateSCUgenBuilder(
  "AllpassL",
  {
    in: 0.0,
    maxdelaytime: 0.2,
    delaytime: 0.2,
    decaytime: 1.0,
  },
  (params) => [
    params.in,
    params.maxdelaytime,
    params.delaytime,
    params.decaytime,
  ]
);
