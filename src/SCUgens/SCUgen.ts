import { ParamOrderFn, SCUgenParam, SCUgenRate } from "../types/SCUgen";
import { MulAdd } from "./misc/math";

/**
 * Checks whether a value is a valid SCUgen parameter.
 * Valid types: number, SCUgen instance, or object with a 'ugen' key.
 * @param p - The value to validate.
 * @returns True if valid, false otherwise.
 */
function isValidParam(p: any): boolean {
  return (
    typeof p === "number" ||
    p instanceof SCUgen ||
    (typeof p === "object" && "ugen" in p)
  );
}

/**
 * Expands multichannel parameters by broadcasting shorter arrays.
 * Returns an array of parameter sets for each channel.
 * @template T - The shape of the parameter object.
 * @param params - The input parameter object.
 * @returns An array of expanded parameter objects.
 */
export function expandParams<T extends Record<string, SCUgenParam>>(
  params: T
): T[] {
  const keys = Object.keys(params);
  const arrayLengths = keys
    .map((k) => (Array.isArray(params[k]) ? (params[k] as any[]).length : null))
    .filter(Boolean) as number[];

  if (arrayLengths.length === 0) return [params]; // mono case

  const maxLen = Math.max(...arrayLengths);
  const expanded: T[] = [];

  for (let i = 0; i < maxLen; i++) {
    const expandedParams: any = {};
    for (const key of keys) {
      const val = params[key];
      expandedParams[key] = Array.isArray(val)
        ? val[i % val.length] // broadcast shorter arrays
        : val;
    }
    expanded.push(expandedParams);
  }

  return expanded;
}

/**
 * Creates a builder function for a specific UGen type.
 * Handles default parameters, multichannel expansion, and optional mul/add wrapping.
 * @template T - The shape of the default parameter object.
 * @param name - The name of the UGen.
 * @param defaultParams - Default values for the UGen's parameters.
 * @param paramOrderFn - Function to determine parameter ordering for serialization.
 * @returns A UGen factory function.
 */
function generateSCUgenBuilder<T extends Record<string, number>>(
  name: string,
  defaultParams: T,
  paramOrderFn: ParamOrderFn<T>
) {
  function wrapper(
    params?: Partial<
      Record<keyof T, SCUgenParam> & {
        mul?: SCUgenParam;
        add?: SCUgenParam;
      }
    >,
    opts?: {
      rate?: SCUgenRate;
    }
  ) {
    const mergedParams = { ...defaultParams, ...params } as Record<
      keyof T,
      SCUgenParam
    >;

    for (const [key, value] of Object.entries(params ?? {})) {
      const values = Array.isArray(value) ? value : [value];

      values.forEach((v) => {
        if (!isValidParam(v)) {
          throw new SCUgenInvalidParam(v);
        }
      });

      mergedParams[key as keyof T] = values;
    }

    const expansions = expandParams(mergedParams);

    const results: any[] = expansions.map((p) => {
      const ugen = new SCUgen(name, p as any, paramOrderFn, opts?.rate ?? "ar");
      const mul = name !== "MulAdd" ? params?.mul ?? 1 : 1;
      const add = name !== "MulAdd" ? params?.add ?? 0 : 0;

      // If mul/add, wrap in MulAdd
      return mul != 1 || add != 0 ? MulAdd({ in: ugen, mul, add }) : ugen;
    });
    return results.length === 1 ? results[0] : results;
  }

  return wrapper;
}

/**
 * Represents a SuperCollider-style unit generator (UGen).
 * @template T - The shape of the parameter object.
 */
class SCUgen<T extends Record<string, SCUgenParam>> {
  public name: string;
  public rate: SCUgenRate;
  public params: T;
  public specialIndex: number;
  private paramOrderFn: ParamOrderFn<T>;
  public outputs: number;

