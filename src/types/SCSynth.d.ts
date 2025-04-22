export type SCSynthOpts = {
  synthdef?: string;
  id?: number;
};

export type SCSynthPosition =
  | {
      head: number;
    }
  | {
      tail: number;
    }
  | {
      before: number;
    }
  | {
      after: number;
    }
  | {
      replace: number;
    };
