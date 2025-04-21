# 🎛️ JS Supercollider

A JavaScript framework to interact with the [SuperCollider](https://supercollider.github.io/) audio synthesis server via OSC, inspired by live-coding environments like TidalCycles.

## 🎯 Project Goals

This project explores how JavaScript's modern syntax and runtime capabilities can be leveraged to:

- Interact with SuperCollider using OSC commands.
- Build a flexible and expressive sequencer engine in JS.
- Encode SynthDefs in binary format dynamically, allowing for runtime synthesis definition.

---

## 🛠️ Development Plan

This framework is being built in **three progressive stages**:

### ✅ Phase 1: OSC Server Communication Layer

- Implement core SuperCollider server commands via OSC.
- Send and receive messages such as `/status`, `/version`, `/s_new`, etc.
- Build a thin wrapper: `SCServer`, `SCGroup`, `SCSynth`, etc.

✅ Currently implemented:

- `/status`, `/version`, `/dumpOSC`, `/quit`

🧩 Next:

- Full support for node, group, buffer, and bus management.

### ⏳ Phase 2: Sequencer Engine

- Introduce time-based patterning with JavaScript’s event system and timers (`setInterval`, `requestAnimationFrame`).
- Support dynamic scheduling of synths and parameters.
- Integrate functional methods (`.map`, `.filter`, etc.) to process and transform patterns.

📌 Inspired by:

- TidalCycles’ declarative syntax
- Temporal recursion
- Data-driven scheduling

### 🧪 Phase 3: SynthDef Binary Encoding

- Support programmatic generation of SynthDefs from JavaScript.
- Compile synth definitions into SuperCollider's binary `.scsyndef` format.
- Enable loading custom synths dynamically during runtime.

---

## 💻 Server Commands Status

See full OSC command progress in [COMMANDS_PROGRESS.md](./COMMANDS_PROGRESS.md)

---

## 🧠 Tech Highlights

- **JSON & data structures**: Native support for representing synth states and OSC payloads.
- **Functional programming**: Easy transformation of patterns and sequences.
- **Events & Timers**: Create real-time musical structures.
- **Proxies & Symbols**: Dynamic and expressive control over synth behaviors.
- **Buffers & Buses**: Audio routing and sample playback made simple.

---

## 🔮 Future Ideas

- Custom domain-specific language (DSL) in JS for pattern generation.
- Integration with MIDI and Web APIs.
- Live-coding-ready REPL environment.

---

## 📂 Docs & Links

- [SuperCollider Server Commands](https://doc.sccode.org/Reference/Server-Command-Reference.html)
- [SynthDef Binary Format](https://doc.sccode.org/Reference/Synth-Definition-File-Format.html)