  constructor(
    name: string,
    params: T,
    paramOrderFn: ParamOrderFn<T>,
    rate?: SCUgenRate,
    outputs?: number
  ) {
    this.name = name;
    this.rate = rate ?? "ar";
    this.params = params;
    this.specialIndex = 0;

    this.paramOrderFn = paramOrderFn;
    this.outputs = outputs ?? 1;
  }

  kr(): SCUgen<T> {
    return new SCUgen(this.name, this.params, this.paramOrderFn, "kr");
  }
  ar(): SCUgen<T> {
    return new SCUgen(this.name, this.params, this.paramOrderFn, "ar");
  }
  ir(): SCUgen<T> {
    return new SCUgen(this.name, this.params, this.paramOrderFn, "ir");
  }

  collectParams(): SCUgenParam[] {
    return this.paramOrderFn(this.params);
  }
}

export class SCUgenInvalidParam extends Error {
  constructor(v: any) {
    super(`Invalid parameter: ${v}`);
  }
}

export { generateSCUgenBuilder, SCUgen };

// const SinOsc = generateSCUgenBuilder("SinOsc", {param:"freq", default:440}, {param:"phase", default:440});

// SinOsc({paam:2})

// import type {
//   ExpandableParam,
//   ExpandableParamInput,
//   UGenFunction,
//   UGenRate,
//   SCUgenOptions,
//   UGenCallOptions,
// } from "../types/SCUgen";

// export class SCUgen {
//   public name: string;
//   public rate: UGenRate;
//   public params: { [paramName: string]: ExpandableParam };
//   public specialIndex: number;

//   constructor(opts: SCUgenOptions) {
//     this.name = opts.name;
//     this.rate = opts?.rate ?? "audio";
//     this.params = opts?.params ?? {};
//     this.specialIndex = opts.specialIndex;
//   }

//   dup(count: number): SCUgen[] {
//     return Array.from({ length: count }, () => this);
//   }
// }

// const binaryOps = {
//   add: 0,
//   sub: 1,
//   mul: 2,
//   div: 3,
//   mod: 4,
//   min: 5,
//   max: 6,
//   lcm: 7,
//   gcd: 8,
//   round: 9,
//   trunc: 10,
//   atan2: 11,
//   hypot: 12,
//   pow: 13,
//   shiftLeft: 16,
//   shiftRight: 17,
//   unsignedShift: 18,
//   and: 19,
//   or: 20,
//   xor: 21,
// } as const;

// type BinaryOpName = keyof typeof binaryOps;

// for (const opName of Object.keys(binaryOps) as BinaryOpName[]) {
//   (SCUgen.prototype as any)[opName] = function (other: ExpandableParam) {
//     return new BinaryOpUGen(this, other, binaryOps[opName], this.rate);
//   };
// }

// export class BinaryOpUGen extends SCUgen {
//   constructor(
//     left: ExpandableParam,
//     right: ExpandableParam,
//     specialIndex: number,
//     rate: UGenRate = "audio"
//   ) {
//     super({
//       name: "BinaryOpUGen",
//       rate,
//       params: { a: left, b: right },
//       specialIndex,
//     });
//   }
// }

// const unaryOps = {
//   neg: 0,
//   abs: 5,
//   sqrt: 6,
//   exp: 8,
//   log: 9,
//   sin: 10,
//   cos: 11,
//   tan: 12,
//   asin: 13,
//   acos: 14,
//   atan: 15,
// } as const;

// type UnaryOpName = keyof typeof unaryOps;

// for (const opName of Object.keys(unaryOps) as UnaryOpName[]) {
//   (SCUgen.prototype as any)[opName] = function () {
//     return new UnaryOpUGen(this, unaryOps[opName], this.rate);
//   };
// }

// export class UnaryOpUGen extends SCUgen {
//   constructor(
//     input: ExpandableParam,
//     specialIndex: number,
//     rate: UGenRate = "audio"
//   ) {
//     super({
//       name: "UnaryOpUGen",
//       rate,
//       params: { a: input },
//       specialIndex,
//     });
//   }
// }

