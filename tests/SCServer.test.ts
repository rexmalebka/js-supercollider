import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import SCServer from "../src/SCServer/SCServer";

const getSClang = (): Promise<ChildProcessWithoutNullStreams> => {
  let started = false;

  return new Promise((res, rej) => {
    const proc = spawn("sclang", []);

    proc.on("error", (err) => {
      rej(err);
    });

    const wait_interpreter = (data) => {
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
    const waitMsg = (data) => {
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

let proc: ChildProcessWithoutNullStreams;

beforeAll(async () => {
  proc = await getSClang();

  await SendSCCommand(
    `s.boot;s.waitForBoot({ Routine{ 2.wait; ("SCServer" + [] + "SCServer").postln; }.play });`
  );
}, 25000);

afterAll(async () => {
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

describe("SCServer tests", () => {
  it("should retrieve Supercollider status", async () => {
    const SCServerStatus = await SendSCCommand(
      '("SCServer" + [s.numUGens, s.numSynths, s.numGroups, s.numSynthDefs, s.avgCPU, s.peakCPU, s.sampleRate, s.actualSampleRate] + "SCServer").postln;'
    );

    const status = await SCServer.status();

    expect(SCServerStatus[0]).toBe(status.ugens);
    expect(SCServerStatus[1]).toBe(status.synths);
    expect(SCServerStatus[2]).toBe(status.groups);
    expect(SCServerStatus[3]).toBe(status.synthdef);
    expect(SCServerStatus[4] - status.avgCPU).toBeLessThan(1);
    expect(SCServerStatus[5] - status.peakCPU).toBeLessThan(1);
    expect(SCServerStatus[6]).toBeCloseTo(status.samplerate);
    expect(SCServerStatus[7] - status.actualSamplerate).toBeLessThan(30);
  }, 25000);

  it("should retrieve Supercollider version", async () => {
    const SCServerVersion = await SendSCCommand(
      '("SCServer" + [Main.scVersionMajor, Main.scVersionMinor] + "SCServer").postln;'
    );

    const version = await SCServer.version();

    expect(SCServerVersion[0]).toBe(version.major);
    expect(SCServerVersion[1]).toBe(version.minor);
  }, 25000);

  it("should quit Supercollider", async () => {
    await SCServer.quit();

    try {
      await SCServer.status();
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow(`No response for "/status.reply"`);
    }

    await new Promise((res, rej) => {
      setTimeout(async () => {
        res(
          await SendSCCommand('s.boot;("SCServer" + [] + "SCServer").postln;')
        );
      }, 2000);
    });
  }, 25000);

});
