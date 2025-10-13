import { OscMessage } from "osc";
import { SCAudioBus } from "./SCAudioBus/SCAudioBus";
import { SCControlBus } from "./SCControlBus/SCControlBus";
import { SCGroup } from "./SCGroups/SCGroups";
import { SCSynth } from "./SCSynths/SCSynth";

function determineTarget(
  opts: any
): number | SCSynth | SCGroup | (number | SCSynth | SCGroup)[] {
  if (!opts) return 0;
  if ("head" in opts) return opts.head;
  if ("tail" in opts) return opts.tail;
  if ("before" in opts) return opts.before;
  if ("after" in opts) return opts.after;
  if ("replace" in opts) return opts.replace;
  return 0;
}

function determineAction(opts: any): number {
  if (!opts) return 0;
  if ("head" in opts) return 0;
  if ("tail" in opts) return 1;
  if ("before" in opts) return 2;
  if ("after" in opts) return 3;
  if ("replace" in opts) return 4;
  return 0;
}

function determineParamSetMsg(
  params:
    | {
        [name: string]: number | string | SCControlBus | SCAudioBus;
      }
    | (number | string | SCControlBus | SCAudioBus)[]
): {
  scalarMsg: OscMessage["args"];
  controlBusMsg: OscMessage["args"];
  audioBusMsg: OscMessage["args"];
} {
  const scalarMsg: OscMessage["args"] = [];
  const controlBusMsg: OscMessage["args"] = [];
  const audioBusMsg: OscMessage["args"] = [];

  Object.entries(params).forEach(([name, param]) => {
    if (param instanceof SCControlBus) {
      controlBusMsg.push(
        {
          type: isNaN(Number(name)) ? "s" : "f",
          value: isNaN(Number(name)) ? name : Number(name),
        },
        {
          type: "i",
          value: param.id,
        }
      );
    } else if (param instanceof SCAudioBus) {
      audioBusMsg.push(
        {
          type: isNaN(Number(name)) ? "s" : "f",
          value: isNaN(Number(name)) ? name : Number(name),
        },
        {
          type: "i",
          value: param.id,
        }
      );
    } else {
      scalarMsg.push(
        {
          type: isNaN(Number(name)) ? "s" : "i",
          value: isNaN(Number(name)) ? name : Number(name),
        },
        {
          type: isNaN(Number(param)) ? "s" : "f",
          value: param,
        }
      );
    }
  });

  return {
    scalarMsg,
    controlBusMsg,
    audioBusMsg,
  };
}

export { determineAction, determineTarget, determineParamSetMsg };
