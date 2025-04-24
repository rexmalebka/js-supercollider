# Supercollider Concepts

## SynthDefs (Synthesis Definitions)

Blueprints for sound synthesis that define a signal processing graph. They specify UGens (Unit Generators), their connections, and parameters. SynthDefs are compiled on the server before use.

## Synths

Running instances of a SynthDef that produce sound. You can create multiple Synths from one SynthDef, each with independent control (e.g., pitch, volume).

## Unit Generators (UGens)

The building blocks of SuperCollider's audio processing. They generate or modify signals (e.g., SinOsc for sine waves, EnvGen for envelopes). UGens are combined in a SynthDef to create complex sounds.

## Buses (Audio & Control Buses)

Virtual wires for routing signals:

- **Audio Buses** – Carry audio-rate signals (e.g., sending audio to effects).
- **Control Buses** – Carry control-rate signals (e.g., modulating parameters).

## Buffers

Memory blocks storing audio data (samples, wavetables) or control data. Used for:

- Playback (PlayBuf)
- Recording (RecordBuf)
- Granular synthesis (GrainBuf)

## Groups

In SuperCollider, Groups are containers that organize Synths (and other Groups) into hierarchical structures on the server. They allow for efficient control over the order of execution and group-level operations (e.g., pausing, freeing all Synths at once).

### Execution Order Control
- Synths in a head group run before those in a tail group.
- Useful for ensuring effects (reverb, delay) process signals in the correct order.

### Hierarchy & Nesting
- Groups can contain other Groups, forming a tree structure.

### Batch Operations
- Free all Synths in a Group with one command (group.free).
- Mute, pause, or set parameters for all members.

### Default Groups
- SuperCollider auto-creates a default group on startup.
- New Synths are added here unless specified otherwise.
