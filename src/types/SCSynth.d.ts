import { SCGroup } from "../SCGroups/SCGroups";
import { SCSynth } from "../SCSynths/SCSynth";

export type SCSynthOpts = {
  synthdef?: string;
  id?: number;
};



export type SCPosition =
  | {
      head?: number | SCGroup | SCSynth;
    }
  | {
      tail?: number | SCGroup | SCSynth;
    }
  | {
      before?: number | SCGroup | SCSynth;
    }
  | {
      after?: number | SCGroup | SCSynth;
    }
  | {
      replace?: number | SCGroup | SCSynth;
    };
