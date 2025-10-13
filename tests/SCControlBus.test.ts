import { SCControlBus } from "../src/SCControlBus/SCControlBus";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

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
}, 35000);

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

describe("SCControlBus tests", () => {
  it("Should create a new control bus", async () => {
    const cbus = new SCControlBus({ id: 0 });

    await cbus.set([1, 2, 3]);

    const values = await cbus.get(3);

    expect(values[0]).toBe(1);
    expect(values[1]).toBe(2);
    expect(values[2]).toBe(3);
  });

  it("Should retrieve existing control bus", async () => {
    const cbus = new SCControlBus({ id: 10 });

    await cbus.set([666]);

    const cbus2 = new SCControlBus({ id: 10 });

    const [value] = await cbus2.get(1);
    expect(value).toBe(666);
  });
});
