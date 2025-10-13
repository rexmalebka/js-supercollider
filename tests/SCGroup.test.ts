import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { queryTree, SCGroup } from "../src/SCGroups/SCGroups";
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

describe("SCGroup test", () => {
  it("Should retrieve group 0", async () => {
    const group0 = await queryTree(0);

    expect(group0 == null).toBeFalsy();
    expect(group0.nodes).toBeInstanceOf(Array);
  });

  it("should return null if group does not exists", async () => {
    const group0 = await queryTree(100);

    expect(group0).toBeNull();
  });

  it("Should be able to add a new group at head", async () => {
    const group0 = new SCGroup({ id: 0 });

    const newGroup = new SCGroup();
    await group0.add({ head: [newGroup] });

    const nodes = await group0.nodes();

    expect(nodes[0].id).toBe(newGroup.id);
  });

  it("Should be able to add a new group at tail", async () => {
    const group0 = new SCGroup({ id: 0 });

    const newGroup = new SCGroup();
    await group0.add({ tail: [newGroup] });

    const nodes = await group0.nodes();

    expect(nodes[nodes.length - 1].id).toBe(newGroup.id);
  });

  it("Should be able to add a new group before", async () => {
    const group0 = new SCGroup({ id: 0 });

    const newGroup = new SCGroup();

    await group0.add({ head: [newGroup] });

    const newGroup2 = new SCGroup();

    await newGroup.add({ before: [newGroup2] });

    const nodes = await group0.nodes();

    expect(nodes[0].id).toBe(newGroup2.id);
  });

  it("Should be able to add a new group after", async () => {
    const group0 = new SCGroup({ id: 0 });

    const newGroup = new SCGroup();

    await group0.add({ tail: [newGroup] });

    const newGroup2 = new SCGroup();

    await newGroup.add({ after: [newGroup2] });

    const nodes = await group0.nodes();

    expect(nodes[nodes.length - 1].id).toBe(newGroup2.id);
  });

  it("Should be able to add multiple", async () => {
    const group0 = new SCGroup({ id: 0 });

    const groups = [await new SCGroup().init(), await new SCGroup().init()];
    group0.addTail(groups);

    const nodes = await group0.nodes();

    expect(nodes[nodes.length - 2].id).toBe(groups[0].id);
    expect(nodes[nodes.length - 1].id).toBe(groups[1].id);
  });

  it("Should be able to add synths", async () => {
    const group0 = new SCGroup({ id: 0 });
    const group = new SCGroup();

    await SendSCCommand(
      `SynthDef("test",{0}).add;("SCServer"+[]+"SCServer").postln;\n`
    );

    const synth = new SCSynth({ synthdef: "test" });

    await group0.addTail([group]);
    await group.addTail([synth]);

    const nodes = await group.nodes();

    expect(nodes[0].id).toBe(synth.id);
    expect(nodes[0]).toBeInstanceOf(SCSynth);
  });

  it("Should free a group", async () => {
    const group0 = new SCGroup({ id: 0 });
    const group1 = await new SCGroup().init();
    const group2 = await new SCGroup().init();

    await group1.addTail([group2]);
    await group0.addHead([group0]);

    const group1Id = group1.id;

    await group1.free();

    const nodes = await group0.nodes();

    expect(nodes.some((node) => node.id == group1Id)).toBeFalsy();
    expect(nodes.some((node) => node.id == group2.id)).toBeFalsy();
  });

  it("Should remove all group nodes", async () => {
    const group0 = new SCGroup({ id: 0 });
    const group1 = await new SCGroup().init();
    const groups = [await new SCGroup().init(), await new SCGroup().init()];

    await group1.addHead(groups);

    await group0.addTail([group1]);

    await group1.freeAll();

    const nodes = await group1.nodes();

    const group0Nodes = await group0.nodes();

    expect(
      group0Nodes.some((node) => groups.map((n) => n.id).includes(node.id))
    ).toBeFalsy();
    expect(nodes.length).toBe(0);

    expect(group0Nodes[group0Nodes.length - 1].id).toBe(group1.id);
  });

  it("should set all synths of the group with same param value", async () => {
    const group0 = new SCGroup({ id: 0 });
    const group1 = await new SCGroup({ id: 1 }).init();

    await SendSCCommand(
      `SynthDef("test2",{|param=3| 0}).add;("SCServer"+[]+"SCServer").postln;\n`
    );

    const synths = [
      await new SCSynth({ synthdef: "test2" }).init(),
      await new SCSynth({ synthdef: "test2" }).init(),
    ];

    await group1.addTail(synths);

    const params = await Promise.all(synths.map((s) => s.get("param")));

    group1.set({ params: { param: 666 } });

    const params2 = await Promise.all(synths.map((s) => s.get("param")));

    expect(params2[0]).toBe(666);
    expect(params2[1]).toBe(666);
  });
});
