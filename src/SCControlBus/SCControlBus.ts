import { OscMessage, OscType } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import { SCDataBusOpts } from "../types/SCControlBus";

async function queryControlBus(
  ids: number[],
  opts?: OSCClientOpts
): Promise<number[]> {
  const client = opts?.client ?? new OSCClient();

  const idArgs = ids.map((id) => ({
    type: "i",
    value: id,
  }));
  try {
    const info = await client.request(
      {
        address: "/c_get",
        args: idArgs as OscMessage["args"],
      },
      ["/c_set"]
    );

    return (info.args ?? [])
      .filter((arg, i) => i % 2 == 1)
      .map((arg) => (arg as { type: string; value: number }).value);
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
}

async function setControlBus(id: number, data: number[], opts?: OSCClientOpts) {
  const client = opts?.client ?? new OSCClient();

  try {
    const dataArgs: OscMessage["args"] = data.map((d) => ({
      type: "f",
      value: d,
    }));

    await client.send({
      address: "/c_setn",
      args: [
        {
          type: "i",
          value: id,
        },
        {
          type: "i",
          value: data.length,
        },
        ...dataArgs,
      ],
    });
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
}

class SCControlBus {
  id: number | undefined;
  constructor(opts?: SCDataBusOpts) {
    this.id = opts?.id;
  }

  async get(count?: number, opts?: OSCClientOpts): Promise<number[]> {
    if (this.id == undefined)
      return new Promise((resolve, reject) => resolve([]));

    const client = opts?.client ?? new OSCClient();
    try {
      const ids = Array.from({ length: count ?? 1 }).map(
        (_, i) => (this.id ?? 0) + i
      );
      return await queryControlBus(ids, { client });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async set(data: number[], opts?: OSCClientOpts): Promise<void> {
    if (this.id == null) return;
    const client = opts?.client ?? new OSCClient();

    try {
      await setControlBus(this.id, data, { client });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }
}

export { queryControlBus, setControlBus, SCControlBus };
