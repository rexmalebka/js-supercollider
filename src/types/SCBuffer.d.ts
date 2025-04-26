export type SCBufferInfo = {
  id: number;
  frames: number;
  channels: number;
  sampleRate: number;
};

export type SCBufferOpts = {
  path?: string;
  id?: number;
  allocate?: {
    channels: number;
    frames: number;
  };
};
