import { Out } from "../SCUgens/misc/out";
import { SCUgen } from "../SCUgens/SCUgen";
import { SCSynthdefGraph } from "../types/SCSynthdef";
import { SCUgenRate } from "../types/SCUgen";
import {
  SCUGenGraphInput,
  SCUGenGraphNode,
  SCUGenGraphOutput,
} from "../types/SCUgenGraph";

function normalizeToArrayBuffer(input: ArrayBuffer | Buffer): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input;
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    const uint8 = new Uint8Array(input);
    return uint8.buffer.slice(
      uint8.byteOffset,
      uint8.byteOffset + uint8.byteLength
    );
  }

  throw new TypeError("Unsupported buffer type");
}

class SCSynthdefDecodeError extends Error {
  constructor() {
    super("Error decoding synthdef format.");
  }
}
function decodeHeader(parser: BinaryReader) {
  const headerString = [
    parser.readInt8(),
    parser.readInt8(),
    parser.readInt8(),
    parser.readInt8(),
  ]
    .map((c) => String.fromCharCode(c))
    .join("");
  if (headerString != "SCgf") {
    throw new SCSynthdefDecodeError();
  }

  const version = parser.readInt32();
  const numSynthdefs = parser.readInt16();

  return {
    version,
    numSynthdefs,
  };
}

function decodeInput(parser: BinaryReader): SCUGenGraphInput {
  const ugenIndexOrConstant = parser.readInt32();
  const ugenOutputIndexOrConstantIndex = parser.readInt32();

  return ugenIndexOrConstant == -1
    ? { type: "const", index: ugenOutputIndexOrConstantIndex }
    : {
        type: "ugen",
        index: ugenIndexOrConstant,
        output: ugenOutputIndexOrConstantIndex,
      };
}

function decodeOutput(parser: BinaryReader): SCUGenGraphOutput {
  const rate = ["ir", "kr", "ar"][parser.readInt8()] as SCUgenRate;
  return {
    rate,
  };
}

function decodeUgen(parser: BinaryReader): SCUGenGraphNode {
  const name = parser.readPstring();
  const rate = ["ir", "kr", "ar"][parser.readInt8()] as SCUgenRate;

  const numInputs = parser.readInt32();
  const numOutputs = parser.readInt32();

  const specialIndex = parser.readInt16();

  const inputs = Array.from({ length: numInputs }).map(() =>
    decodeInput(parser)
  );
  const outputs = Array.from({ length: numOutputs }).map(() =>
    decodeOutput(parser)
  );

  const ugen = {
    name,
    rate,
    inputs,
    outputs,
    specialIndex,
  };

  return ugen;
}

function decodeSynthdefBody(parser: BinaryReader) {
  const name = parser.readPstring();

  const constants = Array.from({ length: parser.readInt32() }).map(() =>
    parser.readFloat32()
  );

  const initialParams = Array.from({ length: parser.readInt32() }).map(() =>
    parser.readFloat32()
  );

  const paramNamesIndexes: [string, number][] = Array.from({
    length: parser.readInt32(),
  }).map(() => [parser.readPstring(), parser.readInt32()]);

  const params = Object.fromEntries(
    paramNamesIndexes.map(([name, index]) => [name, initialParams[index]])
  );

  const ugens = Array.from({ length: parser.readInt32() }).map(() =>
    decodeUgen(parser)
  );

  const variants = decodeVariants(parser, Object.values(params).length);

  return {
    name,
    constants,
    params,
    ugens,
    variants,
  };
}

function decodeVariants(parser: BinaryReader, numParams: number) {
  const numVariants = parser.readInt16();

  const variants = Object.fromEntries(
    Array.from({ length: numVariants }).map(() => [
      parser.readPstring(),
      Array.from({ length: numParams }).map(() => parser.readFloat32()),
    ])
  );
  return variants;
}

function decodeSCSynthdefBuffer(
  buffer: ArrayBuffer | Buffer
): SCSynthdefGraph[] {
  const parser = new BinaryReader(normalizeToArrayBuffer(buffer));

  const { version, numSynthdefs } = decodeHeader(parser);

  return Array.from({ length: numSynthdefs }).map(() =>
    decodeSynthdefBody(parser)
  );
}

export class BinaryReader {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  readInt8(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readInt16(): number {
    const value = this.view.getInt16(this.offset, false); // big-endian
    this.offset += 2;
    return value;
  }

  readInt32(): number {
    const value = this.view.getInt32(this.offset, false); // big-endian
    this.offset += 4;
    return value;
  }

  readFloat32(): number {
    const value = this.view.getFloat32(this.offset, false); // big-endian
    this.offset += 4;
    return value;
  }

  readPstring(): string {
    const size = this.readInt8();
    const chars = Array.from({ length: size }, () =>
      String.fromCharCode(this.readInt8())
    ).join("");

    return chars;
  }

  skip(bytes: number): void {
    this.offset += bytes;
  }

  getPosition(): number {
    return this.offset;
  }

  setPosition(pos: number): void {
    this.offset = pos;
  }

  hasMore(): boolean {
    return this.offset < this.view.byteLength;
  }
}

function ensureOutUgen(root: SCUgen<any>): SCUgen<any> {
  const OUTPUT_UGENS = new Set(["Out", "ReplaceOut", "OffsetOut"]);

  if (OUTPUT_UGENS.has(root.name)) {
    // already wrapped, return as-is
    return root;
  }

  // Wrap it in an Out
  const out = Out({
    bus: 0,
    channels: root,
  });

  out.rate = "ar"; // usually audio-rate for final output

  return out;
}

export { decodeSCSynthdefBuffer, normalizeToArrayBuffer };
