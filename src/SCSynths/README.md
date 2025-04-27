# SCGroup Class Documentation

## Overview

The `SCSynth` class represents a SuperCollider synth node, allowing you to create, control, and manage audio synthesizers programmatically.

## Constructor

```typescript
new SCSynth(SCSynthOpts &
      SCPosition & {
        params?: { [name: string]: number | string } | number[];
      });
```

Creates a new SCSynth instance.

### Parameters:

- `opts` Options:
  - `synthdef`: Name of the synth definition (e.g., 'sine', 'saw')
  - `id`: Existing synth ID to control (optional)
  - `params`: Initial parameters (object or array)
  - Position options (choose one):
    - `head`, `tail`, `before`, `after`, `replace`: Positioning relative to other nodes

Examples:

```javascript
// Create a new synth with parameters
const synth = new SCSynth({
  synthdef: "fm",
  params: { freq: 440, modIndex: 5 },
});

// Reference existing synth
const existingSynth = new SCSynth({ id: 1003 });
```

## init

```typescript
init(opts?: OSCClientOpts & {
      params?: { [name: string]: number | string } | number[];
    } & SCPosition?): Promise<SCSynth>
```

Initializes the synth on the server.

```javascript
await synth.init({
  params: { freq: 660, amp: 0.3 },
  head: targetGroup, // Add to head of target group
});
```

## set

```typescript
set(params:  { [name: string]: number | string | SCControlBus } | (number | string | SCControlBus)[],
    opts?: OSCClientOpts?): Promise<SCSynth>
```

Updates synth parameters.

```javascript
// Set parameters by name
await synth.set({ freq: 880, amp: 0.2 });

// Set parameters by index
await synth.set([440, 0.5]); // For synths using positional args

// Set parameters from control bus
const bus = new SCControlBus({id: 0})
await bus.set(1.2)
await synth.set({amp: bus}); 
```

## get

```typescript
async get(property: number | string,
    opts?: OSCClientOpts): Promise<string | number>
```

Retrieves a parameter value.

```javascript
const freq = await synth.get("freq");
console.log(`Current frequency: ${freq}`);
```

## free

```typescript
async free()
```

Releases the synth from the server.

```javascript
await synth.free();
```
