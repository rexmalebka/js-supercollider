import OSCClient from "../oscClient";
import { OSCClientOpts } from "../types/OSCClient";

import {
  QuitResponse,
  StatusResponse,
  VersionResponse,
} from "../types/SCServer";

const status = async (opts?: OSCClientOpts): Promise<StatusResponse> => {
  const client = opts?.client ?? new OSCClient();

  try {
    const [
      _,
      ugens,
      synths,
      groups,
      synthdef,
      avgCPU,
      peakCPU,
      samplerate,
      actualSamplerate,
    ] = (
      await client.request(
        {
          address: "/status",
        },
        ["/status.reply"],
        opts?.timeout
      )
    ).args.map((arg) => arg["value"]);

    return {
      ugens,
      synths,
      groups,
      synthdef,
      avgCPU,
      peakCPU,
      samplerate,
      actualSamplerate,
    };
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

const version = async (opts?: OSCClientOpts): Promise<VersionResponse> => {
  const client = opts?.client ?? new OSCClient();

  try {
    const [program, major, minor, patch, gitBranch, hash] = (
      await client.request(
        {
          address: "/version",
        },
        ["/version.reply"],
        opts?.timeout
      )
    ).args.map((arg) => arg["value"]);

    return {
      program: program as "scsynth" | "supernova",
      major,
      minor,
      patch,
      gitBranch,
      hash,
    };
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

const quit = async (opts?: OSCClientOpts): Promise<QuitResponse> => {
  const client = opts?.client ?? new OSCClient();

  try {
    await client.request({ address: "/quit" }, ["/done"], opts?.timeout);

    return true;
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

const dumpOSC = async (level?: number, opts?: OSCClientOpts) => {
  const client = opts?.client ?? new OSCClient();

  try {
    await client.send({
      address: "/dumpOSC",
      args: [
        {
          type: "i",
          value: level ?? 0,
        },
      ],
    });
  } finally {
    if (!opts?.client) {
      client.client.close();
    }
  }
};

export default {
  status,
  version,
  quit,
  dumpOSC,
};
