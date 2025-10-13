import * as osc from "osc";

class OSCClient {
  public client: osc.UDPPort;
  private ready: Promise<boolean>;

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

    this.ready = new Promise((resolve, reject) => {
      this.client.on("ready", () => {
        setTimeout(() => {
          resolve(true);
        }, 10);
      });
      this.client.on("error", () => reject(false));
    });

    this.client.open();
  }

  async send(
    msg: osc.OscMessage | osc.OscBundle,
    timeout = 5000
  ): Promise<void> {
    if ((await this.ready) == false) return;

    return new Promise((resolve, reject) => {
      const timeId = setTimeout(() => {
        reject(new Error(`send timeout`));
      }, timeout);

      this.client.send(msg, (err) => {
        if (err) {
          clearInterval(timeId);
          reject(err);
        } else {
          clearInterval(timeId);
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
    if ((await this.ready) == false) return;

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
