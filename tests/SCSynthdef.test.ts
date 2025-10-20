import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { freeSynthdef, loadSynthdef } from "../src/SCSynthdefs/SCSynthdef";
import { SCSynth } from "../src/SCSynths/SCSynth";
import {
  readFileSync,
  mkdirSync,
  rmdirSync,
  rmSync,
  readSync,
  stat,
  statSync,
  existsSync,
  readdirSync,
} from "fs";
import {
  decodeSCSynthdefBuffer,
  normalizeToArrayBuffer,
} from "../src/SCSynthdefs/SCSynthdefUtils";
import { extname, join } from "path";

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

let proc: ChildProcessWithoutNullStreams;

beforeAll(async () => {
  proc = await getSClang();

  await SendSCCommand(
    `s.boot;s.waitForBoot({ Routine{ 2.wait; ("SCServer" + [] + "SCServer").postln; }.play });`
  );
}, 35000);

afterAll(async () => {
  if (existsSync("/tmp/synthdefs_2"))
    rmdirSync("/tmp/synthdefs_2", { recursive: true });
  if (existsSync("/tmp/synthdefs"))
    rmdirSync("/tmp/synthdefs", { recursive: true });

  const directoryFiles = readdirSync("/tmp/");

  for (let file of directoryFiles) {
    const fstat = statSync(join("/tmp", file));
    if (fstat.isFile() && extname(file) == ".scsyndef") {
      rmSync(join("/tmp", file));
    }
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

describe("Synthdef tests", () => {
  it("Should return error if file is not synthdef", async () => {
    try {
      await loadSynthdef({ path: "./unexisting_file" });
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow(`ENOENT: no such file or directory, stat './unexisting_file`);
    }
  });

  it("Should load synthdef file", async () => {
    await SendSCCommand(
      `SynthDef("test",{|param=666| 0}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    await loadSynthdef({ path: "/tmp/test.scsyndef" });

    const synth = await new SCSynth({ synthdef: "test" }).init();

    expect(await synth.get("param")).toBe(666);
  }, 5000);

  it("Should load synthdef from a directory", async () => {
    mkdirSync("/tmp/synthdefs/", { recursive: true });

    await SendSCCommand(
      `SynthDef("test1",{|param=1| 0}).writeDefFile("/tmp/synthdefs/");("SCServer"+[]+"SCServer").postln;`
    );

    await SendSCCommand(
      `SynthDef("test2",{|param=2| 0}).writeDefFile("/tmp/synthdefs/");("SCServer"+[]+"SCServer").postln;`
    );

    await SendSCCommand(
      `SynthDef("test3",{|param=3| 0}).writeDefFile("/tmp/synthdefs/");("SCServer"+[]+"SCServer").postln;`
    );

    await loadSynthdef({ path: "/tmp/synthdefs" });

    const synths = [
      await new SCSynth({ synthdef: "test1" }).init(),
      await new SCSynth({ synthdef: "test2" }).init(),
      await new SCSynth({ synthdef: "test3" }).init(),
    ];

    expect(await synths[0].get("param")).toBe(1);
    expect(await synths[1].get("param")).toBe(2);
    expect(await synths[2].get("param")).toBe(3);
  }, 10000);

  it("Should throw error if directory does not have scsyndef files only", async () => {
    mkdirSync("/tmp/synthdefs_2");

    try {
      await loadSynthdef({ path: "/tmp/synthdefs_2" });
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow(
        "Invalid directory, ensure the directory only contains .scsyndef files."
      );
    }
  });

  it("Should be able to send binary synthdef to be loaded", async () => {
    await SendSCCommand(
      `SynthDef("test_binary",{|param=7| 0}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdef = readFileSync("/tmp/test_binary.scsyndef");

    await loadSynthdef({ data: synthdef });

    const synth = await new SCSynth({ synthdef: "test_binary" }).init();

    expect(await synth.get("param")).toBe(7);
  });

  it("Should be able to remove a synthdef", async () => {
    await SendSCCommand(
      `SynthDef("test_binary",{|param=7| 0}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdef = readFileSync("/tmp/test_binary.scsyndef");

    await loadSynthdef({ data: synthdef });

    await freeSynthdef("test_binary");

    try {
      const synth = await new SCSynth({ synthdef: "test_binary" }).init();
      const p = await synth.get("param");
    } catch (err) {
      expect(() => {
        throw err;
      }).toThrow();
    }
  });

  it("Should decode an empty synthdef ", async () => {
    await SendSCCommand(
      `SynthDef("empty", { }).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdefFile = readFileSync("/tmp/empty.scsyndef");

    const synthdefStruct = decodeSCSynthdefBuffer(synthdefFile);

    expect(synthdefStruct).toHaveLength(1);
    expect(synthdefStruct[0].name).toBe("empty");
    expect(synthdefStruct[0].constants).toEqual([]);
    expect(synthdefStruct[0].params).toEqual({});
    expect(synthdefStruct[0].ugens).toEqual([]);
  });

  it("Should decode multiple parameters", async () => {
    await SendSCCommand(
      `SynthDef("many_params", { |a=1, b=2, c=3, d=4, e=5, f=6, g=7, h=8, i=9, j=10|  Out.ar(0, SinOsc.ar(a + b + c + d + e + f + g + h + i + j))}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdefFile = readFileSync("/tmp/many_params.scsyndef");
    const synthdefStruct = decodeSCSynthdefBuffer(synthdefFile)[0];

    expect(Object.keys(synthdefStruct.params)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
    ]);

    expect(Object.values(synthdefStruct.params)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("Should decode nested", async () => {
    await SendSCCommand(
      `SynthDef("nested", {Out.ar(0, LPF.ar(SinOsc.ar(440), 1000))}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdefFile = readFileSync("/tmp/nested.scsyndef");
    const synthdefStruct = decodeSCSynthdefBuffer(synthdefFile)[0];

    expect(synthdefStruct.name).toBe("nested");
    expect(synthdefStruct.ugens.map((u) => u.name)).toEqual([
      "SinOsc",
      "LPF",
      "Out",
    ]);
  });

  it("Should decode multiple outputs", async () => {
    await SendSCCommand(
      `SynthDef("multi_output", {Out.ar(0, Pan2.ar(SinOsc.ar(440), 0))}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdefFile = readFileSync("/tmp/multi_output.scsyndef");
    const synthdefStruct = decodeSCSynthdefBuffer(synthdefFile)[0];

    expect(
      synthdefStruct.ugens[synthdefStruct.ugens.length - 1].inputs
    ).toHaveLength(3);

    expect([
      synthdefStruct.ugens[
        synthdefStruct.ugens[synthdefStruct.ugens.length - 1].inputs[1].index
      ].name,
      synthdefStruct.ugens[
        synthdefStruct.ugens[synthdefStruct.ugens.length - 1].inputs[2].index
      ].name,
    ]).toEqual(["Pan2", "Pan2"]);
  });

  it("Should decode control rate parameters", async () => {
    await SendSCCommand(
      `SynthDef("control_rate", {Out.kr(0, SinOsc.kr(1))}).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdefFile = readFileSync("/tmp/many_params.scsyndef");
    const synthdefStruct = decodeSCSynthdefBuffer(synthdefFile)[0];

    expect(synthdefStruct.ugens[1].rate).toBe("kr");
  });

  it("Should be able to decode a synthdef binary", async () => {
    await SendSCCommand(
      `SynthDef("test_decode",{|p=40,p2=0.5|	Out.ar(0,SinOsc.ar(p,p2)) }).writeDefFile("/tmp/");("SCServer"+[]+"SCServer").postln;`
    );

    const synthdefFile = readFileSync("/tmp/test_decode.scsyndef");

    const synthdefStruct = decodeSCSynthdefBuffer(synthdefFile)[0];
    expect(synthdefStruct.name).toBe("test_decode");

    expect(synthdefStruct.constants).toContain(0);

    expect(synthdefStruct.params.p).toBe(40);
    expect(synthdefStruct.params.p2).toBe(0.5);

    expect(synthdefStruct.ugens).toHaveLength(3); //Control Out and SinOsc
    expect(synthdefStruct.ugens[0].name).toBe("Control");
    expect(synthdefStruct.ugens[1].name).toBe("SinOsc");
    expect(synthdefStruct.ugens[2].name).toBe("Out");

    expect(
      synthdefStruct.constants[synthdefStruct.ugens[2].inputs[0].index]
    ).toEqual(0);
  });
});
