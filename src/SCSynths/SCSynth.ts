import { OscMessage, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import type { Opts } from "../types/SCSynth";

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

  constructor(opts: { synthdef?: string; id?: number }) {
    if (!opts.synthdef && !opts.id) {
      throw new SCSynthInvalidError();
    }

    this.synthdef = opts.synthdef ?? null;
    this.id = opts.id ?? null;
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
    entries: { [name: string]: number | string } | number[],
    opts?: OSCClientOpts
  ): Promise<void> {
    if (!this.id) {
      return;
    }

    const client = opts?.client ?? new OSCClient();

    try {
      const msg = {
        address: "/n_set",
        args: [
          {
            type: "i",
            value: this.id,
          },
          ...(Array.isArray(entries)
            ? entries
                .map((entry, index) => [
                  {
                    type: "i",
                    value: index,
                  },
                  {
                    type: typeof entry === "number" ? "f" : "s",
                    value: entry,
                  },
                ])
                .flat()
            : Object.entries(entries)
                .map(([param, value]) => [
                  {
                    type: typeof param === "number" ? "i" : "s",
                    value: param,
                  },
                  {
                    type: typeof value === "number" ? "f" : "s",
                    value: value,
                  },
                ])
                .flat()),
        ],
      };

      await client.send(msg as OscMessage);
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }
}

export default {
  querySynth,
  SCSynth,
};
