import { OscMessage, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import { SCPosition, SCSynthOpts } from "../types/SCSynth";
import { SCGroup } from "../SCGroups/SCGroups";
import { SCControlBus } from "../SCControlBus/SCControlBus";

/**
 * Error thrown when a referenced synth cannot be found on the server
 * @class SCSynthNotFoundError
 * @extends Error
 */
class SCSynthNotFoundError extends Error {
  constructor(id: number) {
    super(`Synth ${id} not found`);
    this.name = "SCSynthNotFoundError";
  }
}

/**
 * Error thrown when synth creation is attempted without required parameters
 * @class SCSynthInvalidError
 * @extends Error
 */
class SCSynthInvalidError extends Error {
  constructor() {
    super("Invalid synth, an id or synthdef must be provided");
    this.name = "SCSynthInvalidError";
  }
}

/**
 * Queries the server for a synth by ID
 * @async
 * @function querySynth
 * @param {number} id - The synth ID to query
 * @param {Object} [opts] - Options
 * @param {OSCClient} [opts.client] - Custom OSC client
 * @returns {Promise<SCSynth|null>} The found synth or null if not found
 */
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

/**
 * Represents a SuperCollider synth node
 * @class SCSynth
 * @example
 * // Create a new sine wave synth
 * const synth = new SCSynth({ synthdef: 'sine' });
 * await synth.init({ freq: 440, amp: 0.5 });
 */
class SCSynth {
  /**
   * The synth definition name
   * @type {?string}
   * @public
   */
  public synthdef: string | null;
  /**
   * The server-assigned synth ID
   * @type {?number}
   * @public
   */
  public id: number | null;
  private params: { [name: string]: number | string } | number[];
  private action: number;
  private target: number | SCSynth | SCGroup;

  /**
   * Creates a new SCSynth instance
   * @constructor
   * @param {Object} opts - Configuration options
   * @param {string} [opts.synthdef] - Synth definition name
   * @param {number} [opts.id] - Existing synth ID to reference
   * @param {Object|Array} [opts.params] - Initial parameters
   * @param {number|SCSynth|SCGroup} [opts.head] - Add at head of target
   * @param {number|SCSynth|SCGroup} [opts.tail] - Add at tail of target
   * @param {number|SCSynth|SCGroup} [opts.before] - Add before target
   * @param {number|SCSynth|SCGroup} [opts.after] - Add after target
   * @param {number|SCSynth|SCGroup} [opts.replace] - Replace target
   * @throws {SCSynthInvalidError} If neither synthdef nor id is provided
   * @throws {Error} If target node has no ID assigned
   */
  constructor(
    opts: SCSynthOpts &
      SCPosition & {
        params?: { [name: string]: number | string } | number[];
      }
  ) {
    if (opts.synthdef == undefined && opts.id == undefined) {
      throw new SCSynthInvalidError();
    }

    this.synthdef = opts.synthdef ?? null;
    this.id = opts.id ?? null;
    this.action = this.determineAction(opts);

    this.target = this.determineTarget(opts);

    if (
      (this.target instanceof SCGroup || this.target instanceof SCSynth) &&
      this.target.id == null
    ) {
      throw new Error("Target node have no id assigned");
    }

    this.params = opts.params ?? {};
  }

  private determineAction(opts: any): number {
    if ("head" in opts) return 0;
    if ("tail" in opts) return 1;
    if ("before" in opts) return 2;
    if ("after" in opts) return 3;
    if ("replace" in opts) return 4;
    return 0;
  }

  private determineTarget(opts: any): number | SCSynth | SCGroup {
    if ("head" in opts) return opts.head;
    if ("tail" in opts) return opts.tail;
    if ("before" in opts) return opts.before;
    if ("after" in opts) return opts.after;
    if ("replace" in opts) return opts.replace;
    return 0;
  }

  /**
   * Gets a synth parameter value from the server
   * @async
   * @method get
   * @param {number|string} property - The parameter name or index
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<string|number|null>} The parameter value
   */
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

  /**
   * Sets synth parameters on the server
   * @async
   * @method set
   * @param {Object|Array} params - Parameters to set (name-value pairs or array)
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<void>}
   * @example
   * // Set parameters by name
   * await synth.set({ freq: 880, amp: 0.3 });
   *
   * // Set parameters by index
   * await synth.set([440, 0.5]);
   */
  async set(
    params:
      | { [name: string]: number | string | SCControlBus }
      | (number | string | SCControlBus)[],
    opts?: OSCClientOpts
  ): Promise<void> {
    if (!this.id) {
      return;
    }

    const client = opts?.client ?? new OSCClient();

    // Separate regular params and bus mappings
    const scalarArgs: OscMessage["args"] = [];
    const mapArgs: OscMessage["args"] = [];

    Object.entries(params).forEach(([name, param]) => {
      if (param instanceof SCControlBus) {
        mapArgs.push(
          {
            type: isNaN(Number(name)) ? "s" : "i",
            value: isNaN(Number(name)) ? name : Number(name),
          },
          {
            type: "i",
            value: param.id,
          }
        );
      } else {
        scalarArgs.push(
          {
            type: isNaN(Number(name)) ? "s" : "i",
            value: isNaN(Number(name)) ? name : Number(name),
          },
          {
            type: isNaN(Number(param)) ? "s" : "i",
            value: param,
          }
        );
      }
    });

    try {
      const msgScalar = {
        address: "/n_set",
        args: [
          {
            type: "i",
            value: this.id,
          },
          ...scalarArgs,
        ],
      };

      await client.send(msgScalar as OscMessage);

      const msgBusData = {
        address: "/n_map",
        args: [
          {
            type: "i",
            value: this.id,
          },
          ...mapArgs,
        ],
      };

      await client.send(msgBusData as OscMessage);
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Initializes the synth on the server
   * @async
   * @method init
   * @param {Object} [opts] - Initialization options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @param {Object|Array} [opts.params] - Initial parameters
   * @param {number|SCSynth|SCGroup} [opts.head] - Add at head of target
   * @param {number|SCSynth|SCGroup} [opts.tail] - Add at tail of target
   * @param {number|SCSynth|SCGroup} [opts.before] - Add before target
   * @param {number|SCSynth|SCGroup} [opts.after] - Add after target
   * @param {number|SCSynth|SCGroup} [opts.replace] - Replace target
   * @returns {Promise<SCSynth>} The initialized synth
   */
  async init(
    opts?: OSCClientOpts & {
      params?:
        | { [name: string]: number | string | SCControlBus }
        | (number | string | SCControlBus)[];
    } & SCPosition
  ): Promise<SCSynth> {
    if (this.id != null) return this;

    const client = opts?.client ?? new OSCClient();

    this.action = this.determineAction(opts);
    this.target = this.determineTarget(opts);

    const params = opts?.params ?? [];

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
          { type: "s", value: this.synthdef },
          { type: "i", value: this.id },
          { type: "i", value: this.action },
          { type: "i", value: target_id },
        ],
      });

      await this.set(params);
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
    return this;
  }

  /**
   * Frees the synth from the server
   * @async
   * @method free
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<void>}
   */
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
