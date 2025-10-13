# SCServer Documentation

## Overview

This functions are helpful for interfacing with Supercollider server



Examples:

```javascript
const status = await SCserver.status() 
const numberUgens = status.ugen
```

## Status

```typescript
status()
```

retrieve server status

## Version

```typescript
version()
```

retrieve server version


## quit

```typescript
quit()
```

quits Supercollider server

## dumpOSC

```typescript
dumpOSC(1)
```

dumps OSC messages for debugging
