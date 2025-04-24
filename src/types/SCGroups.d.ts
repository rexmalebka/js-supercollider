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
} & SCGroupPosition;

export type SCGroupPosition =
  | {
      head?: number | SCGroupOpts | SCSynth;
    }
  | {
      tail?: number | SCGroupOpts | SCSynth;
    }
  | {
      before?: number | SCGroupOpts | SCSynth;
    }
  | {
      after?: number | SCGroupOpts | SCSynth;
    }
  | {
      replace?: number | SCGroupOpts | SCSynth;
    };
