export type StatusResponse = {
  ugens: number;
  synths: number;
  groups: number;
  synthdef: number;
  avgCPU: number;
  peakCPU: number;
  samplerate: number;
  actualSamplerate: number;
};

export type VersionResponse = {
  program: "scsynth" | "supernova";
  major: string;
  minor: string;
  patch: string;
  gitBranch: string;
  hash: string;
};

export type QuitResponse = boolean;
