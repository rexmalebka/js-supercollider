import * as osc from "osc";

class OSCClient {
  public client: osc.UDPPort;

  constructor(opts?: {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
  }) {
    opts = opts ?? {};

    this.client = new osc.UDPPort({
      localAddress: opts.localAddress ?? "0.0.0.0",
      localPort: opts.localPort ?? 0,
      remoteAddress: opts.remoteAddress ?? "127.0.0.1",
      remotePort: opts.remotePort ?? 57110,
      metadata: true,
    });

    this.client.open();
  }

  waitReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = () => {
        this.client.off("ready", handler);
        resolve();
      };

      this.client.on("ready", handler);
      this.client.on("error", reject);
    });
  }

  async send(msg: osc.OscMessage): Promise<void> {
    await this.waitReady();
    return new Promise((resolve, reject) => {
      this.client.send(msg, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async request(
    msg: osc.OscMessage,
    expectedAddress: string[],
    timeout = 5000
  ): Promise<osc.OscMessage> {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const handler = (incoming: osc.OscMessage) => {
        if (expectedAddress.includes(incoming.address)) {
          clearTimeout(timeId);
          this.client.off("message", handler);
          resolve(incoming);
        }
      };

      const timeId = setTimeout(() => {
        this.client.off("message", handler);
        reject(new Error(`No response for "${expectedAddress}"`));
      }, timeout);

      this.client.on("message", handler);
      this.client.send(msg);
    });
  }
}

export default OSCClient;
