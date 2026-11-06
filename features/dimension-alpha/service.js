/**
 * Dimension Alpha (Solar Realm) Platforms and Obstacles
 * Solid when dimension is ALPHA. Ghost / Non-solid when in OMEGA.
 */
export class DimensionAlphaService {
  constructor() {
    this.bus = null;
    this.isActive = true; // Active when realm is ALPHA
    this.platforms = [
      // Starting Area
      { x: 50, y: 450, w: 260, h: 40, type: 'ground' },
      { x: 370, y: 400, w: 140, h: 25, type: 'platform' },
      
      // Mid Section (Puzzles where you must alternate)
      { x: 740, y: 350, w: 160, h: 25, type: 'platform' },
      { x: 1100, y: 300, w: 180, h: 25, type: 'platform' },
      { x: 1460, y: 260, w: 140, h: 25, type: 'platform' },

      // High Vertical climb section
      { x: 1820, y: 420, w: 200, h: 30, type: 'platform' },
      { x: 2180, y: 280, w: 140, h: 25, type: 'platform' },
      { x: 2500, y: 200, w: 160, h: 25, type: 'platform' },

      // End Goal Platform
      { x: 2850, y: 380, w: 320, h: 40, type: 'finish_zone' }
    ];

    // Hazards (Lasers/Spikes) active only in Alpha
    this.hazards = [
      { x: 550, y: 480, w: 150, h: 20 },
      { x: 940, y: 480, w: 120, h: 20 },
      { x: 1300, y: 480, w: 120, h: 20 }
    ];
  }

  init(context) {
    this.bus = context.bus;

    // Listen to realm changes
    this.bus.on('dimension:changed', ({ current }) => {
      this.isActive = (current === 'ALPHA');
    });

    // Share solid collision bounding boxes with the player physics system
    this.bus.on('physics:get_solids', (solidsArray) => {
      if (this.isActive && Array.isArray(solidsArray)) {
        for (const p of this.platforms) {
          solidsArray.push({ ...p, realm: 'ALPHA' });
        }
      }
    });

    // Check hazard collision
    this.bus.on('physics:check_hazards', ({ playerRect, onHit }) => {
      if (!this.isActive) return;
      for (const h of this.hazards) {
        if (this.checkOverlap(playerRect, h)) {
          onHit('Alpha Solar Spike');
          return;
        }
      }
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
    // Animated hazard pulsing
  }

  render(ctx, camera) {
    ctx.save();

    const isSolid = this.isActive;
    const alpha = isSolid ? 1.0 : 0.22;

    // 1. Render Platforms
    for (const p of this.platforms) {
      if (p.x + p.w < camera.x || p.x > camera.x + camera.width) continue;

      if (isSolid) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Neon Top Edge
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else {
        // Holographic Ghost Outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.setLineDash([]);
      }
    }

    // 2. Render Hazards
    for (const h of this.hazards) {
      if (isSolid) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(h.x, h.y, h.w, h.h);

        // Warning lines
        ctx.fillStyle = '#fee2e2';
        for (let x = h.x; x < h.x + h.w; x += 15) {
          ctx.beginPath();
          ctx.moveTo(x, h.y + h.h);
          ctx.lineTo(x + 7.5, h.y);
          ctx.lineTo(x + 15, h.y + h.h);
          ctx.fill();
        }
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.strokeRect(h.x, h.y, h.w, h.h);
      }
    }

    ctx.restore();
  }
}

export default new DimensionAlphaService();

