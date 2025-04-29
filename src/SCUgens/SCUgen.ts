import type {
  ExpandableParam,
  ExpandableParamInput,
  UGenFunction,
  UGenRate,
  SCUgenOptions,
  UGenCallOptions,
} from "../types/SCUgen";

export class SCUgen {
  public name: string;
  public rate: UGenRate;
  public params: { [paramName: string]: ExpandableParam };
  public specialIndex: number;

  constructor(opts: SCUgenOptions) {
    this.name = opts.name;
    this.rate = opts?.rate ?? "audio";
    this.params = opts?.params ?? {};
    this.specialIndex = opts.specialIndex;
  }

  dup(count: number): SCUgen[] {
    return Array.from({ length: count }, () => this);
  }
}

const binaryOps = {
  add: 0,
  sub: 1,
  mul: 2,
  div: 3,
  mod: 4,
  min: 5,
  max: 6,
  lcm: 7,
  gcd: 8,
  round: 9,
  trunc: 10,
  atan2: 11,
  hypot: 12,
  pow: 13,
  shiftLeft: 16,
  shiftRight: 17,
  unsignedShift: 18,
  and: 19,
  or: 20,
  xor: 21,
} as const;

type BinaryOpName = keyof typeof binaryOps;

for (const opName of Object.keys(binaryOps) as BinaryOpName[]) {
  (SCUgen.prototype as any)[opName] = function (other: ExpandableParam) {
    return new BinaryOpUGen(this, other, binaryOps[opName], this.rate);
  };
}

export class BinaryOpUGen extends SCUgen {
  constructor(
    left: ExpandableParam,
    right: ExpandableParam,
    specialIndex: number,
    rate: UGenRate = "audio"
  ) {
    super({
      name: "BinaryOpUGen",
      rate,
      params: { a: left, b: right },
      specialIndex,
    });
  }
}

const unaryOps = {
  neg: 0,
  abs: 5,
  sqrt: 6,
  exp: 8,
  log: 9,
  sin: 10,
  cos: 11,
  tan: 12,
  asin: 13,
  acos: 14,
  atan: 15,
} as const;

type UnaryOpName = keyof typeof unaryOps;

for (const opName of Object.keys(unaryOps) as UnaryOpName[]) {
  (SCUgen.prototype as any)[opName] = function () {
    return new UnaryOpUGen(this, unaryOps[opName], this.rate);
  };
}

export class UnaryOpUGen extends SCUgen {
  constructor(
    input: ExpandableParam,
    specialIndex: number,
    rate: UGenRate = "audio"
  ) {
    super({
      name: "UnaryOpUGen",
      rate,
      params: { a: input },
      specialIndex,
    });
  }
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]]
  );
}

function flattenArray<T>(arr: any): T[] {
  if (!arr || typeof arr !== "object") return [arr];

  const result: T[] = [];

  const stack: any[] = [arr];

  while (stack.length) {
    const item = stack.pop();

    if (Array.isArray(item)) {
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i]);
      }
    } else {
      result.push(item as T);
    }
  }

  return result.reverse(); // because we used stack (LIFO)
}

function wrapUGenArray(arr: SCUgen[]): SCUgen[] {
  return new Proxy(arr, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === "string") {
        if (prop in target) return Reflect.get(target, prop, receiver);

        if (prop === "dup") {
          return (count: number) =>
            wrapUGenArray(
              target.flatMap((ugen) =>
                Array.from({ length: count }, () => ugen)
              )
            );
        }

        if (prop in binaryOps) {
          return (other: ExpandableParam) =>
            wrapUGenArray(target.map((ugen) => (ugen as any)[prop](other)));
        }

        if (prop in unaryOps) {
          return () =>
            wrapUGenArray(target.map((ugen) => (ugen as any)[prop]()));
        }
      }
      return undefined;
    },
  }) as unknown as SCUgen[];
}

export function createUGenFactory<
  P extends { [param: string]: ExpandableParam }
>(name: string, defaultParams: P, specialIndex: number = 0): UGenFunction<P> {
  const base = (
    params: { [K in keyof P]?: ExpandableParamInput } = {},
    options: UGenCallOptions = {},
    rate: UGenRate = "audio"
  ): SCUgen | SCUgen[] => {
    const flattenedParams: { [K in keyof P]?: ExpandableParamInput } = {};
    for (const key in params) {
      const value = params[key];
      flattenedParams[key] = Array.isArray(value)
        ? flattenArray<ExpandableParam>(value)
        : value;
    }

    const paramEntries = Object.entries(flattenedParams);
    const arrayParams = paramEntries.filter(([_, value]) =>
      Array.isArray(value)
    );

    if (arrayParams.length > 0) {
      if (options.expand === "cross") {
        const keys = arrayParams.map(([key]) => key);
        const arrays = arrayParams.map(([_, value]) => value as any[]);
        const combos = cartesianProduct(arrays);

        return wrapUGenArray(
          combos.map((combo) => {
            const instanceParams: { [key: string]: ExpandableParam } = {
              ...(defaultParams as any),
              ...(params as any),
            };
            keys.forEach((key, i) => {
              instanceParams[key] = combo[i];
            });
            return new SCUgen({
              name,
              rate,
              params: instanceParams,
              specialIndex,
            });
          })
        );
      } else {
        const lengths = arrayParams.map(([_, v]) => (v as any[]).length);
        const max = Math.max(...lengths);

        const list = [] as SCUgen[];
        for (let i = 0; i < max; i++) {
          const instanceParams: { [key: string]: ExpandableParam } = {
            ...(defaultParams as any),
          };
          for (const [key, value] of paramEntries) {
            instanceParams[key] = Array.isArray(value) ? value[i] : value;
          }
          list.push(
            new SCUgen({ name, rate, params: instanceParams, specialIndex })
          );
        }
        return wrapUGenArray(list);
      }
    }

    const finalParams: { [key: string]: ExpandableParam } = {
      ...(defaultParams as any),
      ...(params as any),
    };
    return new SCUgen({ name, rate, params: finalParams, specialIndex });
  };

  const proxy = new Proxy(base, {
    get(target, prop: string) {
      switch (prop) {
        case "ar":
          return (params?: any, options?: UGenCallOptions) =>
            target(params, options, "audio");
        case "kr":
          return (params?: any, options?: UGenCallOptions) =>
            target(params, options, "control");
        case "ir":
          return (params?: any, options?: UGenCallOptions) =>
            target(params, options, "scalar");
        default:
          return target;
      }
    },
  });

  return proxy as unknown as UGenFunction<P>;
}
