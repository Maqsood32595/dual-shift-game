/**
 * Midpoint Holographic Checkpoint Service
 * Detects player reaching the midpoint and sets new respawn coordinates.
 */
export class CheckpointService {
  constructor() {
    this.bus = null;
    this.x = 1840;
    this.y = 360;
    this.w = 28;
    this.h = 60;
    this.isActivated = false;
    this.pulseTimer = 0;
  }

  init(context) {
    this.bus = context.bus;

    this.bus.on('player:position', (playerRect) => {
      if (this.isActivated || !playerRect) return;

      const cpRect = { x: this.x, y: this.y, w: this.w, h: this.h };
      if (this.checkOverlap(playerRect, cpRect)) {
        this.isActivated = true;

        // Broadcast checkpoint activation to update spawn point
        this.bus.emit('checkpoint:reached', { x: this.x + 5, y: this.y + 10 });
        this.bus.emit('audio:play', 'checkpoint');
        this.bus.emit('particles:burst', {
          x: this.x + this.w / 2,
          y: this.y + this.h / 2,
          color: '#10b981',
          count: 24
        });
      }
    });

    this.bus.on('game:restart', () => {
      this.isActivated = false;
    });
  }

  checkOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  update(dt) {
    this.pulseTimer += dt * 3;
  }

  render(ctx, camera) {
    if (this.x < camera.x - 50 || this.x > camera.x + camera.width + 50) return;

    ctx.save();
    const activeColor = this.isActivated ? '#10b981' : '#64748b';
    const glowColor = this.isActivated ? '#34d399' : '#475569';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.isActivated ? 16 : 4;

    // Terminal Base Pillar
    ctx.fillStyle = activeColor;
    ctx.fillRect(this.x + 10, this.y + 20, 8, 40);

    // Holographic Beacon Ring
    const floatY = this.y + Math.sin(this.pulseTimer) * 4;
    ctx.fillStyle = glowColor;
    ctx.fillRect(this.x + 4, floatY, 20, 14);

    // Indicator Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(this.isActivated ? 'CHECKPOINT' : 'DATA LINK', this.x - 14, this.y - 8);

    ctx.restore();
  }
}

export default new CheckpointService();

