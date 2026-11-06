/**
 * GameKernel - The Central Manifest-Driven Orchestrator
 * DO NOT MODIFY THIS FILE.
 * Features are registered dynamically through manifests.
 */
import { globalBus } from './eventBus.js';

export class GameKernel {
  constructor() {
    this.features = new Map();
    this.manifests = new Map();
    this.bus = globalBus;
    this.isInitialized = false;
  }

  /**
   * Register a feature module with its manifest
   */
  register(manifest, service) {
    if (!manifest || !manifest.id) {
      throw new Error('[GameKernel] Invalid manifest: missing "id"');
    }

    if (manifest.enabled === false) {
      console.log(`[GameKernel] Skipping disabled feature: ${manifest.id}`);
      return;
    }

    this.manifests.set(manifest.id, manifest);
    this.features.set(manifest.id, service);
    console.log(`[GameKernel] Registered feature: [${manifest.id}] v${manifest.version || '1.0.0'} - ${manifest.name}`);
  }

  /**
   * Boot all registered features
   */
  async boot(engineContext) {
    console.log(`[GameKernel] Booting ${this.features.size} enabled features...`);

    const context = {
      ...engineContext,
      bus: this.bus,
      kernel: this
    };

    // Initialize all features in priority order
    const sortedFeatures = Array.from(this.manifests.entries())
      .sort((a, b) => (a[1].priority || 50) - (b[1].priority || 50));

    for (const [id, manifest] of sortedFeatures) {
      const service = this.features.get(id);
      if (service && typeof service.init === 'function') {
        try {
          await service.init(context);
          console.log(`[GameKernel] Initialized feature: ${id}`);
        } catch (err) {
          console.error(`[GameKernel] Failed to initialize feature "${id}":`, err);
        }
      }
    }

    this.isInitialized = true;
    this.bus.emit('kernel:ready', { features: Array.from(this.manifests.keys()) });
  }

  /**
   * Dispatch tick update to all features
   */
  update(dt, inputState) {
    if (!this.isInitialized) return;

    for (const [id, service] of this.features) {
      if (typeof service.update === 'function') {
        service.update(dt, inputState);
      }
    }
  }

  /**
   * Dispatch render calls in layer order
   */
  render(ctx, camera) {
    if (!this.isInitialized) return;

    // Render sorted by renderLayer (lower renders first / in background)
    const sorted = Array.from(this.manifests.entries())
      .sort((a, b) => (a[1].renderLayer || 10) - (b[1].renderLayer || 10));

    for (const [id] of sorted) {
      const service = this.features.get(id);
      if (service && typeof service.render === 'function') {
        service.render(ctx, camera);
      }
    }
  }

  /**
   * Query feature status
   */
  getFeature(id) {
    return this.features.get(id);
  }

  listFeatures() {
    return Array.from(this.manifests.values());
  }
}

