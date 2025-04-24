import { OscMessage, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import { SCSynthOpts } from "../types/SCSynth";
import { SCGroupPosition } from "../types/SCGroups";

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

  constructor(opts: SCSynthOpts & SCGroupPosition) {
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

  async play(
    params?: { [name: string]: number | string } | number[],
    opts?: OSCClientOpts
  ): Promise<void> {
    if (this.id != null) return;

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
            value: 0,
          },
          {
            type: "i",
            value: 1,
          },
          ...paramArgs,
        ],
      });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
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
