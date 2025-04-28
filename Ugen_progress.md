### **1. SOURCES (Oscillators, Noise, Generators)**
- **Oscillators**  
  `SinOsc`, `Saw`, `Pulse`, `VarSaw`, `LFSaw`, `LFTri`, `LFPar`, `LFCub`, `Osc`, `COsc`, `VOsc` (wavetable), `VOsc3`, `PMOsc`, `FSinOsc`, `Formant`, `SyncSaw`, `Blip`, `Klang` (additive), `Klank` (resonant bank).
- **Noise Generators**  
  `WhiteNoise`, `PinkNoise`, `BrownNoise`, `GrayNoise`, `ClipNoise`, `Dust`, `Dust2`, `Crackle`, `Logistic`, `LFNoise0/1/2`, `Hasher`.
- **Physical Modeling**  
  `Pluck` (plucked string), `Spring`, `Ball` (ball collisions), `TBall`.
- **Granular Synthesis**  
  `GrainBuf`, `GrainIn`, `Warp1`, `TGrains`.
- **Chaotic/Nonlinear**  
  `Latoocarfian`, `Henon`, `Lorenz`, `QuadN`, `StandardN`.
- **Playback**  
  `PlayBuf`, `RecordBuf`, `DiskIn`, `DiskOut`.

---

### **2. FILTERS (Spectral Processing)**
- **Basic Filters**  
  `LPF` (low-pass), `HPF` (high-pass), `BPF` (band-pass), `BRF` (band-reject), `RLPF` (resonant LPF), `RHPF` (resonant HPF).
- **Resonant/Modal**  
  `Resonz`, `Ringz`, `Formlet` (formant-like), `MoogFF`, `DFM1` (digital filter model).
- **Delay-Based Filters**  
  `CombN/C/L` (comb filter), `AllpassN/C/L` (allpass filter).
- **Nonlinear**  
  `Median`, `LeakDC` (DC blocker), `SOS` (second-order sections), `LPZ1`, `HPZ1` (one-pole).
- **Specialized**  
  `Decay`, `Decay2`, `Integrator`, `Lag`, `Ramp`.

---

### **3. EFFECTS (Audio Processing)**
- **Reverb/Delay**  
  `FreeVerb`, `GVerb`, `Comb`, `Allpass`, `BufComb`, `DelayN/C/L`, `PingPong`.
- **Distortion**  
  `CrossoverDistortion`, `Decimator` (bitcrush), `SoftClip`, `Clip`, `Fold`.
- **Modulation**  
  `Vibrato`, `PitchShift`, `FreakShift`, `Wah`, `Phaser`, `Chorus`, `Flanger`.
- **Spectral**  
  `FreqShift`, `RingMod`, `Convolution`, `Streson` (string resonator).
- **Other**  
  `Greyhole` (granular delay), `CompanderD`, `PitchCorrection`.

---

### **4. ENVELOPES & CONTROL SIGNALS**
- **Envelope Generators**  
  `EnvGen`, `IEnvGen` (interpolating), `Line`, `XLine`, `LFGauss`, `Perc` (percussive).
- **ADSR**  
  `ADSr`, `ADEnvelope`, `ASR`.
- **Triggers**  
  `Trig`, `TDelay`, `Trig1`, `SetResetFF`.

---

### **5. BUFFER & DELAY (Buffer Management)**
- **Buffer Access**  
  `BufRd`, `BufWr`, `PlayBuf`, `RecordBuf`.
- **Delay Lines**  
  `DelayN` (no interpolation), `DelayL` (linear), `DelayC` (cubic), `BufDelay`.

---

### **6. ANALYSIS (Signal Measurement)**
- **Spectral**  
  `FFT`, `IFFT`, `SpecCentroid`, `SpecFlatness`, `SpecPcile`, `MFCC` (mel coefficients).
- **Time-Domain**  
  `Amplitude`, `Loudness`, `Pitch`, `ZeroCrossing`, `Onsets`, `BeatTrack`, `KeyTrack`.
- **Miscellaneous**  
  `RunningSum`, `Peak`, `PeakFollower`, `Timer`.

---

### **7. DYNAMICS (Compression/Limiting)**
- **Processors**  
  `Compander`, `Compressor`, `Limiter`, `NoiseGate`, `Normalizer`, `Gate`, `Slew`.

---

### **8. PANNING & SPATIALIZATION**
- **Stereo/Mono**  
  `Pan2`, `Balance2`, `LinPan2`, `PanAz` (arbitrary channels), `BiPanB2` (ambisonics).
- **Multichannel**  
  `Rotate2`, `Splay`, `DecodeB2` (ambisonics decode), `Ambisonic2D`.

---

### **9. MISCELLANEOUS**
- **Math/Utility**  
  `MulAdd`, `CheckBadValues`, `Poll`, `ScopeOut`, `SendTrig`, `LocalIn`, `LocalOut`.
- **Triggers/Logic**  
  `Trig`, `TDelay`, `SetResetFF`, `Schmidt`, `ToggleFF`.
- **Hardware I/O**  
  `In`, `Out`, `InFeedback`, `SharedIn`.

---

### **10. PHYSICAL MODELING (Specialized)**
- **Waveguides**  
  `Pluck`, `Waveguide`, `Tube` (resonant tube).
- **Nonlinear**  
  `Ball`, `Spring`, `TBall`.

---

### **11. SYNTH DEF BUILDERS (Meta-UGens)**
- **Patterns**  
  `Pbind`, `Pmono` (event-based), `Pgrain` (granular).
- **Proxy Systems**  
  `Ndef`, `ProxySpace`, `Tdef`.

---

### **Notes**:
- Some UGens require plugins (e.g., `GVerb`, `DFM1`, `BeatTrack`). Install via **Quarks** (SC package manager).
- Explore the **Help files** (`Ctrl+D` on UGen names) for detailed usage.
- UGens like `Comb` or `Allpass` can act as both filters and delays depending on parameters.
