import { OscMessage, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import {
  GroupNode,
  SynthNode,
  Node,
  SCGroupOpts,
  SCPosition,
} from "../types/SCGroups";
import { SCSynth } from "../SCSynths/SCSynth";

function readSynth(
  args: (number | string)[],
  nodeId: number
): { synth: SynthNode; remainingArgs: (number | string)[] } {
  const [synthdef, numControls, ...rest] = args;
  const numControlsNum = Number(numControls);

  const controlsArgs = rest.slice(0, numControlsNum * 2);
  const remainingArgs = rest.slice(numControlsNum * 2);

  const controls: Record<string, number | string> = {};
  for (let i = 0; i < controlsArgs.length; i += 2) {
    const name = String(controlsArgs[i]);
    const value = controlsArgs[i + 1];
    controls[name] = value;
  }

  const synth: SynthNode = {
    type: "synth",
    id: nodeId,
    synthdef: String(synthdef),
    controls,
  };

  return { synth, remainingArgs };
}

function readChildNode(args: (number | string)[]): {
  node: Node;
  remainingArgs: (number | string)[];
} {
  if (args.length === 0) {
    throw new Error("Unexpected end of arguments while parsing node tree");
  }

  const [nodeId, nextValue, ...rest] = args;

  // If nextValue is -1, this is a synth node
  if (Number(nextValue) === -1) {
    const { synth, remainingArgs } = readSynth(rest, Number(nodeId));
    return { node: synth, remainingArgs };
  }
  // Otherwise it's a group with child nodes
  else {
    const childCount = Number(nextValue);
    let remainingArgs = rest;
    const nodes: Node[] = [];

    for (let i = 0; i < childCount; i++) {
      const result = readChildNode(remainingArgs);
      nodes.push(result.node);
      remainingArgs = result.remainingArgs;
    }

    const group: GroupNode = {
      type: "group",
      id: Number(nodeId),
      nodes,
    };

    return { node: group, remainingArgs };
  }
}

/**
 * Queries the server for the complete node tree starting at the specified group
 * @param groupId - The ID of the group to query
 * @param opts - Options including optional custom OSC client
 * @returns The complete node tree structure
 */
async function queryTree(
  groupId: number,
  opts?: OSCClientOpts
): Promise<GroupNode> {
  const client = opts?.client ?? new OSCClient();

  try {
    const treeMsg = await client.request(
      {
        address: "/g_queryTree",
        args: [
          { type: "i", value: groupId },
          { type: "i", value: 1 }, // Include controls
        ],
      },
      ["/g_queryTree.reply", "/fail"]
    );

    if (treeMsg.address == "/fail") {
      return null;
    }

    const treeArgs: (string | number)[] = treeMsg.args.map(
      (arg: OscValue) => arg.value
    );

    const [_valuesIncluded, _returnedGroupId, numChildNodes, ...remainingArgs] =
      treeArgs;

    const nodes: Node[] = [];
    let currentArgs = remainingArgs;

    for (let i = 0; i < Number(numChildNodes); i++) {
      const result = readChildNode(currentArgs);
      nodes.push(result.node);
      currentArgs = result.remainingArgs;
    }

    return {
      type: "group",
      id: groupId,
      nodes,
    };
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
}

/**
 * Represents a SuperCollider group node for organizing synths and other groups hierarchically.
 * Provides methods for creating, managing, and querying node hierarchies on the SuperCollider server.
 *
 * @example
 * // Create and initialize a new group
 * const group = await new SCGroup().init();
 */
class SCGroup {
  /**
   * The server-assigned ID of this group (null if not yet initialized)
   */
  public id: number | null;

  private action: number;
  private target: number | SCSynth | SCGroup;

  /**
   * Creates a new SCGroup instance
   * @param opts - Group configuration options
   */
  constructor(opts?: SCGroupOpts) {
    this.id = opts?.id ?? null;
    this.action =
      "head" in (opts ?? {})
        ? 0
        : "tail" in (opts ?? {})
        ? 1
        : "before" in (opts ?? {})
        ? 2
        : "after" in (opts ?? {})
        ? 3
        : "replace" in (opts ?? {})
        ? 4
        : 0;

    this.target =
      "head" in (opts ?? {})
        ? opts["head"]
        : "tail" in (opts ?? {})
        ? opts["tail"]
        : "before" in (opts ?? {})
        ? opts["before"]
        : "after" in (opts ?? {})
        ? opts["after"]
        : "replace" in (opts ?? {})
        ? opts["replace"]
        : 0;

    if (
      (this.target instanceof SCGroup || this.target instanceof SCSynth) &&
      this.target.id == null
    ) {
      throw new Error("Target node have no id assigned");
    }
  }

  /**
   * Initializes the group on the SuperCollider server
   * @param opts - Initialization options including positioning
   * @returns The initialized group instance
   * @example
   * await group.init({ after: targetGroup });
   */
  async init(opts?: OSCClientOpts & SCPosition): Promise<SCGroup> {
    if (this.id != null) return this;

    const client = opts?.client ?? new OSCClient();

    this.action =
      "head" in (opts ?? {})
        ? 0
        : "tail" in (opts ?? {})
        ? 1
        : "before" in (opts ?? {})
        ? 2
        : "after" in (opts ?? {})
        ? 3
        : "replace" in (opts ?? {})
        ? 4
        : 0;

    this.target =
      "head" in (opts ?? {})
        ? opts["head"]
        : "tail" in (opts ?? {})
        ? opts["tail"]
        : "before" in (opts ?? {})
        ? opts["before"]
        : "after" in (opts ?? {})
        ? opts["after"]
        : "replace" in (opts ?? {})
        ? opts["replace"]
        : 0;

    try {
      const group0 = await queryTree(0, { client });
      let nodes = group0.nodes;
      let groupId = 0;

      while (true) {
        for (let node of nodes.filter((node) => node.type == "group")) {
          if (node.id > groupId) {
            groupId = node.id;
          }
        }
        nodes = nodes
          .filter((node) => node.type == "group")
          .map((node) => node.nodes)
          .flat();

        if (nodes.length == 0) break;
      }

      this.id = groupId + 1;

      const target_id =
        this.target instanceof SCGroup || this.target instanceof SCSynth
          ? this.target.id
          : this.target;

      await client.send({
        address: "/g_new",
        args: [
          {
            type: "i",
            value: this.id,
          },
          {
            type: "i",
            value: this.action,
          },
          {
            type: "i",
            value: target_id,
          },
        ],
      });

      const group = await queryTree(this.id);

      if (group == null) return null;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
    return this;
  }

  /**
   * Removes this group from the server
   * @param opts - Options including optional custom OSC client
   */
  async free(opts?: OSCClientOpts): Promise<void> {
    if (this.id == null) return null;

    const client = opts?.client ?? new OSCClient();

    try {
      await client.send({
        address: "/n_free",
        args: [
          {
            type: "i",
            value: this.id,
          },
        ],
      });

      this.id = null;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Removes all child nodes from this group while keeping the group itself
   * @param opts - Options including optional custom OSC client
   */
  async freeAll(opts?: OSCClientOpts): Promise<void> {
    if (this.id == null) return null;

    const client = opts?.client ?? new OSCClient();

    try {
      await client.send({
        address: "/g_freeAll",
        args: [
          {
            type: "i",
            value: this.id,
          },
        ],
      });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Adds nodes to this group with specified positioning
   * @param opts - Configuration including nodes to add and their position
   * @returns This group instance for chaining
   */
  async add(opts?: OSCClientOpts & SCPosition): Promise<SCGroup> {
    if (this.id == null) return this;

    if (
      !("head" in opts) &&
      !("tail" in opts) &&
      !("before" in opts) &&
      !("after" in opts)
    )
      return null;

    const action =
      "head" in (opts ?? {})
        ? 0
        : "tail" in (opts ?? {})
        ? 1
        : "before" in (opts ?? {})
        ? 2
        : "after" in (opts ?? {})
        ? 3
        : 0;

    const targets =
      "head" in (opts ?? {})
        ? (opts["head"] as (SCSynth | SCGroup | number)[])
        : "tail" in (opts ?? {})
        ? (opts["tail"] as (SCSynth | SCGroup | number)[])
        : "before" in (opts ?? {})
        ? (opts["before"] as (SCSynth | SCGroup | number)[])
        : "after" in (opts ?? {})
        ? (opts["after"] as (SCSynth | SCGroup | number)[])
        : [];

    const client = opts?.client ?? new OSCClient();

    try {
      let nodes: (SCGroup | SCSynth | number)[] = [];

      for (let target of targets) {
        if (
          (target instanceof SCSynth || target instanceof SCGroup) &&
          target.id == null
        ) {
          nodes.push(await target.init({ client }));
        } else {
          nodes.push(target);
        }
      }

      await client.send({
        address: "/n_order",
        args: [
          {
            type: "i",
            value: action,
          },
          {
            type: "i",
            value: this.id,
          },
          ...(nodes.map((node) => ({
            type: "i",
            value:
              node instanceof SCGroup || node instanceof SCSynth
                ? node.id
                : node,
          })) as OscMessage["args"]),
        ],
      });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Adds nodes at the head of this group (convenience method)
   * @param nodes - Array of nodes or node IDs to add
   * @param opts - Options including optional custom OSC client
   */
  async addHead(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts) {
    return this.add({
      head: nodes,
      client: opts?.client,
    });
  }

  /**
   * Adds nodes at the tail of this group (convenience method)
   * @param nodes - Array of nodes or node IDs to add
   * @param opts - Options including optional custom OSC client
   */
  async addTail(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts) {
    return this.add({
      tail: nodes,
      client: opts?.client,
    });
  }
  /**
   * Adds nodes before this group (convenience method)
   * @param nodes - Array of nodes or node IDs to add
   * @param opts - Options including optional custom OSC client
   */
  async addBefore(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts) {
    return this.add({
      before: nodes,
      client: opts?.client,
    });
  }

  /**
   * Adds nodes after this group (convenience method)
   * @param nodes - Array of nodes or node IDs to add
   * @param opts - Options including optional custom OSC client
   */
  async addAfter(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts) {
    return this.add({
      after: nodes,
      client: opts?.client,
    });
  }

  /**
   * Retrieves all child nodes of this group
   * @param opts - Options including optional custom OSC client
   * @returns Array of child nodes (both SCGroup and SCSynth instances)
   */
  async nodes(opts?: OSCClientOpts): Promise<(SCGroup | SCSynth)[]> {
    if (this.id == null) return [];

    const client = opts?.client ?? new OSCClient();

    try {
      const group = await queryTree(this.id, { client });

      const nodes = group.nodes.map((node) => {
        if (node.type == "synth") {
          return new SCSynth({ id: node.id });
        } else {
          return new SCGroup({ id: node.id });
        }
      });

      return nodes;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }
}

export { queryTree, SCGroup };
