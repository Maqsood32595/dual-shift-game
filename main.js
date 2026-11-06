/**
 * Main Application Bootstrapper
 * Connects Fractal Kernel to the Engine and auto-registers feature slices
 */
import { GameKernel } from './core/kernel.js';
import { GameEngine } from './core/engine.js';

// Feature Services
import shiftService from './features/dimension-shift/service.js';
import alphaService from './features/dimension-alpha/service.js';
import omegaService from './features/dimension-omega/service.js';
import playerService from './features/player/service.js';
import collectiblesService from './features/collectibles/service.js';
import particleService from './features/particle-fx/service.js';
import audioService from './features/audio-synth/service.js';
import hudService from './features/hud/service.js';

async function loadManifest(path) {
  try {
    const res = await fetch(path);
    return await res.json();
  } catch (err) {
    console.error(`Failed to load manifest at ${path}:`, err);
    return null;
  }
}

async function bootstrap() {
  const kernel = new GameKernel();

  // Load manifests asynchronously
  const [
    shiftManifest,
    alphaManifest,
    omegaManifest,
    playerManifest,
    collectiblesManifest,
    particleManifest,
    audioManifest,
    hudManifest
  ] = await Promise.all([
    loadManifest('./features/dimension-shift/feature.manifest.json'),
    loadManifest('./features/dimension-alpha/feature.manifest.json'),
    loadManifest('./features/dimension-omega/feature.manifest.json'),
    loadManifest('./features/player/feature.manifest.json'),
    loadManifest('./features/collectibles/feature.manifest.json'),
    loadManifest('./features/particle-fx/feature.manifest.json'),
    loadManifest('./features/audio-synth/feature.manifest.json'),
    loadManifest('./features/hud/feature.manifest.json')
  ]);

  // Register each isolated slice with the Kernel
  if (shiftManifest) kernel.register(shiftManifest, shiftService);
  if (alphaManifest) kernel.register(alphaManifest, alphaService);
  if (omegaManifest) kernel.register(omegaManifest, omegaService);
  if (playerManifest) kernel.register(playerManifest, playerService);
  if (collectiblesManifest) kernel.register(collectiblesManifest, collectiblesService);
  if (particleManifest) kernel.register(particleManifest, particleService);
  if (audioManifest) kernel.register(audioManifest, audioService);
  if (hudManifest) kernel.register(hudManifest, hudService);

  const engine = new GameEngine('game-canvas', kernel);

  // Hook camera signals from features
  kernel.bus.on('camera:target', ({ x, y }) => {
    engine.camera.targetX = x;
    engine.camera.targetY = y;
  });

  kernel.bus.on('camera:shake', (intensity) => {
    engine.camera.shake = Math.max(engine.camera.shake, intensity);
  });

  await kernel.boot({ engine });
  engine.start();

  console.log('[Dual-Shift] Booted successfully with Fractal Kernel architecture!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
