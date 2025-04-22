# 🧩 JS Supercollider – OSC Commands Progress Tracker

This file tracks implementation progress of OSC commands by difficulty and usage category.

---

## 🟢 Beginner – Core Commands

| Command    | Description        | Implemented? | Notes                                |
| ---------- | ------------------ | ------------ | ------------------------------------ |
| `/status`  | Server status      | ✅           | `SCServer.status()`                  |
| `/version` | Server version     | ✅           | `SCServer.version()`                 |
| `/quit`    | Quit server        | ✅           | `SCServer.quit()`                    |
| `/dumpOSC` | Dump OSC messages  | ✅           | `SCServer.dumpOSC()`                 |
| `/s_get`   | Get Synth          | ✅           | `new SCSynth({id:111}).set({amp:2})` |
| `/s_new`   | Create synth       | ⬜           |                                      |
| `/n_set`   | Set control values | ✅           | `new SCSynth({id:111}).set({amp:2})` |
| `/n_free`  | Free node          | ⬜           |                                      |
| `/n_run`   | Pause/resume node  | ⬜           |                                      |
| `/b_alloc` | Allocate buffer    | ⬜           |                                      |
| `/b_free`  | Free buffer        | ⬜           |                                      |
| `/b_zero`  | Zero buffer        | ⬜           |                                      |

---

## 🟡 Intermediate – Groups, Buffers, Queries

| Command             | Description              | Implemented? | Notes |
| ------------------- | ------------------------ | ------------ | ----- |
| `/g_new`            | Create group             | ⬜           |       |
| `/g_head`           | Add node to head         | ⬜           |       |
| `/g_tail`           | Add node to tail         | ⬜           |       |
| `/n_before`         | Move node before another | ⬜           |       |
| `/g_freeAll`        | Free all in group        | ⬜           |       |
| `/g_deepFree`       | Free group & subnodes    | ⬜           |       |
| `/b_read`           | Read file into buffer    | ⬜           |       |
| `/b_write`          | Write buffer to file     | ⬜           |       |
| `/b_set`, `/b_setn` | Set buffer samples       | ⬜           |       |
| `/b_get`, `/b_getn` | Get buffer samples       | ⬜           |       |
| `/g_dumpTree`       | Dump node tree           | ⬜           |       |
| `/g_queryTree`      | Query node tree          | ⬜           |       |
| `/n_trace`          | Trace node execution     | ⬜           |       |
| `/n_query`          | Query node               | ⬜           |       |

---

## 🔴 Advanced – Syncing, SynthDefs, Events

| Command       | Description             | Implemented? | Notes          |
| ------------- | ----------------------- | ------------ | -------------- |
| `/sync`       | Block until sync        | ⬜           |                |
| `/clearSched` | Clear server scheduler  | ⬜           |                |
| `/notify`     | Server notifications    | ⬜           |                |
| `/d_recv`     | Send SynthDef (binary)  | ⬜           |                |
| `/d_load`     | Load SynthDef from file | ⬜           |                |
| `/d_free`     | Free SynthDef           | ⬜           |                |
| `/done`       | Completion message      | ⬜           | Needs listener |
| `/fail`       | Failure message         | ⬜           | Needs listener |

---

## 🧊 Experimental & Rare

| Command                                 | Description          | Implemented? | Notes |
| --------------------------------------- | -------------------- | ------------ | ----- |
| `/n_info`                               | Node info            | ⬜           |       |
| `/u_cmd`                                | User-defined command | ⬜           |       |
| `/n_move`                               | Move node            | ⬜           |       |
| `/c_set`, `/c_get`                      | Control bus ops      | ⬜           |       |
| `/b_allocReadChannel`, `/b_readChannel` | Channel-specific ops | ⬜           |       |

---

✅ = Done  
⬜ = Not implemented

---
