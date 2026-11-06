# DUAL-SHIFT 🌌

[![GitHub Game Off 2026](https://img.shields.io/badge/Game_Off_2026-Theme:_SHIFT-orange.svg)](https://itch.io/jam/game-off-2026)
[![Architecture: Fractal Kernel](https://img.shields.io/badge/Architecture-Fractal_Kernel-blue.svg)](https://github.com/Maqsood32595/fractal-kernel)

A high-speed dual-dimension precision platformer built for **GitHub Game Off 2026** (Theme: **SHIFT**), architected with the **Fractal Kernel** context-isolation pattern.

---

## The Concept

Press **`[SHIFT]`** to instantly toggle reality between two parallel realms:

- **Dimension Alpha (Solar Realm):** Solid golden physical platforms, dangerous solar laser hazards.
- **Dimension Omega (Cyber Void Realm):** Ethereal cyan hard-light bridges, anti-gravity vertical boost pads.

Momentum carries through the shift: jump off an Alpha platform into the void, tap **`[SHIFT]`** mid-air, catch an Omega boost pad, and collect phase-locked shards to unlock the exit gateway!

---

## Architecture: Why Fractal Kernel?

Game development codebases notoriously degrade into tangled "god objects" (where player movement, combat, UI, and audio mutate each other's state). 

**Dual-Shift** applies the **[Fractal Kernel](https://github.com/Maqsood32595/fractal-kernel)** pattern:
- Every mechanic is an isolated slice with a `feature.manifest.json`.
- Features communicate solely through an asynchronous `EventBus`.
- Features can be dynamically enabled/disabled in the manifest without breaking the build.
- AI coding agents can work on any individual mechanic inside a single bounded folder without prompt bloat or cross-system regressions.

### Folder Structure

```
Dual_Shift_Platformer/
├── core/
│   ├── kernel.js                 ← Manifest discovery & feature lifecycle
│   ├── eventBus.js               ← Decoupled Pub/Sub event system
│   └── engine.js                 ← 60 FPS loop, viewport scaling & camera lerp
├── features/
│   ├── dimension-shift/          ← The SHIFT toggle & warp distortion
│   ├── dimension-alpha/          ← Solar platforms and hazards
│   ├── dimension-omega/          ← Ethereal void platforms and launch pads
│   ├── player/                   ← Kinematic platformer physics & coyote time
│   ├── collectibles/             ← Dual-realm shards & exit gateway
│   ├── particle-fx/              ← Dynamic particle bursts & ambient motes
│   ├── audio-synth/              ← Zero-asset Web Audio procedural synth
│   └── hud/                      ← Cyberpunk screen-space UI & timer
├── index.html                    ← HTML5 game container
└── main.js                       ← Bootstrap loader
```

---

## Controls

| Key | Action |
| :--- | :--- |
| **`A` / `D` or `Arrow Keys`** | Run Left / Right |
| **`W` or `Space` or `Up`** | Jump (Variable height & Coyote time) |
| **`Shift` or `J` or `Mouse Click`** | **Shift Dimension (Alpha ⟷ Omega)** |

---

## Quick Start

Run locally with any static web server:

```bash
# Using Python
python -m http.server 3000

# Or using Node
npx serve . -l 3000
```

Open `http://localhost:3000` in any modern web browser.
