# SCBuffer Class Documentation

## Overview

The `SCBuffer` class represents a buffer space in a Supercollider server. Buffer are memory space for samples of recorded sounds, useful for remixing and sampling. This class provides methods to create, set and query buffer information in a Supercollider server.

## Constructor

```typescript
new SCBuffer(opts?: SCBufferOpts)
```

Creates a new SCBuffer instance.

### Parameters

- `opts` (OptionaConfigurationl): options
  - `id`: Existing buffer ID to reference
  - `path`: Existing path of audio files (files other than wav requires ffmpeg for transcoding)
  - `allocate`: Allocation options
    - `channels`: number of channels for allocation
    - `frames`: number of frames of the buffer

Examples:

```javascript
// Reference existing buffer
const buffer1 = new SCBuffer({ id: 0 });

// New buffer from sound path
const buffer2 = new SCBuffer({ path: "/tmp/sound.mp3" });

// New buffer with fixed sizing
const buffer3 = new SCGroup({ allocate: { channels: 2, frames: 44100 * 4 } });
```

## Properties

```typescript
id: number | null;
```

The server-assigned ID of this buffer. null if not yet initialized.

## Init

```typescript
init(opts?: OSCClientOpts & {data: number[]}): Promise<SCBuffer>
```

Initializes the buffer on the server, if allocate is specified a data array should be specified.

## getChannels

```typescript
getChannels(opts?: OSCClientOpts ): Promise<number>
```

Request buffer number of channels

## getFrames

```typescript
getFrames(opts?: OSCClientOpts ): Promise<number>
```

Request buffer number of frames

## getSampleRate

```typescript
getSampleRate(opts?: OSCClientOpts ): Promise<number>
```

Request buffer sample rate

## free

```typescript
free(opts?: OSCClientOpts ): Promise<SCBuffer>
```

Removes this buffer from the server.
