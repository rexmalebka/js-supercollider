import { OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import {
  GroupNode,
  SynthNode,
  Node,
  SCGroupOpts,
  SCGroupPosition,
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

class SCGroup {
  public id: number | null;
  private action: number;
  private target: number | Node;

  constructor(Opts?: SCGroupOpts) {
    this.id = Opts?.id ?? null;
    this.action =
      "head" in (Opts ?? {})
        ? 0
        : "tail" in (Opts ?? {})
        ? 1
        : "before" in (Opts ?? {})
        ? 2
        : "after" in (Opts ?? {})
        ? 3
        : "replace" in (Opts ?? {})
        ? 4
        : 0;

    this.target =
      "head" in (Opts ?? {})
        ? Opts["head"]
        : "tail" in (Opts ?? {})
        ? Opts["tail"]
        : "before" in (Opts ?? {})
        ? Opts["before"]
        : "after" in (Opts ?? {})
        ? Opts["after"]
        : "replace" in (Opts ?? {})
        ? Opts["replace"]
        : 0;

    if (
      (this.target instanceof SCGroup || this.target instanceof SCSynth) &&
      this.target.id == null
    ) {
      throw new Error("Target node have no id assigned");
    }
  }

  async init(opts?: OSCClientOpts) {
    const client = opts?.client ?? new OSCClient();
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
            value:
              this.target instanceof SCGroup || this.target instanceof SCSynth
                ? this.target.id
                : this.target,
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
