import { generateSCUgenBuilder } from "../SCUgen";

export const WhiteNoise = generateSCUgenBuilder(
  "WhiteNoise",
  {},
  (params) => []
);

export const PinkNoise = generateSCUgenBuilder("PinkNoise", {}, (params) => []);

export const BrownNoise = generateSCUgenBuilder(
  "BrownNoise",
  {},
  (params) => []
);

export const GrayNoise = generateSCUgenBuilder("GrayNoise", {}, (params) => []);

export const ClipNoise = generateSCUgenBuilder("ClipNoise", {}, (params) => []);

export const Dust = generateSCUgenBuilder(
  "Dust",
  { density: 0.0 },
  (params) => [params.density]
);

export const Dust2 = generateSCUgenBuilder(
  "Dust2",
  { density: 0.0 },
  (params) => [params.density]
);

export const Crackle = generateSCUgenBuilder(
  "Crackle",
  { chaosParam: 1.5 },
  (params) => [params.chaosParam]
);

export const Logistic = generateSCUgenBuilder(
  "Logistic",
  {
    chaosParam: 3.0,
    freq: 1000.0,
    init: 0.5,
  },
  (params) => [params.chaosParam, params.freq, params.init]
);

export const LFNoise0 = generateSCUgenBuilder(
  "LFNoise0",
  { freq: 500.0 },
  (params) => [params.freq]
);

export const LFNoise1 = generateSCUgenBuilder(
  "LFNoise1",
  { freq: 500.0 },
  (params) => [params.freq]
);

export const LFNoise2 = generateSCUgenBuilder(
  "LFNoise2",
  { freq: 500.0 },
  (params) => [params.freq]
);

export const Hasher = generateSCUgenBuilder("Hasher", { in: 0.0 }, (params) => [
  params.in,
]);
