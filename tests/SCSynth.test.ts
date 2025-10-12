import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { SCSynth } from "../src/SCSynths/SCSynth";

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

describe("SCSynth tests", () => {
  it("should create a new synth", async () => {
    await SendSCCommand(
      'SynthDef("test",{|param=2,param2=3| 0 }).add;Routine{	1.wait; ("SCServer" + [] + "SCServer").postln;}.play;'
    );

    const synth = new SCSynth({
      synthdef: "test",
    });

    await synth.init();
    const testParam1 = await synth.get("param");
    const testParam2 = await synth.get("param2");

    expect(testParam1).toBe(2);
    expect(testParam2).toBe(3);
  }, 25000);

  it("should create consecutive ids", async () => {
    await SendSCCommand(
      'SynthDef("test",{|param=2,param2=3| 0 }).add;Routine{	1.wait; ("SCServer" + [] + "SCServer").postln;}.play;'
    );

    const synths = Array.from({ length: 5 }).map(
      (_, i) =>
        new Promise<SCSynth>((res, rej) => {
          setTimeout(() => {
            res(new SCSynth({ synthdef: "test" }).init());
          }, 200 * (i + 1));
        })
    );

    expect((await synths[1]).id - (await synths[0]).id).toBe(1);
    expect((await synths[2]).id - (await synths[1]).id).toBe(1);
    expect((await synths[3]).id - (await synths[2]).id).toBe(1);
    expect((await synths[4]).id - (await synths[3]).id).toBe(1);

    synths.forEach(async (synth) => {
      await (await synth).free();
    });
  }, 25000);

  it("should modify synth params", async () => {
    await SendSCCommand(
      'SynthDef("test",{|param=2,param2=3| 0 }).add;Routine{	1.wait; ("SCServer" + [] + "SCServer").postln;}.play;'
    );

    const synth = new SCSynth({
      synthdef: "test",
    });

    await synth.init();
    await synth.set({ param: 6.5, param2: 7.1 });

    const testParam1 = await synth.get("param");
    const testParam2 = await synth.get("param2");

    expect(testParam1).toBeCloseTo(6.5);
    expect(testParam2).toBeCloseTo(7.1);

    await synth.set([3.4]);

    const testParam1Changed = await synth.get("param");

    expect(testParam1Changed).toBeCloseTo(3.4);
  }, 25000);

  it("should modify starts with some params", async () => {
    await SendSCCommand(
      'SynthDef("test",{|param=2,param2=3| 0 }).add;Routine{	1.wait; ("SCServer" + [] + "SCServer").postln;}.play;'
    );

    const synth = new SCSynth({
      synthdef: "test",
    });

    await synth.init({ params: [1.1, 2.2] });

    const testParam1 = await synth.get("param");
    const testParam2 = await synth.get("param2");

    expect(testParam1).toBeCloseTo(1.1);
    expect(testParam2).toBeCloseTo(2.2);
  }, 25000);

  it("should free a synth", async () => {
    await SendSCCommand(
      'SynthDef("test",{|param=2,param2=3| 0 }).add;Routine{	1.wait; ("SCServer" + [] + "SCServer").postln;}.play;'
    );

    const synth = new SCSynth({
      synthdef: "test",
    });

    await synth.init({ params: [1.1, 2.2] });

    await synth.free();

    try {
      await synth.get("param");
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow(`Synth ${synth.id} not found`);
    }
  }, 25000);

  it("should retrieve synth parameters", async () => {
    const SynthId = await SendSCCommand(
      'SynthDef("test",{|param=2,param2=3| 0 }).add;Routine{	var a;1.wait; a = Synth("test"); ("SCServer" + [a.nodeID] + "SCServer").postln;}.play;'
    );

    const synth = new SCSynth({ id: SynthId[0] });
    const testParam1 = await synth.get("param");
    const testParam2 = await synth.get("param2");

    expect(testParam1).toBe(2);
    expect(testParam2).toBe(3);
  }, 25000);
});
