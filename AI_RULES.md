# AI Rules — Dual-Shift Platformer (Game Off 2026)

These rules define how AI coding agents (Antigravity, Cursor, Copilot, etc.) must work in this game codebase.

---

## The One Rule

Every new game mechanic, obstacle, enemy, or visual element is an isolated **Feature**. 
A Feature is a folder inside `features/` that contains a `feature.manifest.json` and a `service.js`.

---

## Feature Folder Structure

```
features/my-game-mechanic/
├── feature.manifest.json   ← REQUIRED. Contains priority, renderLayer, and meta.
└── service.js              ← Implements init(), update(dt, input), render(ctx, camera).
```

### Manifest Structure

```json
{
  "id": "my-game-mechanic",
  "name": "My Game Mechanic",
  "description": "What it does in the game",
  "version": "1.0.0",
  "enabled": true,
  "priority": 50,
  "renderLayer": 50,
  "service": "./service.js"
}
```

---

## Rules for AI Agents

1. **Never modify `core/kernel.js`** — It is the stable orchestrator. Do not touch it.
2. **Never modify `core/engine.js`** — The game loop and viewport manager are stable.
3. **One mechanic = one feature folder** — Never mix combat into inventory or player physics into environment.
4. **Communicate ONLY via EventBus** — Use `context.bus.emit(event, data)` and `context.bus.on(event, handler)`. Never import sibling feature services directly.
5. **Set `"enabled": false` to disable a feature**, never comment out large files.
6. **Keep rendering layered** — Set `renderLayer` in the manifest:
   - 10-25: Background & Level environment
   - 30-45: Collectibles & Items
   - 50: Player & Characters
   - 60: Particles & FX
   - 90-100: Screen Space HUD / Menus

