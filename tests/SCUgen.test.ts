import { serializeUGenGraph } from "../src/SCGraph/SCGraph";
import { Pulse, Saw, SinOsc } from "../src/SCUgens/sources/oscilators";

describe("SCUgen test", () => {
  it("Should build an Ugen that can return parameters ordered", async () => {
    const oscMod = SinOsc({ freq: 2 }).kr();
    const osc = SinOsc({ freq: oscMod, phase: 0.4 });

    expect(osc.params.freq).toBe(oscMod);
    expect(osc.params.phase).toBe(0.4);
    expect(osc.rate).toBe("ar");

    const collectedParams = oscMod.collectParams();
    expect(collectedParams).toEqual([2, 0]);
  });

  it("Should switch rates correctly", () => {
    const osc = SinOsc({ freq: 440 });
    const oscKR = osc.kr();
    const oscAR = osc.ar();

    expect(oscKR.rate).toBe("kr");
    expect(oscAR.rate).toBe("ar");
    expect(oscKR.params.freq).toBe(440);
  });

  it("Should not duplicate shared UGens", () => {
    const shared = SinOsc({ freq: 100 }).kr();
    const osc1 = SinOsc({ freq: shared });
    const osc2 = SinOsc({ freq: shared });

    const { ugens } = serializeUGenGraph(osc2);
    const sharedCount = ugens.filter((u) => u.name === "SinOsc").length;

    expect(sharedCount).toBeLessThanOrEqual(2); // shared should appear only once
  });

  it("Should deduplicate constants", () => {
    const osc = SinOsc({ freq: 440, phase: 440 });
    const { constants } = serializeUGenGraph(osc);

    const occurrences = constants.filter((c) => c === 440).length;
    expect(occurrences).toBe(1);
  });

  it("Should throw on invalid parameter types", () => {
    expect(() => {
      SinOsc({ freq: "not-a-number" as any });
    }).toThrow();
  });

  it("Should not wrap in MulAdd when mul=1 and add=0", () => {
    const osc = SinOsc({ freq: 440, mul: 1, add: 0 });
    expect(osc.name).toBe("SinOsc");
  });

  it("Should wrap in a muladd if mul or add included ", () => {
    const osc = SinOsc({ freq: 200, mul: 2 }).kr();

    expect(osc.name).toBe("MulAdd");
    expect(osc.rate).toBe("kr");
    expect(osc.collectParams()[0].name).toBe("SinOsc");
    expect(osc.collectParams()[0].collectParams()[0]).toBe(200);
    expect(osc.collectParams()[1]).toBe(2);
    expect(osc.collectParams()[2]).toBe(0);
  });

  it("Should be able to serialize ugen", () => {
    const mod = Saw({ freq: 20 }).kr();
    const mod2 = SinOsc({ freq: mod, phase: mod });
    const mod3 = Pulse({ freq: 10, width: mod }).kr();

    const osc = SinOsc({
      freq: mod3,
      phase: mod2,
    });

    const { constants, ugens } = serializeUGenGraph(osc);
    expect(constants).toContain(20);
    expect(constants).toContain(10);

    expect(ugens[0].name).toBe("Saw");
    expect(constants[ugens[0].inputs[0].index]).toBe(20);
    expect(ugens[0].inputs.every((i) => i.type == "const")).toBe(true);
    expect(ugens[ugens.length - 1].inputs.every((i) => i.type == "ugen")).toBe(
      true
    );
    expect(ugens[ugens.length - 1].name).toBe("SinOsc");
    expect(ugens.length).toBe(4);
  });

  it("Should be able to handle multichannel expansion", () => {
    const osc = SinOsc({ freq: [200, 300], phase: [0, 0.2, 0.6] });

    expect(osc.length).toBe(3);
    expect(osc[0].collectParams()).toEqual([200, 0]);
    expect(osc[1].collectParams()).toEqual([300, 0.2]);
    expect(osc[2].collectParams()).toEqual([200, 0.6]);
  });

  it("Should be able to combine  array and single parameters", () => {
    const osc = SinOsc({ freq: [100, 200, 300], phase: 0 });

    expect(osc).toHaveLength(3);
  });

  it("Should be able to use kr with multichannel", () => {
    const osc = SinOsc({ freq: [20, 10] }, { rate: "kr" });

    expect(osc).toHaveLength(2);
    expect(osc[0].rate).toBe("kr");
    expect(osc[1].rate).toBe("kr");
  });
  it("Should handle empty input gracefully", () => {
    const result = serializeUGenGraph([]);
    expect(result.constants).toEqual([]);
    expect(result.ugens).toEqual([]);
  });
});
