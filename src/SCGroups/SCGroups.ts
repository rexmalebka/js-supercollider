import { OscMessage, OscValue } from "osc";
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
  private target: number | SCSynth | SCGroup;

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

  async init(opts?: OSCClientOpts & SCGroupPosition) {
    if (this.id != null) return;

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

  async add(opts?: OSCClientOpts & SCGroupPosition) {
    if (this.id == null) return null;

    if (
      !("head" in opts) &&
      !("tail" in opts) &&
      !("before" in opts) &&
      !("after" in opts)
    )
      return null;

    this.action =
      "head" in (opts ?? {})
        ? 0
        : "tail" in (opts ?? {})
        ? 1
        : "before" in (opts ?? {})
        ? 2
        : "after" in (opts ?? {})
        ? 3
        : 0;

    this.target =
      "head" in (opts ?? {})
        ? (opts["head"] as SCSynth | SCGroup)
        : "tail" in (opts ?? {})
        ? (opts["tail"] as SCSynth | SCGroup)
        : "before" in (opts ?? {})
        ? (opts["before"] as SCSynth | SCGroup)
        : "after" in (opts ?? {})
        ? (opts["after"] as SCSynth | SCGroup)
        : 0;

    const client = opts?.client ?? new OSCClient();

    const address =
      this.action == 0
        ? "/g_tail"
        : this.action == 1
        ? "/g_head"
        : this.action == 2
        ? "/n_before"
        : this.action == 3
        ? "/n_after"
        : "/n_before";

    const target_id =
      this.target instanceof SCGroup || this.target instanceof SCSynth
        ? this.target.id
        : this.target;

    const args: OscMessage["args"] =
      address in ["/g_tail", "/g_head"]
        ? [
            {
              type: "i",
              value: this.id,
            },
            {
              type: "i",
              value: target_id,
            },
          ]
        : [
            {
              type: "i",
              value: target_id,
            },
            {
              type: "i",
              value: this.id,
            },
          ];

    try {
      if (target_id != null) {
        await client.send({
          address,
          args,
        });
      } else {
        console.log("AAAAAAAAA", this.action, [
          ["head", "tail", "before", "after"][this.action] ?? "before",
        ]);
        (this.target as SCSynth | SCGroup).init({
          [["head", "tail", "before", "after"][this.action] ?? "before"]:
            this.id,
        });
      }
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
