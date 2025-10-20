import { OscMessage, OscType, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import { SCBufferInfo, SCBufferOpts } from "../types/SCBuffer";
import { promisify } from "util";
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";

// Utilities
const execPromise = promisify(exec);
const SUPPORTED_FORMATS = [".wav", ".flac"];
const TEMP_DIR = path.resolve("/tmp/sclang-audio-cache");

// --- Error classes ---

/**
 * Error thrown when buffer creation is attempted without required parameters
 * @class SCBufferInvalidError
 * @extends Error
 */
class SCBufferInvalidError extends Error {
  constructor() {
    super(
      "Invalid buffer, an id, path or allocate configuration must be provided"
    );
    this.name = "SCBufferInvalidError";
  }
}

/**
 * Error thrown when buffer creation is attempted and file does not exist
 * @class SCBufferPathNotFound
 * @extends Error
 */
class SCBufferPathNotFound extends Error {
  constructor(path: string) {
    super(`Path does not exists "${path}"`);
    this.name = "SCBufferPathNotFound";
  }
}

// --- Helper Functions ---

/**
 * Get the number of audio channels from a file using ffprobe.
 * @param filePath {string} Path to audio file.
 * @returns {Promise<number>} Number of channels reported by ffprobe.
 * @throws Error if ffprobe fails.
 */
async function getAudioChannels(filePath: string): Promise<number> {
  const cmd = `ffprobe -i "${filePath}" -show_entries stream=channels -select_streams a:0 -of compact=p=0:nk=1 -v 0`;
  try {
    const { stdout } = await execPromise(cmd);
    const channels = Number(stdout);

    return channels;
  } catch (err) {
    throw new Error(`ffprobe failed: ${err}`);
  }
}

/**
 * Convert given audio file to wav format, using ffmpeg.
 * @param filePath {string} Path to original audio file.
 * @returns {Promise<string>} Path to converted wav file.
 * @throws Error if conversion fails.
 */
async function convertToWav(filePath: string): Promise<string> {
  await fs.promises.mkdir(TEMP_DIR, { recursive: true });
  const baseName = path.basename(filePath, path.extname(filePath));
  const outputPath = path.join(TEMP_DIR, `${baseName}.wav`);

  const cmd = `ffmpeg -y -i "${filePath}" -ar 44100  -ac 2  "${outputPath}"`;

  try {
    await execPromise(cmd);
    return outputPath;
  } catch (err) {
    throw new Error(`ffmpeg conversion failed: ${err}`);
  }
}

/**
 * Search for free buffer block on server.
 * @async
 * @function findFreeBufferBlock
 * @param opts {OSCClientOpts}
 * @returns {Promise<number>} ID of free buffer block.
 */
async function findFreeBufferBlock(opts?: OSCClientOpts): Promise<number> {
  const client = opts?.client ?? new OSCClient();
  let i = 0;

  try {
    let freeBufferId = 0;
    while (true) {
      // check first 10

      const buffers = await queryBuffer(
        Array.from({ length: 10 }).map((_, index) => index + i * 10),
        { client }
      );

      const freeBuffer = buffers.find(
        (buffer) => buffer.channels == 0 && buffer.frames == 0
      );

      if (freeBuffer != undefined) {
        freeBufferId = freeBuffer.id;
        break;
      }
      i++;
    }
    return freeBufferId;
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
}

/**
 * Query the server for buffer info for the given buffer IDs.
 * @async
 * @function queryBuffer
 * @param {Array.number} ids - The synth IDs to query
 * @param {Object} [opts] - Options
 * @param {OSCClient} [opts.client] - Custom OSC client
 * @returns {Promise<SCBufferInfo[]>} The found buffers
 */
async function queryBuffer(
  ids: number[],
  opts?: OSCClientOpts
): Promise<SCBufferInfo[]> {
  const client = opts?.client ?? new OSCClient();

  const ids_args = ids.map((id) => ({
    type: "i",
    value: id,
  })) as OscMessage["args"];

  try {
    const info = await client.request(
      {
        address: "/b_query",
        args: ids_args,
      },
      ["/b_info"],
      opts?.timeout
    );

    let buffers: SCBufferInfo[] = [];

    while ((info.args ?? []).length > 0) {
      const buffer = (info.args ?? []).splice(0, 4);

      buffers.push({
        id: Number((buffer as { type: OscType; value: OscValue }[])[0].value),
        frames: Number(
          (buffer as { type: OscType; value: OscValue }[])[1].value
        ),
        channels: Number(
          (buffer as { type: OscType; value: OscValue }[])[2].value
        ),
        sampleRate: Number(
          (buffer as { type: OscType; value: OscValue }[])[3].value
        ),
      });
    }

    return buffers;
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
}

// --- SCBuffer class ---

/**
 * Represents a SuperCollider buffer.
 * Encapsulates server buffer allocation, lifecycle, and audio data interaction.
 *
 * @class SCBuffer
 * @example
 * // Create a new buffer
 * const buffer = new SCBuffer({ path: '/tmp/audio.mp3' });
 * await buffer.init();
 */
class SCBuffer {
  public id: number;
  public channels: number | number[];
  public frames: number;
  public startFrame: number;
  public data: number[];
  public path: string;

  /**
   * Creates a new SCBuffer instance
   * @constructor
   * @param {Object} opts - Configuration options
   * @param {string} [opts.path] - path of audio file
   * @param {number} [opts.id] - Existing synth ID to reference
   * @param {Object} [opts.allocate] - Allocation options
   * @param {number|number[]} [opts.allocate.channels] - Channel to allocate or list of channel indexes.
   * @param {number} [opts.allocate.frames] - Frames to allocate
   * @param {number} [opts.allocate.startFrame] - Starting frame to allocate
   * @throws {SCBufferInvalidError} If neither path, id or allocate is provided
   */
  constructor(opts: SCBufferOpts) {
    if ("id" in opts && !("data" in opts) && !("path" in opts)) {
      this.id = opts.id;
      this.channels = 0;
      this.frames = 0;
      this.startFrame = 0;
      this.data = [];
      this.path = "";

      return;
    }
    // Create buffer from data
    if ("data" in opts) {
      this.id = opts.id ?? -1;
      this.channels = opts.channels ?? 1;
      this.frames = opts.frames ?? opts.data.length;
      this.startFrame = opts.startFrame ?? 0;
      this.data = opts.data;
      this.path = "";

      return;
    }
    // Read buffer from file
    if ("path" in opts) {
      if (!fs.existsSync(opts?.path)) {
        throw new SCBufferPathNotFound(opts?.path);
      }
      this.id = -1;
      this.channels = opts.channels ?? 2;
      this.frames = opts.frames ?? 0;
      this.startFrame = opts.startFrame ?? 0;
      this.data = [];
      this.path = opts.path;

      return;
    }

    throw new SCBufferInvalidError();

    // check if we try to read from an non existing file
  }

  /**
   * Initializes the buffer on the server
   * @async
   * @method init
   * @param {Object} [opts] - Initialization options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @param {Array.number} [opts.data] - Data values
   * @returns {Promise<SCBuffer>} The initialized buffer
   * @throws {SCBufferPathNotFound} Path is not found
   */
  async init(opts?: OSCClientOpts & { data: number[] }) {
    const client = opts?.client ?? new OSCClient();

    if (this.id == -1) {
      this.id = await findFreeBufferBlock({ client, timeout: opts?.timeout });
    }

    try {
      if (this.path.length > 0)
        return await this.readFromFile({ client, timeout: opts?.timeout });
      if (!this.path)
        return await this.allocateBuffer({
          data: this.data.length > 0 ? this.data : opts?.data ?? [],
          client: client,
          timeout: opts?.timeout,
        });
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }

    return this;
  }

  private async readFromFile(opts: {
    client: OSCClient;
    timeout?: number;
  }): Promise<SCBuffer> {
    const client = opts.client;

    const ext = path.extname(this.path ?? "").toLowerCase();

    this.path = SUPPORTED_FORMATS.includes(ext)
      ? this.path
      : await convertToWav(this.path ?? "");

    if ((this.channels = 0)) {
      this.channels = await getAudioChannels(this.path);
    }

    await client.request(
      {
        address: "/b_allocReadChannel",
        args: [
          { type: "i", value: this.id },
          {
            type: "s",
            value: this.path,
          },
          {
            type: "i",
            value: this.startFrame,
          },
          {
            type: "i",
            value: this.frames,
          },
          ...(Array.isArray(this.channels)
            ? this.channels
            : Array.from({ length: this.channels }).map((_, i) => i)
          ).map((chan) => ({ type: "i", value: chan } as OscValue)),
        ],
      },
      ["/done"],
      opts?.timeout
    );

    return this;
  }

  private async allocateBuffer(
    opts: { data: number[] } & {
      client: OSCClient;
      timeout?: number;
    }
  ): Promise<SCBuffer> {
    const client = opts.client;

    const data = opts.data;
    await client.request(
      {
        address: "/b_alloc",
        args: [
          { type: "i", value: this.id },
          { type: "i", value: this.frames },
          { type: "i", value: this.channels },
        ],
      },
      ["/done"],
      opts?.timeout
    );

    if (data) {
      await this.set({ from: 0, ...opts });
    }

    return this;
  }

  /**
   * Get number of channels
   * @async
   * @method getChannels
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<number>}
   */
  async getChannels(opts?: OSCClientOpts): Promise<number> {
    if (this.id == -1) return 0;

    const client = opts?.client ?? new OSCClient();

    try {
      const buffer = await queryBuffer([this.id], opts);
      return buffer[0].channels;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Get number of frames
   * @async
   * @method getFrames
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<number>}
   */
  async getFrames(opts?: OSCClientOpts): Promise<number> {
    if (this.id == -1) return 0;

    const client = opts?.client ?? new OSCClient();

    try {
      const buffer = await queryBuffer([this.id], opts);
      return buffer[0].frames;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Set number of frames
   * @async
   * @method set
   * @param {Object} [opts] - Options
   * @param {number[]} [opts.data] - data array
   * @param {number} [opts.from] - where to start setting the data array
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<SCBuffer>}
   */
  async set(
    opts: { data: number[]; from: number } & OSCClientOpts
  ): Promise<SCBuffer> {
    const client = opts?.client ?? new OSCClient();

    try {
      await client.send(
        {
          address: "/b_setn",
          args: [
            { type: "i", value: this.id },
            { type: "i", value: opts.from },
            { type: "i", value: opts.data.length },
            ...opts.data.map(
              (dat) =>
                ({
                  type: "f",
                  value: dat,
                } as OscValue)
            ),
          ],
        },
        opts?.timeout
      );

      return this;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async get(
    opts: { index: number | number[] } & OSCClientOpts
  ): Promise<number[]> {
    const client = opts?.client ?? new OSCClient();

    try {
      const response = await client.request(
        {
          address: "/b_get",
          args: [
            { type: "i", value: this.id },
            ...(Array.isArray(opts.index) ? opts.index : [opts.index]).map(
              (i) =>
                ({
                  type: "i",
                  value: i,
                } as OscValue)
            ),
          ],
        },
        ["/b_set"],
        opts?.timeout
      );

      const samples = [];
      for (let k = 2; k < (response.args ?? []).length; k += 2) {
        samples.push(((response.args ?? [])[k] as OscValue).value);
      }

      return samples;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Get sample rate
   * @async
   * @method getSampleRate
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<number>}
   */
  async getSampleRate(opts?: OSCClientOpts): Promise<number> {
    if (this.id == -1) return 0;

    const client = opts?.client ?? new OSCClient();

    try {
      const buffer = await queryBuffer([this.id], opts);
      return buffer[0].sampleRate;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  /**
   * Frees the buffer from the server
   * @async
   * @method free
   * @param {Object} [opts] - Options
   * @param {OSCClient} [opts.client] - Custom OSC client
   * @returns {Promise<SCBuffer>}
   */
  async free(opts?: OSCClientOpts): Promise<SCBuffer> {
    if (this.id == -1) return this;

    const client = opts?.client ?? new OSCClient();

    try {
      await client.request(
        {
          address: "/b_free",
          args: [{ type: "i", value: this.id }],
        },
        ["/done"],
        opts?.timeout
      );

      return this;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }
}

export { queryBuffer, SCBufferInfo, SCBufferPathNotFound, SCBuffer };
