import { SCGroup } from "../SCGroups/SCGroups";
import { SCSynth } from "../SCSynths/SCSynth";

export interface SynthNode {
  type: "synth";
  id: number;
  synthdef: string;
  controls: Record<string, number | string>;
}

export interface GroupNode {
  type: "group";
  id: number;
  nodes: Node[];
}

export type Node = SynthNode | GroupNode;

export type SCGroupOpts = {
  id?: number;
} & SCPosition;

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

export type SCPositionNodes =
  | {
      head?: (number | SCGroup | SCSynth)[];
    }
  | {
      tail?: (number | SCGroup | SCSynth)[];
    }
  | {
      before?: (number | SCGroup | SCSynth)[];
    }
  | {
      after?: (number | SCGroup | SCSynth)[];
    };
