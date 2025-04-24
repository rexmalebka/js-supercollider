import { OscMessage, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import { SCPosition, SCSynthOpts } from "../types/SCSynth";
import { SCGroup } from "../SCGroups/SCGroups";

class SCSynthNotFoundError extends Error {
  constructor(id: number) {
    super(`Synth ${id} not found`);
    this.name = "SCSynthNotFoundError";
  }
}

class SCSynthInvalidError extends Error {
  constructor() {
    super("Invalid synth, an id or synthdef must be provided");
    this.name = "SCSynthInvalidError";
  }
}

const querySynth = async function (
  id: number,
  opts?: OSCClientOpts
): Promise<null | SCSynth> {
  const client = opts?.client ?? new OSCClient();

  try {
    const response = await client.request(
      {
        address: "/s_get",
        args: [
          {
            type: "i",
            value: id,
          },
        ],
      },
      ["/n_set", "/fail"]
    );

    if (response.address == "/fail") {
      return null;
    }

    if (response.address == "/n_set") {
      const synth = new SCSynth({
        id,
      });

      return synth;
    }
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

class SCSynth {
  public synthdef: string | null;
  public id: number | null;
  private params: { [name: string]: number | string } | number[];
  private action: number;
  private target: number | SCSynth | SCGroup;

  constructor(
    opts: SCSynthOpts &
      SCPosition & {
        params?: { [name: string]: number | string } | number[];
      }
  ) {
    if (!opts.synthdef && !opts.id) {
      throw new SCSynthInvalidError();
    }

    this.synthdef = opts.synthdef ?? null;
    this.id = opts.id ?? null;
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

    this.params = opts.params ?? {};
  }

  async get(
    property: number | string,
    opts?: OSCClientOpts
  ): Promise<string | number> {
    if (!this.id) {
      return null;
    }

    const client = opts?.client ?? new OSCClient();

    try {
      const synthArg = await client.request(
        {
          address: "/s_get",
          args: [
            {
              type: "i",
              value: this.id,
            },
            {
              type: isNaN(Number(property)) ? "s" : "i",
              value: property,
            },
          ],
        },
        ["/fail", "/n_set"]
      );

      if (synthArg.address == "/fail") {
        throw new SCSynthNotFoundError(this.id);
      }

      return (synthArg.args[2] as OscValue).value as number;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async set(
    params: { [name: string]: number | string } | number[],
    opts?: OSCClientOpts
  ): Promise<void> {
    if (!this.id) {
      return;
    }

    const client = opts?.client ?? new OSCClient();

    params = params ?? [];
    const paramArgs: OscMessage["args"] = [];

    if (Array.isArray(params)) {
      params.forEach((param, index) => {
        paramArgs.push(
          {
            type: "i",
            value: index,
          },
          {
            type: typeof param == "number" ? "f" : "s",
            value: param,
          }
        );
      });
    } else {
      Object.entries(params).forEach(([name, param]) => {
        paramArgs.push(
          {
            type: "s",
            value: name,
          },
          {
            type: typeof param == "number" ? "f" : "s",
            value: param,
          }
        );
      });
    }
    try {
      const msg = {
        address: "/n_set",
        args: [
          {
            type: "i",
            value: this.id,
          },
          ...paramArgs,
        ],
      };

      await client.send(msg as OscMessage);
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async init(
    opts?: OSCClientOpts & {
      params?: { [name: string]: number | string } | number[];
    } & SCPosition
  ): Promise<SCSynth> {
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

    const params = opts?.params ?? [];
    const paramArgs: OscMessage["args"] = [];

    if (Array.isArray(params)) {
      params.forEach((param, index) => {
        paramArgs.push(
          {
            type: "i",
            value: index,
          },
          {
            type: typeof param == "number" ? "f" : "s",
            value: param,
          }
        );
      });
    } else {
      Object.entries(params).forEach(([name, param]) => {
        paramArgs.push(
          {
            type: "s",
            value: name,
          },
          {
            type: typeof param == "number" ? "f" : "s",
            value: param,
          }
        );
      });
    }

    try {
      let synthId = 1000; // Start searching from this ID
      let availableId: number | null = null;

      while (true) {
        const synth = await querySynth(synthId, { client });
        if (synth === null) {
          availableId = synthId;
          break;
        }
        synthId++;
      }

      this.id = availableId;

      const target_id =
        this.target instanceof SCGroup || this.target instanceof SCSynth
          ? this.target.id
          : this.target;

      await client.send({
        address: "/s_new",
        args: [
          {
            type: "s",
            value: this.synthdef,
          },
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
          ...paramArgs,
        ],
      });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
    return this;
  }

  async free(opts?: OSCClientOpts): Promise<void> {
    if (this.id == null) return;

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
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }
}

export { querySynth, SCSynth };
