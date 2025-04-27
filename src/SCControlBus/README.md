# SCControlBus Class Documentation

## Overview

SuperCollider Control Bus helpers for querying and setting control bus values over OSC, bus can be used for synth parameter setting, allowing global numbers

## Constructor

```typescript
new SCControlBus(opts?: SCGroupOpts)
```

Creates a new SCControlBus instance.

### Parameters:

- `opts` (OptionaConfigurationl): options
  - `id`: ID to reference Control Bus

Examples:

```javascript
// New unattached group
const control = new SCControlBus({ id: 0 });
```

## get

```typescript
get(count?: number, opts?: OSCClientOpts): Promise<number[]>
```

Get sequential data from the specified index id.

## set

```typescript
set(data?: number[], opts?: OSCClientOpts): Promise<void>
```

Set sequential values from the specified index id.
