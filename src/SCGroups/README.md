# SCGroup Class Documentation

## Overview

The `SCGroup` class represents a group node in a SuperCollider server. Groups are fundamental for organizing synth nodes hierarchically and controlling their execution order. This class provides methods to create, manage, and query group structures in a SuperCollider server.

## Constructor

```typescript
new SCGroup(opts?: SCGroupOpts)
```

Creates a new SCGroup instance.

### Parameters:

- `opts` (OptionaConfigurationl):  options

  - `id`: Existing group ID to reference
  - Positional options (one of the following):
    - `head`: Target group/synth to add at head
    - `tail`: Target group/synth to add at tail
    - `before`: Target group/synth to add before
    - `after`: Target group/synth to add after
    - `replace`: Target group/synth to replace

Examples:

```javascript
// New unattached group
const group1 = new SCGroup();

// Reference existing group
const group2 = new SCGroup({ id: 100 });

// New group positioned relative to another
const group3 = new SCGroup({ head: existingGroup });
```

## Properties

```typescript
id: number | null;
```

The server-assigned ID of this group. null if not yet initialized.

## init

```typescript
init(opts?: OSCClientOpts & SCPosition): Promise<SCGroup>
```

Initializes the group on the server.

### Parameters:

- `opts` (optional):
  - `client`: Custom OSC client
  - Position options (choose one):
    - `head`: Add at head of target
    - `tail`: Add at tail of target
    - `before`: Add before target
    - `after`: Add after target
    - `replace`: Replace target

**Returns**: Promise resolving to the initialized group

Example

```javascript
const group = await new SCGroup().init({ after: targetGroup });
```

## free

```typescript
free(opts?: OSCClientOpts): Promise<void>
```

Removes this group from the server.

### Parameters:

- `opts` (optional):
  - `client`: Custom OSC client

Example:

````javascript
await group.free();```
````

## freeAll

```typescript
freeAll(opts?: OSCClientOpts): Promise<void>
```

### Parameters:

- `opts` (optional):
  - `client`: Custom OSC client

Example:

````javascript
await group.freeAll();```
````

## add

```typescript
add(opts: OSCClientOpts & SCPosition): Promise<SCGroup>
```

Adds nodes to this group.

### Parameters:

- `opts` (optional):
  - `client`: Custom OSC client
  - Position options (choose one):
    - `head`: Nodes to add at head
    - `tail`: Nodes to add at tail
    - `before`: Nodes to add before
    - `after`: Nodes to add after

**Return**s: Promise resolving to this group

Example:

```javascript
await group.add({
  head: [synth1, group2, 123], // Mix of instances and raw IDs
});
```

### Convenience Methods

```typescript
addHead(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts)
```

Adds nodes at head position.

```typescript
addTail(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts)
```

Adds nodes at tail position.

```typescript
addBefore(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts)
```

Adds nodes before this group.

```typescript
addAfter(nodes: (SCSynth | SCGroup | number)[], opts?: OSCClientOpts)
```

Adds nodes after this group.

Example:

```javascript
await group.addHead([new SCSynth(), existingGroup]);
```

## nodes

```typescript
nodes(opts?: OSCClientOpts): Promise<(SCGroup | SCSynth)[]>
```

Gets all child nodes.

### Parameters:

- `opts` (optional):
  - `client`: Custom OSC client

**Returns**: Promise resolving to array of child nodes

Example:

```javascript
const children = await group.nodes();
```
