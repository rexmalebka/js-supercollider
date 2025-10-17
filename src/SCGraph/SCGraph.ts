import { SCUgen } from "../SCUgens/SCUgen";
import { SCUGenGraphInput, SCUGenGraphNode } from "../types/SCUgen";

/**
 * Flattens a value one level deep.
 * @template T
 * @param value - A single value or an array of values.
 * @returns A flat array of values.
 */
function flattenOneLevel<T>(
  value: T | T[]
): T extends Array<infer U> ? U[] : T[] {
  return Array.isArray(value) ? (value.flat(1) as any) : ([value] as any);
}

function flattenUGens(input: SCUgen<any> | SCUgen<any>[]): SCUgen<any>[] {
  return Array.isArray(input) ? input.flatMap((x) => flattenUGens(x)) : [input];
}

/**
 * Recursively collects all UGens and constants from a root UGen or array of UGens.
 * @param root - The root UGen(s) to traverse.
 * @returns An object containing ordered UGens and deduplicated constants.
 */
export function collectUGenGraph(root: SCUgen<any> | SCUgen<any>[]) {
  const visited = new Set<SCUgen<any>>();
  const orderedUGens: SCUgen<any>[] = [];
  const constants = new Set<number>();

  function traverse(node: SCUgen<any>) {
    if (visited.has(node)) return;
    visited.add(node);

    const params = node.collectParams();

    for (const param of params) {
      // ✅ flatten one level before checking contents
      for (const p of flattenOneLevel(param)) {
        if (p instanceof SCUgen) {
          traverse(p);
        } else {
          constants.add(p as number);
        }
      }
    }

    orderedUGens.push(node);
  }

  const roots = flattenUGens(root);
  roots.forEach(traverse);

  return {
    orderedUGens,
    constants: Array.from(constants),
  };
}

/**
 * Indexes UGens and constants for graph serialization.
 * @param orderedUGens - UGens in topological order.
 * @param constants - Unique constants used in the graph.
 * @returns Maps of constants and UGens to their indices.
 */
export function indexUGensAndConstants(
  orderedUGens: SCUgen<any>[],
  constants: number[]
) {
  const constantIndex = new Map<number, number>();
  constants.forEach((c, i) => constantIndex.set(c, i));

  const ugenIndex = new Map<SCUgen<any>, number>();
  orderedUGens.forEach((u, i) => ugenIndex.set(u, i));

  return { constantIndex, ugenIndex };
}

/**
 * Builds a serialized graph of UGens and their input connections.
 * @param orderedUGens - UGens in topological order.
 * @param constantIndex - Map of constants to indices.
 * @param ugenIndex - Map of UGens to indices.
 * @returns An array of graph nodes representing UGens.
 */
export function buildUGenConnections(
  orderedUGens: SCUgen<any>[],
  constantIndex: Map<number, number>,
  ugenIndex: Map<SCUgen<any>, number>
): SCUGenGraphNode[] {
  const graph: SCUGenGraphNode[] = [];

  for (const ugen of orderedUGens) {
    const params = ugen.collectParams();

    const inputs: SCUGenGraphInput[] = params.flatMap((param) =>
      flattenOneLevel(param).map(
        (p): SCUGenGraphInput =>
          p instanceof SCUgen
            ? { type: "ugen", index: ugenIndex.get(p)!, output: 0 }
            : { type: "const", index: constantIndex.get(p)! }
      )
    );
    graph.push({
      name: ugen.name,
      rate: ugen.rate,
      inputs,
    });
  }

  return graph;
}

/**
 * Serializes a UGen graph into a format suitable for rendering or exporting.
 * @param root - The root UGen(s) to serialize.
 * @returns An object containing constants and serialized UGens.
 */
export function serializeUGenGraph(root: SCUgen<any> | SCUgen<any>[]) {
  const { orderedUGens, constants } = collectUGenGraph(root);
  const { constantIndex, ugenIndex } = indexUGensAndConstants(
    orderedUGens,
    constants
  );
  const graph = buildUGenConnections(orderedUGens, constantIndex, ugenIndex);

  return {
    constants,
    ugens: graph,
  };
}
