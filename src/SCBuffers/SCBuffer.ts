import { OscMessage, OscType, OscValue } from "osc";
import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";
import { SCBufferInfo, SCBufferOpts } from "../types/SCBuffer";
import { promisify } from "util";
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";

const execPromise = promisify(exec);
const SUPPORTED_FORMATS = [".wav", ".flac"];
const TEMP_DIR = path.resolve("/tmp/sclang-audio-cache");

async function queryBuffer(
  ids: number[],
  opts?: OSCClientOpts
): Promise<SCBufferInfo[]> {
  const client = opts?.client ?? new OSCClient();

  try {
    const info = await client.request(
      {
        address: "/b_query",
        args: [
          ...(ids.map((id) => ({
            type: "i",
            value: id,
          })) as OscMessage["args"]),
        ],
      },
      ["/b_info"]
    );

    let buffers: SCBufferInfo[] = [];

    while (info.args.length > 0) {
      const buffer = info.args.splice(0, 4);

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

class SCBuffer {
  path: string | null;
  id: number | null;
  allocate: null | { channels: number; frames: number };

  constructor(opts: SCBufferOpts) {
    if (
      opts.path == undefined &&
      opts.id == undefined &&
      opts.allocate == undefined
    ) {
      throw new SCBufferInvalidError();
    }

    this.path = opts?.path ?? null;
    this.id = opts?.id ?? null;
    this.allocate =
      opts?.allocate == undefined
        ? null
        : {
            channels: opts.allocate?.channels ?? 1,
            frames: opts.allocate?.frames ?? 0,
          };
  }

  async init(opts?: OSCClientOpts & { data: number[] }) {
    if (this.id != null) return this;

    if (!fs.existsSync(this.path)) {
      throw new Error(`File does not exist: ${this.path}`);
    }

    const ext = path.extname(this.path).toLowerCase();

    this.path = SUPPORTED_FORMATS.includes(ext)
      ? this.path
      : await convertToWav(this.path);

    const client = opts?.client ?? new OSCClient();

    if (opts?.data) {
      try {
        const id = await findFreeBufferBlock({ client });
        const data = opts?.data ?? [];

        await client.request(
          {
            address: "/b_alloc",
            args: [
              {
                type: "i",
                value: id,
              },
              {
                type: "i",
                value: this?.allocate.frames,
              },
              {
                type: "i",
                value: this?.allocate?.channels,
              },
            ],
          },
          ["/done"]
        );

        await client.request(
          {
            address: "/b_setn",
            args: [
              {
                type: "i",
                value: id,
              },
              {
                type: "i",
                value: 0,
              },
              {
                type: "i",
                value: data.length,
              },
              ...(data.map((sample) => ({
                type: "f",
                value: sample,
              })) as OscMessage["args"]),
            ],
          },
          ["/done"]
        );

        this.id = id;
        return this;
      } finally {
        if (!opts?.client) {
          client.client.close();
        }
      }
    }

    try {
      const id = await findFreeBufferBlock({ client });

      await client.request(
        {
          address: "/b_allocRead",
          args: [
            { type: "i", value: id },
            {
              type: "s",
              value: this.path,
            },
          ],
        },
        ["/done"]
      );

      this.id = id;
      return this;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async getChannels(opts?: OSCClientOpts): Promise<number> {
    if (this.id == null) return 0;

    const client = opts?.client ?? new OSCClient();

    try {
      const buffer = await queryBuffer([this.id]);
      return buffer[0].channels;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async getFrames(opts?: OSCClientOpts): Promise<number> {
    if (this.id == null) return 0;

    const client = opts?.client ?? new OSCClient();

    try {
      const buffer = await queryBuffer([this.id]);
      return buffer[0].frames;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async getSampleRate(opts?: OSCClientOpts): Promise<number> {
    if (this.id == null) return 0;

    const client = opts?.client ?? new OSCClient();

    try {
      const buffer = await queryBuffer([this.id]);
      return buffer[0].sampleRate;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }

  async free(opts?: OSCClientOpts): Promise<SCBuffer> {
    if (this.id == null) return this;

    const client = opts?.client ?? new OSCClient();

    try {
      await client.request(
        {
          address: "/b_free",
          args: [{ type: "i", value: this.id }],
        },
        ["/done"]
      );

      return this;
    } finally {
      if (!opts?.client) {
        client.client.close();
      }
    }
  }
}

export { queryBuffer, SCBuffer };
