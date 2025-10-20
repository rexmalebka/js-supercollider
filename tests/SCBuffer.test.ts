import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { SCBuffer } from "../src/SCBuffers/SCBuffer";
import { promisify } from "util";
import { exec } from "child_process";

import * as wavEncoder from "wav-encoder";
const os = require("os");
const fs = require("fs");
const path = require("path");

const getSClang = (): Promise<ChildProcessWithoutNullStreams> => {
  let started = false;

  return new Promise((res, rej) => {
    const proc = spawn("sclang", []);

    proc.on("error", (err) => {
      rej(err);
    });

    const wait_interpreter = (data: any) => {
      const line: string = data.toString();

      if (!started && line.startsWith("sc3>")) {
        proc.stdout.off("data", wait_interpreter);

        res(proc);
      }
    };

    proc.stdout.on("data", wait_interpreter);
  });
};

function SendSCCommand(cmd: string) {
  proc.stdout.removeAllListeners();
  proc.stdin.write(`${cmd}\n`);

  return new Promise((res, rej) => {
    const waitMsg = (data: any) => {
      const line: string = data.toString();
      const match = line.match(/SCServer (?<status>.*) SCServer/);

      if (match) {
        try {
          proc.stdout.off("data", waitMsg);
          res(JSON.parse(match[1]));
        } catch (err) {
          rej(err);
        }
      }
    };

    proc.stdout.on("data", waitMsg);
  });
}

type GenerateWavOptions = {
  channels?: number;
  sampleRate?: number;
  duration?: number; // in seconds
  output?: string;
  fill?: "silence" | "noise" | "sine";
};

export async function generateTestWav({
  channels = 2,
  sampleRate = 44100,
  duration = 1,
  output = "test.wav",
  fill = "noise",
}: GenerateWavOptions = {}) {
  const numFrames = sampleRate * duration;
  const channelData: Float32Array[] = [];

  for (let ch = 0; ch < channels; ch++) {
    const data = new Float32Array(numFrames);
    for (let i = 0; i < numFrames; i++) {
      switch (fill) {
        case "noise":
          data[i] = Math.random() * 2 - 1;
          break;
        case "sine":
          data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
          break;
        case "silence":
        default:
          data[i] = 0;
      }
    }
    channelData.push(data);
  }

  const audioData = { sampleRate, channelData };
  const buffer = await wavEncoder.encode(audioData);
  fs.writeFileSync(output, Buffer.from(buffer));

  return output;
}
const execPromise = promisify(exec);
const oneChannelBufferFilePath = path.join(os.tmpdir(), "sc-test-1.wav");
const twoChannelBufferFilePath = path.join(os.tmpdir(), "sc-test-2.wav");
const threeChannelBufferFilePath = path.join(os.tmpdir(), "sc-test-3.wav");
const mp3BufferFilePath = path.join(os.tmpdir(), "sc-test-4.mp3");

let proc: ChildProcessWithoutNullStreams;

beforeAll(async () => {
  await generateTestWav({ output: oneChannelBufferFilePath, channels: 1 });
  await generateTestWav({ output: twoChannelBufferFilePath, duration: 2.5 });
  await generateTestWav({
    output: threeChannelBufferFilePath,
    duration: 7.5,
    channels: 3,
  });

  const cmd = `ffmpeg -y -i "${twoChannelBufferFilePath}" -ar 44100  -ac 2  "${mp3BufferFilePath}"`;
  await execPromise(cmd);

  proc = await getSClang();

  await SendSCCommand(
    `s.boot;s.waitForBoot({ Routine{ 2.wait; ("SCServer" + [] + "SCServer").postln; }.play });`
  );
}, 35000);

afterAll(async () => {
  if (fs.existsSync(oneChannelBufferFilePath)) {
    fs.unlinkSync(oneChannelBufferFilePath);
  }

  if (fs.existsSync(twoChannelBufferFilePath)) {
    fs.unlinkSync(twoChannelBufferFilePath);
  }

  if (fs.existsSync(threeChannelBufferFilePath)) {
    fs.unlinkSync(threeChannelBufferFilePath);
  }

  if (fs.existsSync(mp3BufferFilePath)) {
    fs.unlinkSync(mp3BufferFilePath);
  }
  // Close all streams
  proc.stdin.end();
  proc.stdout.destroy();
  proc.stderr.destroy();

  // Remove all event listeners
  proc.stdout.removeAllListeners();
  proc.stderr.removeAllListeners();
  proc.stdin.removeAllListeners();
  proc.removeAllListeners();

  // Force kill with timeout
  const forceKill = setTimeout(() => {
    proc.kill("SIGKILL");
  }, 1000);

  // Try graceful termination first
  proc.kill("SIGTERM");

  // Wait for process to exit
  await new Promise((resolve) => {
    proc.once("exit", () => {
      clearTimeout(forceKill);
      resolve(null);
    });

    proc.once("close", () => {
      clearTimeout(forceKill);
      resolve(null);
    });
  });
});

