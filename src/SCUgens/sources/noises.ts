import { createUGenFactory } from "../SCUgen";

export const WhiteNoise = createUGenFactory("WhiteNoise", {});

export const PinkNoise = createUGenFactory("PinkNoise", {});

export const BrownNoise = createUGenFactory("BrownNoise", {});

export const GrayNoise = createUGenFactory("GrayNoise", {});

export const ClipNoise = createUGenFactory("ClipNoise", {});

export const Dust = createUGenFactory("Dust", { density: 0.0 });

export const Dust2 = createUGenFactory("Dust2", { density: 0.0 });

export const Crackle = createUGenFactory("Crackle", { chaosParam: 1.5 });

export const Logistic = createUGenFactory("Logistic", {
  chaosParam: 3.0,
  freq: 1000.0,
  init: 0.5,
});

export const LFNoise0 = createUGenFactory("LFNoise0", { freq: 500.0 });

export const LFNoise1 = createUGenFactory("LFNoise1", { freq: 500.0 });

export const LFNoise2 = createUGenFactory("LFNoise2", { freq: 500.0 });

export const Hasher = createUGenFactory("Hasher", { in: 0.0 });