// function cartesianProduct<T>(arrays: T[][]): T[][] {
//   return arrays.reduce<T[][]>(
//     (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
//     [[]]
//   );
// }

// function flattenArray<T>(arr: any): T[] {
//   if (arr == null) return [];
//   if (!Array.isArray(arr)) return [arr];

//   const result: T[] = [];
//   const stack: any[] = [];

//   // Push initial array items in reverse order
//   for (let i = arr.length - 1; i >= 0; i--) {
//     stack.push(arr[i]);
//   }

//   while (stack.length) {
//     const item = stack.pop();
//     if (Array.isArray(item)) {
//       // Push array items in reverse order to maintain original order
//       for (let i = item.length - 1; i >= 0; i--) {
//         stack.push(item[i]);
//       }
//     } else {
//       result.push(item as T);
//     }
//   }

//   return result;
// }
// function wrapUGenArray(arr: SCUgen[]): SCUgen[] {
//   return new Proxy(arr, {
//     get(target, prop: string | symbol, receiver) {
//       if (typeof prop === "string") {
//         if (prop in target) return Reflect.get(target, prop, receiver);
//         if (prop === "dup") {
//           return (count: number) =>
//             wrapUGenArray(
//               target.flatMap((ugen) =>
//                 Array.from({ length: count }, () => ugen)
//               )
//             );
//         }
//       }
//       return undefined;
//     },
//   }) as SCUgen[];
// }

// export function createUGenFactory<
//   P extends { [param: string]: ExpandableParam }
// >(name: string, defaultParams: P, specialIndex: number = 0): UGenFunction<P> {
//   const base = (
//     params: { [K in keyof P]?: ExpandableParamInput } = {},
//     options: UGenCallOptions = {},
//     rate: UGenRate = "audio"
//   ): SCUgen | SCUgen[] => {
//     const merged: { [K in keyof P]: ExpandableParamInput } = {
//       ...defaultParams,
//       ...params,
//     };

//     const flattened: {
//       [K in keyof P]: ExpandableParam | ExpandableParam[];
//     } = {} as any;

//     for (const key in merged) {
//       flattened[key] = flattenArray(merged[key]);
//     }

//     const arrayLengths = Object.values(flattened)
//       .filter((v) => Array.isArray(v))
//       .map((v) => (v as any[]).length);

//     const hasArrays = arrayLengths.length > 0;
//     const maxLength = hasArrays ? Math.max(...arrayLengths) : 1;

//     if (!hasArrays) {
//       const finalParams: { [key: string]: ExpandableParam } = {};
//       for (const key in flattened) {
//         finalParams[key] = flattened[key] as ExpandableParam;
//       }
//       return new SCUgen({ name, rate, params: finalParams, specialIndex });
//     }

//     const ugens: SCUgen[] = [];

//     for (let i = 0; i < maxLength; i++) {
//       const instanceParams: { [key: string]: ExpandableParam } = {};
//       for (const key in flattened) {
//         const val = flattened[key];
//         if (Array.isArray(val)) {
//           instanceParams[key] = val[i % val.length];
//         } else {
//           instanceParams[key] = val;
//         }
//       }

//       ugens.push(
//         new SCUgen({ name, rate, params: instanceParams, specialIndex })
//       );
//     }

//     return wrapUGenArray(ugens);
//   };

//   const proxy = new Proxy(base, {
//     get(target, prop: string) {
//       switch (prop) {
//         case "ar":
//           return (params?: any, options?: UGenCallOptions) =>
//             target(params, options, "audio");
//         case "kr":
//           return (params?: any, options?: UGenCallOptions) =>
//             target(params, options, "control");
//         case "ir":
//           return (params?: any, options?: UGenCallOptions) =>
//             target(params, options, "scalar");
//         default:
//           return (target as any)[prop];
//       }
//     },
//   });

//   return proxy as unknown as UGenFunction<P>;
// }