describe("SCBuffer tests", () => {
  it("Should load a buffer from path", async () => {
    const buffer = await new SCBuffer({
      path: oneChannelBufferFilePath,
      channels: 1,
    }).init();

    const samplerate = await buffer.getSampleRate();
    const channels = await buffer.getChannels();
    const numFrames = await buffer.getFrames();

    expect(samplerate).toBeCloseTo(44100);
    expect(channels).toBe(1);
    expect(numFrames / samplerate).toBeCloseTo(1);

    const buffer2 = await new SCBuffer({
      path: twoChannelBufferFilePath,
      channels: 2,
    }).init();

    const samplerate2 = await buffer2.getSampleRate();
    const channels2 = await buffer2.getChannels();
    const numFrames2 = await buffer2.getFrames();

    expect(samplerate2).toBeCloseTo(44100);
    expect(channels2).toBe(2);
    expect(numFrames2 / samplerate2).toBeCloseTo(2.5);

    expect((buffer2.id as number) - (buffer.id as number)).toBe(1);
  });

  it("Should throw error if path does not exists", async () => {
    const notRealPath = path.join(os.tmpdir(), "not-real.wav");
    try {
      await new SCBuffer({
        path: notRealPath,
      }).init();
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow(`Path does not exists "${notRealPath}"`);
    }
  });

  it("Should infer channel numbers from file", async () => {
    const buffer = await new SCBuffer({
      path: threeChannelBufferFilePath,
    }).init();

    const samplerate = await buffer.getSampleRate();
    const channels = await buffer.getChannels();
    const numFrames = await buffer.getFrames();

    expect(channels).toBe(3);
    expect(numFrames / samplerate).toBeCloseTo(7.5);
  });

  it("Should throw error if no option provided", async () => {
    try {
      // @ts-expect-error
      new SCBuffer({});
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow(
        "Invalid buffer, an id, path or allocate configuration must be provided"
      );
    }
  });

  it("Should be able to read from existing buffer", async () => {
    const buffer = await new SCBuffer({
      path: threeChannelBufferFilePath,
    }).init();

    const samplerate = await buffer.getSampleRate();
    const channels = await buffer.getChannels();
    const numFrames = await buffer.getFrames();

    const buffer2 = new SCBuffer({
      id: buffer.id,
    });

    const samplerate2 = await buffer2.getSampleRate();
    const channels2 = await buffer2.getChannels();
    const numFrames2 = await buffer2.getFrames();

    expect(samplerate).toBe(samplerate2);
    expect(channels).toBe(channels2);
    expect(numFrames).toBe(numFrames2);
  });

  it("Should allocate an empty buffer", async () => {
    const buffer = await new SCBuffer({
      channels: 2,
      frames: 20,
      data: [],
    }).init({ data: [1, 2, 3, 4, 5, 6, 7] });

    const frames = await buffer.getFrames();

    expect(frames).toBe(20);

    const samples = await buffer.get({ index: [0, 2, 4] });

    expect(samples[0]).toBe(1);
    expect(samples[1]).toBe(3);
    expect(samples[2]).toBe(5);
  }, 20000);

  it("Should be able to set new values", async () => {
    const buffer = await new SCBuffer({
      channels: 2,
      frames: 20,
      data: [],
    }).init({ data: [1, 2, 3, 4, 5, 6, 7] });

    await buffer.set({ data: [6], from: 0 });

    const value = await buffer.get({ index: 0 });

    expect(value[0]).toBe(6);
  });

  it("Should be able to convert from mp3", async () => {
    const buffer = await new SCBuffer({
      path: mp3BufferFilePath,
    }).init();

    const samplerate = await buffer.getSampleRate();
    const channels = await buffer.getChannels();
    const numFrames = await buffer.getFrames();

    expect(channels).toBe(2);
    expect(numFrames / samplerate).toBeCloseTo(2.5);
  });

  it("Should free the buffer", async () => {
    const buffer = await new SCBuffer({
      path: mp3BufferFilePath,
    }).init();

    const numFrames = await buffer.getFrames();

    expect(numFrames).toBeGreaterThan(0);

    await buffer.free();

    const numFrames2 = await buffer.getFrames();

    expect(numFrames2).toBe(0);
  });
});
