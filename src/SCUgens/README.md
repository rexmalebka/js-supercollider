# SCUgen Class Documentation

## Overview

The `SCUgen` class represents a unit generator (UGen) in a SuperCollider-inspired synthesis graph. UGens are the building blocks of audio synthesis, representing oscillators, filters, envelopes, and more. This class provides a flexible and type-safe way to define UGens, manage their parameters, and serialize them into a graph structure.

UGens can be created using factory functions (e.g., SinOsc, Saw) and support multichannel expansion, rate switching (ar, kr, ir), and optional mul/add wrapping.

## Constructor

```typeScript
new SCUgen(name, params, paramOrderFn, rate?)
```

Creates a new UGen instance.

### Parameters

- `name`: The name of the UGen (e.g., "SinOsc", "Saw").
- `params`: An object containing UGen parameters (e.g., freq, phase, mul, add).
- `paramOrderFn`: A function that returns an ordered array of parameters for graph serialization.
- `rate` (optional): The calculation rate ("ar", "kr", or "ir"). Defaults to "ar".

## Rate Switching

```typeScript
ugen.kr(): SCUgen
ugen.ar(): SCUgen
ugen.ir(): SCUgen
```

Returns a new UGen instance with the specified calculation rate.

## collectParams

```typescript
collectParams(): SCUgenParam[]
```

Returns the ordered list of parameters for this UGen, used during graph traversal and serialization.

## generateSCUgenBuilder

```typescript
generateSCUgenBuilder(name, defaultParams, paramOrderFn);
```

Creates a UGen factory function with support for:

- Default parameters
- Multichannel expansion
- Optional mul and add wrapping via `MulAdd`

Example Usage:

```typescript
const SinOsc = generateSCUgenBuilder(
  "SinOsc",
  { freq: 440, phase: 0 },
  (params) => [params.freq, params.phase]
);

const osc = SinOsc({ freq: [440, 220], phase: 0 }, { rate: "kr" });
```

## expandParams

```typescript
expandParams(params): ParamSet[]
```

Expands multichannel parameters by broadcasting shorter arrays. Returns an array of parameter sets for each channel.

## SCUgenInvalidParam

```typescript
new SCUgenInvalidParam(value);
```

Thrown when a parameter is invalid (not a number, UGen, or valid object reference).

## Types

### SCUgenParam

```typescript
type SCUgenParam = number | SCUgen<any> | SCUgenParam[];
```

Represents a valid UGen parameter. Can be a number, another UGen, or an array of parameters for multichannel expansion.

### SCUgenRate

```typescript
type SCUgenRate = "ar" | "kr" | "ir";
```

Represents the calculation rate of a UGen.

### ParamOrderFn

```typescript
type ParamOrderFn<T> = (params: T) => SCUgenParam[];
```

Function that returns an ordered list of parameters for a UGen.

### Example

```typescript
const SinOsc = generateSCUgenBuilder(
  "SinOsc",
  { freq: 440, phase: 0 },
  (params) => [params.freq, params.phase]
);

// Single UGen
const osc = SinOsc({ freq: 220 }).kr();

// Multichannel expansion
const multiOsc = SinOsc({ freq: [220, 330], phase: [0, 0.5] });
```

## Notes


- UGens are immutable — rate switching returns a new instance.
- Multichannel expansion uses cyclic broadcasting for mismatched array lengths.
- mul and add parameters automatically wrap the UGen in a MulAdd if needed.
