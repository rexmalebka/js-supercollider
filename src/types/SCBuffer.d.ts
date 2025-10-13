export type SCBufferInfo = {
  id: number;
  frames: number;
  channels: number;
  sampleRate: number;
};

export type SCBufferOpts =
  | {
      // Read from a path
      path: string;
      id?: number;
      allocate?: {
        channels?: number | number[];
        startFrame?: number;
        frames?: number;
      };
    }
  | {
      // 2️⃣ Reference existing buffer
      id: number;
      path?: never;
      allocate?: never;
    }
  | {
      // 3️⃣ Allocate new empty buffer
      allocate: {
        channels: number;
        frames: number;
        startFrame?: number;
      };
      id?: number;
      path?: never;
    };
