export type SCBufferInfo = {
  id: number;
  frames: number;
  channels: number;
  sampleRate: number;
};

type SCBufferReference = {
  id: number; // must exist
};

type SCBufferFromData = {
  id?: number; // may use existing or create new
  data: number[]; // must exist
  channels?: number | number[];
  frames?: number;
  startFrame?: number;
};

type SCBufferFromFile = {
  id?: number; // may use existing or create new
  path: string; // must exist
  channels?: number;
  frames?: number;
  startFrame?: number;
};

export type SCBufferOpts =
  | SCBufferReference
  | SCBufferFromData
  | SCBufferFromFile;
