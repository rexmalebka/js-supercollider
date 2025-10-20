import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import * as fs from "fs";
import * as path from "path";
import { SCSynthdefParam, SCUgenGraphFn } from "../types/SCSynthdef";

const loadSynthdef = async (
  opts: ({ path: string } | { data: Uint8Array }) & OSCClientOpts
): Promise<void> => {
  const client = opts?.client ?? new OSCClient();
  try {
    if ("path" in opts) {
      const stat = fs.statSync(opts.path);

      if (stat.isDirectory()) {
        const directoryFiles = fs.readdirSync(opts.path);

        if (
          directoryFiles.length == 0 ||
          !directoryFiles.every((f) => {
            const p = path.join(opts.path, f);

            const fStat = fs.statSync(p);
            return fStat.isFile() && path.extname(p) == ".scsyndef";
          })
        ) {
          throw new SCSynthdefInvalidDirectoryError();
        }

        const response = await client.request(
          {
            address: "/d_loadDir",
            args: [
              {
                type: "s",
                value: path.resolve(opts.path),
              },
            ],
          },
          ["/done", "/fail"]
        );

        if (response.address == "/fail") {
          throw new SCSynthdefLoadError();
        }
      } else if (stat.isFile()) {
        const response = await client.request(
          {
            address: "/d_load",
            args: [
              {
                type: "s",
                value: path.resolve(opts.path),
              },
            ],
          },
          ["/done", "/fail"]
        );
        if (response.address == "/fail") {
          throw new SCSynthdefLoadError();
        }
      }
    }

    if ("data" in opts) {
      const response = await client.request(
        {
          address: "/d_recv",
          args: [
            {
              type: "b",
              value: opts.data,
            },
          ],
        },
        ["/done", "/fail"]
      );
      if (response.address == "/fail") {
        throw new SCSynthdefLoadError();
      }
    }
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

const freeSynthdef = async (name: string, opts?: OSCClientOpts) => {
  const client = opts?.client ?? new OSCClient();
  try {
    await client.send({
      address: "/d_free",
      args: [
        {
          type: "s",
          value: name,
        },
      ],
    });
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

// const SCUgenParamProxy = ()=>{
//   return new Proxy()
// }

/**
 * Error thrown when synthdef load is attempted and failed
 * @class SCSynthdefLoadError
 * @extends Error
 */
class SCSynthdefLoadError extends Error {
  constructor() {
    super("Invalid synthdef path or bytes");
    this.name = "SCSynthdefLoadError";
  }
}

// class SCSynthdef<T extends Record<string, SCSynthdefParam>> {
//   name: string;
//   params: T;
//   out: number;
//   SCUgenGraphFn: SCUgenGraphFn;
//   constructor(name: string, SCUgemGraphFn: SCUgenGraphFn) {
//     this.name = name;
//     this.SCUgenGraphFn = SCUgemGraphFn;
//   }

//   free() {}
//   load() {}
// }

class SCSynthdefInvalidDirectoryError extends Error {
  constructor() {
    super(
      "Invalid directory, ensure the directory only contains .scsyndef files."
    );
    this.name = "SCSynthdefInvalidDirectoryError";
  }
}


export { loadSynthdef, freeSynthdef };



// new SCSynthdef("test",({param})=>{

//   const freq = param.freq(100); // will be a parameter kind of number with default 100
//   const mod1 = param.mod.ar(1); // will be from an audio channel using /n_mapa command
//   const freq2 = param.freq2 //params will be generated on the fly
//   const mod2 = param.mod2.kr(10) // will get value from a control bus

//   const {a,b,c,d} = param({
//     a:1,
//     b: new SCAudioBus(0),
//     c: new SCControlBus(2),
//     d: 3
//   });

//   const osc = SinOsc({freq: freq})

//   return osc // this osc would be wrapepd into an out
// })

// import { createUGenFactory, SCUgen } from "../SCUgens/SCUgen";
// import { SinOsc } from "../SCUgens/sources/oscilators";
// import type { ExpandableParam, UGenRate } from "../types/SCUgen";
// import { serializeToScsyndef } from "./synthdef-utils";
// import * as fs from "fs";

// type ParamProxy = Record<string, (defaultValue?: number) => SCUgen>;

// /** Create parameter proxy with .ar/.kr/.ir support */
// function createParamProxy(paramStore: Record<string, SCUgen>): ParamProxy {
//   return new Proxy(
//     {},
//     {
//       get(_, paramName: string) {
//         const baseFn = (
//           defaultValue: number = 0,
//           rate: UGenRate = "control"
//         ) => {
//           if (!paramStore[paramName]) {
//             const ugen = new SCUgen({
//               name: "Control",
//               rate,
//               params: {},
//               specialIndex: 0,
//             });
//             (ugen as any).default = defaultValue;
//             (ugen as any).paramName = paramName;
//             paramStore[paramName] = ugen;
//           }
//           return paramStore[paramName];
//         };

//         return new Proxy(baseFn, {
//           get(target, prop: string) {
//             if (["ar", "kr", "ir"].includes(prop)) {
//               return (defaultValue: number = 0) =>
//                 target(defaultValue, prop as UGenRate);
//             }
//             return (target as any)[prop];
//           },
//         });
//       },
//     }
//   ) as ParamProxy;
// }

// export class SCSynthdef {
//   name: string;
//   params: Record<string, SCUgen>;
//   ugenGraph: SCUgen;

//   constructor(
//     name: string,
//     builderFn: (params: ParamProxy) => SCUgen | SCUgen[]
//   ) {
//     this.name = name;
//     this.params = {};

//     const paramProxy = createParamProxy(this.params);
//     const signal = builderFn(paramProxy);

//     const isOut = (val: any) => val instanceof SCUgen && val.name === "Out";

//     const isOutUGenArray = (val: any) =>
//       Array.isArray(val) &&
//       val.every((v) => v instanceof SCUgen && v.name === "Out");

//     if (isOut(signal) || isOutUGenArray(signal)) {
//       // User already returned Out (or array of Out)
//       this.ugenGraph = Array.isArray(signal) ? signal[0] : signal;
//     } else {
//       const outUGen =
//         this.params["out"] ??
//         new SCUgen({
//           name: "Control",
//           rate: "scalar",
//           params: {},
//           specialIndex: 0,
//         });

//       if (!this.params["out"]) {
//         (outUGen as any).default = 0;
//         (outUGen as any).paramName = "out";
//         this.params["out"] = outUGen;
//       }

//       this.ugenGraph = new SCUgen({
//         name: "Out",
//         rate: "audio",
//         params: {
//           bus: outUGen as ExpandableParam,
//           signal: signal as ExpandableParam,
//         },
//         specialIndex: 0,
//       });
//     }
//   }

//   collectConstants() {
//     const constants: number[] = [];
//     const seenUGens = new Map<SCUgen, number>();
//     const graph: { ugen: SCUgen; deps: Set<number> }[] = [];

//     const extractUGenIndices = (val: any): number[] => {
//       if (val instanceof SCUgen && seenUGens.has(val)) {
//         return [seenUGens.get(val)!];
//       }
//       if (Array.isArray(val)) {
//         return val.flatMap(extractUGenIndices);
//       }
//       return [];
//     };

//     const serializeParam = (value: any): any => {
//       if (typeof value === "number") {
//         let idx = constants.indexOf(value);
//         if (idx === -1) {
//           constants.push(value);
//           idx = constants.length - 1;
//         }
//         return { constant: idx };
//       }

//       if (Array.isArray(value)) {
//         return value.map(serializeParam);
//       }

//       if (value instanceof SCUgen) {
//         if (!seenUGens.has(value)) {
//           // First serialize all children
//           Object.values(value.params).forEach(serializeParam);

//           const index = graph.length;
//           seenUGens.set(value, index);

//           const deps = new Set<number>();
//           Object.values(value.params).forEach((v) => {
//             extractUGenIndices(v).forEach((i) => deps.add(i));
//           });

//           graph.push({ ugen: value, deps });
//         }

//         return { ugen: seenUGens.get(value)! };
//       }

//       return value;
//     };

//     serializeParam(this.ugenGraph);

//     // Topological sort
//     const sortedUGens: {
//       name: string;
//       rate: UGenRate;
//       specialIndex?: number;
//       params: Record<string, any>;
//     }[] = [];

//     const controlUGens: typeof sortedUGens = [];
//     const outUGens: typeof sortedUGens = [];

//     const visited = new Set<number>();
//     let remaining = new Set(graph.map((_, i) => i));

//     while (remaining.size > 0) {
//       const ready = Array.from(remaining).filter(
//         (i) =>
//           !visited.has(i) && [...graph[i].deps].every((dep) => visited.has(dep))
//       );

//       if (ready.length === 0) {
//         throw new Error("Cyclic dependency detected in UGen graph");
//       }

//       for (const i of ready) {
//         visited.add(i);
//         remaining.delete(i);

//         const { ugen } = graph[i];
//         const serializedParams: Record<string, any> = {};

//         for (const [key, val] of Object.entries(ugen.params)) {
//           serializedParams[key] = serializeParam(val);
//         }

//         const obj = {
//           name: ugen.name,
//           rate: ugen.rate,
//           specialIndex: ugen.specialIndex,
//           params: serializedParams,
//         };

//         if (ugen.name === "Out") {
//           outUGens.push(obj);
//         } else if (ugen.rate === "control" || ugen.rate === "scalar") {
//           controlUGens.push(obj);
//         } else {
//           sortedUGens.push(obj);
//         }
//       }
//     }

//     return {
//       constants,
//       ugenGraph: [...controlUGens, ...sortedUGens, ...outUGens],
//     };
//   }

//   toJSON() {
//     const { constants, ugenGraph } = this.collectConstants();

//     return {
//       name: this.name,
//       constants,
//       ugens: ugenGraph,
//       params: Object.entries(this.params).map(([name, ugen]) => ({
//         name,
//         rate: ugen.rate,
//         default: (ugen as any).default ?? 0,
//       })),
//     };
//   }
// }

// export const Out = createUGenFactory(
//   "Out",
//   {
//     bus: 0 as ExpandableParam,
//     signal: 0 as ExpandableParam,
//   },
//   0
// );

// // --- miau1: Out.ar(out, SinOsc.ar(100))
// const miau1 = new SCSynthdef("miau1", ({ out }) =>
//   Out.ar({
//     bus: out() as ExpandableParam,
//     signal: SinOsc.ar({ freq: 100 }),
//   })
// );
// console.log(miau1.toJSON());

// fs.writeFileSync(
//   "miau1.js.scsyndef",
//   Buffer.from(serializeToScsyndef(miau1.toJSON()))
// );

// // --- miau2: Out.ar(out, SinOsc.ar([100, 200]))
// const miau2 = new SCSynthdef("miau2", ({ out }) =>
//   Out.ar({
//     bus: out() as ExpandableParam,
//     signal: SinOsc.ar({ freq: [100, 200] }),
//   })
// );

// console.log(miau2.toJSON());
// fs.writeFileSync(
//   "miau2.js.scsyndef",
//   Buffer.from(serializeToScsyndef(miau2.toJSON()))
// );

// // --- miau3: Out.ar(out, SinOsc.ar([freq, 200]))
// const miau3 = new SCSynthdef("miau3", ({ out, freq }) =>
//   Out.ar({
//     bus: out() as ExpandableParam,
//     signal: SinOsc.ar({ freq: [freq(440) as ExpandableParam, 200] }),
//   })
// );

// console.log(miau3.toJSON());

// fs.writeFileSync(
//   "miau3.js.scsyndef",
//   Buffer.from(serializeToScsyndef(miau3.toJSON()))
// );
