// types/osc.d.ts
declare module "osc" {
  import { Socket } from "dgram";

  export type OscType =
    | "i" // 32-bit integer
    | "f" // 32-bit float
    | "s" // string
    | "b" // blob
    | "h" // 64-bit big-endian integer
    | "t" // OSC timetag
    | "d" // 64-bit double-precision float
    | "S" // symbol
    | "c" // ASCII character
    | "r" // 32-bit RGBA color
    | "m" // MIDI message
    | "T" // TRUE
    | "F" // FALSE
    | "N" // NIL
    | "I" // Infinitum
    | "[" // array start
    | "]"; // array end

  export interface OscValue {
    type: OscType;
    value: any;
    // value: {
    //   i: number;
    //   f: number;
    //   s: string;
    //   b: any;
    //   h: number;
    //   t: any;
    //   d: number;
    //   S: string;
    //   c: string;
    //   r: any;
    //   m: any;
    //   T: true;
    //   F: false;
    //   N: any;
    //   I: any;
    //   "[": any;
    //   "]": any;
    // }[OscType];
  }

  export interface OscMessage {
    address: string;
    args?: Array<string | number | boolean | OscValue | Buffer>;
  }

  export interface OscBundle {
    timetag: number | { raw: number[] } | number[];
    packets: Array<OscMessage | OscBundle>;
  }

  export interface PortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    metadata?: boolean;
    broadcast?: boolean;
    multicast?: boolean;
    multicastTTL?: number;
    multicastInterface?: string;
    exclusive?: boolean;
    reuseAddr?: boolean;
  }

  export interface SendOptions {
    address?: string;
    port?: number;
  }

  export class UDPPort {
    constructor(options: PortOptions);

    socket: Socket;
    options: PortOptions;

    open(): void;
    close(): void;

    send(
      message: OscMessage | OscBundle,
      callback?: (error?: Error) => void
    ): void;
    send(
      message: OscMessage | OscBundle,
      options?: SendOptions,
      callback?: (error?: Error) => void
    ): void;

    on(event: "ready", callback: () => void): this;
    on(event: "message", callback: (message: OscMessage) => void): this;
    on(event: "bundle", callback: (bundle: OscBundle) => void): this;
    on(event: "error", callback: (error: Error) => void): this;
    on(event: "close", callback: () => void): this;
    on(event: "osc", callback: (message: OscMessage | OscBundle) => void): this;

    once(event: "ready", callback: () => void): this;
    once(event: "message", callback: (message: OscMessage) => void): this;
    once(event: "bundle", callback: (bundle: OscBundle) => void): this;
    once(event: "error", callback: (error: Error) => void): this;
    once(event: "close", callback: () => void): this;
    once(
      event: "osc",
      callback: (message: OscMessage | OscBundle) => void
    ): this;

    off(event?: string, callback?: (...args: any[]) => void): this;

    addListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;

    isClosed(): boolean;
    isOpen(): boolean;
  }

  // Main export
  const _default: {
    UDPPort: typeof UDPPort;
  };
  export default _default;

  const timeTag : (t: number) => number[];
  export timeTag typeof timeTag
}
