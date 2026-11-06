/**
 * Dimension Shift Feature Service
 * Controls the active realm state and visual shift distortion
 */
export class DimensionShiftService {
  constructor() {
    this.bus = null;
    this.current = 'ALPHA'; // 'ALPHA' (Solar Amber) or 'OMEGA' (Cyber Void Cyan)
    this.shiftCooldown = 0.15; // Rapid responsive shifting
    this.timeSinceLastShift = 0.5;
    this.warpProgress = 0; // For visual distortion pulse
  }

  init(context) {
    this.bus = context.bus;

    // Listen for manual shift requests
    this.bus.on('player:request_shift', () => this.toggleShift());

    // Allow other systems to query active dimension
    this.bus.on('dimension:query', (cb) => {
      if (typeof cb === 'function') cb(this.current);
    });

    console.log('[DimensionShift] Ready. Active dimension:', this.current);
  }

  toggleShift() {
    if (this.timeSinceLastShift < this.shiftCooldown) return;

    const previous = this.current;
    this.current = this.current === 'ALPHA' ? 'OMEGA' : 'ALPHA';
    this.timeSinceLastShift = 0;
    this.warpProgress = 1.0;

    // Notify all features about the shift
    this.bus.emit('dimension:changed', {
      previous,
      current: this.current,
      color: this.current === 'ALPHA' ? '#f59e0b' : '#06b6d4'
    });

    // Trigger camera shake on shift
    this.bus.emit('camera:shake', 5);
  }

  update(dt, input) {
    this.timeSinceLastShift += dt;

    if (input.shiftPressed) {
      this.toggleShift();
    }

    if (this.warpProgress > 0) {
      this.warpProgress = Math.max(0, this.warpProgress - dt * 4.0);
    }
  }

  render(ctx, camera) {
    if (this.warpProgress <= 0) return;

    // Full-screen flash/ripple on shift
    ctx.save();
    ctx.fillStyle = this.current === 'ALPHA'
      ? `rgba(245, 158, 11, ${this.warpProgress * 0.25})`
      : `rgba(6, 182, 212, ${this.warpProgress * 0.25})`;

    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    ctx.restore();
  }
}

export default new DimensionShiftService();
