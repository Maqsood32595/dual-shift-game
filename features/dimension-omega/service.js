/**
 * Dimension Omega (Cyber Void Realm) Platforms and Jump Pads
 * Solid when dimension is OMEGA. Ghost / Non-solid when in ALPHA.
 */
export class DimensionOmegaService {
  constructor() {
    this.bus = null;
    this.isActive = false; // Initially ALPHA is active, so Omega starts ghosted

    this.platforms = [
      // Bridging gaps between Alpha platforms
      { x: 220, y: 410, w: 120, h: 22, type: 'ethereal' },
      { x: 540, y: 380, w: 160, h: 22, type: 'ethereal' },
      { x: 920, y: 320, w: 150, h: 22, type: 'ethereal' },
      { x: 1300, y: 280, w: 130, h: 22, type: 'ethereal' },
      { x: 1640, y: 340, w: 140, h: 22, type: 'ethereal' },

      // High cyber platforms
      { x: 2040, y: 360, w: 120, h: 22, type: 'ethereal' },
      { x: 2350, y: 240, w: 120, h: 22, type: 'ethereal' },
      { x: 2700, y: 280, w: 130, h: 22, type: 'ethereal' }
    ];

    // Omega Boost Jump Pads (High kinetic vertical launch!)
    this.jumpPads = [
      { x: 600, y: 372, w: 40, h: 8, power: -720 },
      { x: 1350, y: 272, w: 40, h: 8, power: -760 },
      { x: 2070, y: 352, w: 40, h: 8, power: -780 }
    ];
  }

  init(context) {
    this.bus = context.bus;

    this.bus.on('dimension:changed', ({ current }) => {
      this.isActive = (current === 'OMEGA');
    });

    // Provide solids for physics
    this.bus.on('physics:get_solids', (solidsArray) => {
      if (this.isActive && Array.isArray(solidsArray)) {
        for (const p of this.platforms) {
          solidsArray.push({ ...p, realm: 'OMEGA' });
        }
      }
    });

    // Check jump pad boost trigger
    this.bus.on('physics:check_jump_pads', ({ playerRect, onBoost }) => {
      if (!this.isActive) return;
      for (const pad of this.jumpPads) {
        if (this.checkOverlap(playerRect, pad)) {
          onBoost(pad.power);
          this.bus.emit('audio:play', 'boost');
          this.bus.emit('particles:burst', { x: pad.x + pad.w / 2, y: pad.y, color: '#06b6d4', count: 18 });
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

  update(dt) {}

  render(ctx, camera) {
    ctx.save();

    const isSolid = this.isActive;
    const alpha = isSolid ? 1.0 : 0.22;

    // 1. Render Ethereal Cyber Platforms
    for (const p of this.platforms) {
      if (p.x + p.w < camera.x || p.x > camera.x + camera.width) continue;

      if (isSolid) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#083344';
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Cyber Cyan Edge
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(p.x, p.y, p.w, 4);

        // Grid accents
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(p.x + 8, p.y + 8, p.w - 16, 2);
      } else {
        // Holographic Outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.setLineDash([]);
      }
    }

    // 2. Render Boost Launch Pads
    for (const pad of this.jumpPads) {
      if (pad.x + pad.w < camera.x || pad.x > camera.x + camera.width) continue;

      if (isSolid) {
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(pad.x, pad.y, pad.w, pad.h);

        // Animated neon chevron
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(pad.x + 10, pad.y + pad.h);
        ctx.lineTo(pad.x + pad.w / 2, pad.y);
        ctx.lineTo(pad.x + pad.w - 10, pad.y + pad.h);
        ctx.fill();
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
        ctx.strokeRect(pad.x, pad.y, pad.w, pad.h);
      }
    }

    ctx.restore();
  }
}

export default new DimensionOmegaService();
