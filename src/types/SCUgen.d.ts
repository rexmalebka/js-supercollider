import type { SCBuffer } from "../SCBuffers/SCBuffer";

/** A rate at which UGens run */
export type UGenRate = "audio" | "control" | "scalar";

/** Any value a UGen parameter can accept */
export type ExpandableParam = number | SCUgen | SCBuffer;

/** Inputs that can be scalars or arrays */
export type ExpandableParamInput = ExpandableParam | ExpandableParam[];

/** Flatten parameters */
export type FlattenParams<P> = {
  [K in keyof P]: P[K] extends (infer U)[] ? U : P[K];
};

/** Result of calling a UGen (single or multiple) */
export type UGenResult<P> = P extends { [key: string]: ExpandableParamInput }
  ? P[keyof P] extends any[]
    ? SCUgen[]
    : SCUgen
  : SCUgen;

/** UGen expansion mode */
export type UGenExpansionMode = "parallel" | "cross";

/** Options for a UGen call */
export interface UGenCallOptions {
  expand?: UGenExpansionMode;
}

/** Function signature for UGen factories */
export type UGenFunction<P extends { [param: string]: ExpandableParam }> = {
  (
    params?: { [K in keyof P]?: ExpandableParamInput },
    options?: UGenCallOptions,
    rate?: UGenRate
  ): UGenResult<P>;
  ar(
    params?: { [K in keyof P]?: ExpandableParamInput },
    options?: UGenCallOptions
  ): UGenResult<P>;
  kr(
    params?: { [K in keyof P]?: ExpandableParamInput },
    options?: UGenCallOptions
  ): UGenResult<P>;
  ir(
    params?: { [K in keyof P]?: ExpandableParamInput },
    options?: UGenCallOptions
  ): UGenResult<P>;
};

/** Constructor options for SCUgen */
export interface SCUgenOptions {
  name: string;
  rate?: UGenRate;
  params?: { [paramName: string]: ExpandableParam };
  specialIndex: number;
}

/** A general SCUgen node */
export interface SCUgen {
  name: string;
  rate: UGenRate;
  params: { [paramName: string]: ExpandableParam };
  specialIndex: number;

  constructor(opts: SCUgenOptions): any;

  dup(count: number): SCUgen[];
  
  // Binary operations
  add(other: ExpandableParam): SCUgen;
  sub(other: ExpandableParam): SCUgen;
  mul(other: ExpandableParam): SCUgen;
  div(other: ExpandableParam): SCUgen;
  mod(other: ExpandableParam): SCUgen;
  min(other: ExpandableParam): SCUgen;
  max(other: ExpandableParam): SCUgen;
  round(other: ExpandableParam): SCUgen;
  pow(other: ExpandableParam): SCUgen;
  shiftLeft(other: ExpandableParam): SCUgen;
  shiftRight(other: ExpandableParam): SCUgen;
  unsignedShift(other: ExpandableParam): SCUgen;
  and(other: ExpandableParam): SCUgen;
  or(other: ExpandableParam): SCUgen;
  xor(other: ExpandableParam): SCUgen;

  // Unary operations
  neg(): SCUgen;
  abs(): SCUgen;
  sqrt(): SCUgen;
  exp(): SCUgen;
  log(): SCUgen;
  sin(): SCUgen;
  cos(): SCUgen;
  tan(): SCUgen;
  asin(): SCUgen;
  acos(): SCUgen;
  atan(): SCUgen;
}
