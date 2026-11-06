/**
 * Particle Effects Feature Service
 * Decoupled visual particle generator
 */
export class ParticleFxService {
  constructor() {
    this.bus = null;
    this.particles = [];
    this.ambientMotes = [];
    this.currentRealm = 'ALPHA';
  }

  init(context) {
    this.bus = context.bus;

    this.bus.on('dimension:changed', ({ current }) => {
      this.currentRealm = current;
    });

    this.bus.on('particles:burst', ({ x, y, color, count = 12 }) => {
      this.spawnBurst(x, y, color, count);
    });

    // Generate ambient background motes
    for (let i = 0; i < 45; i++) {
      this.ambientMotes.push({
        x: Math.random() * 3200,
        y: Math.random() * 600,
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 20,
        speedY: (Math.random() - 0.5) * 15
      });
    }
  }

  spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 220 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color,
        life: 1.0,
        decay: Math.random() * 1.5 + 1.2
      });
    }
  }

  update(dt) {
    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update ambient motes
    for (const m of this.ambientMotes) {
      m.x += m.speedX * dt;
      m.y += m.speedY * dt;
      if (m.y < 0) m.y = 600;
      if (m.y > 600) m.y = 0;
    }
  }

  render(ctx, camera) {
    ctx.save();

    // 1. Render Ambient Motes
    const moteColor = this.currentRealm === 'ALPHA'
      ? 'rgba(245, 158, 11, 0.25)'
      : 'rgba(6, 182, 212, 0.25)';

    ctx.fillStyle = moteColor;
    for (const m of this.ambientMotes) {
      if (m.x < camera.x - 20 || m.x > camera.x + camera.width + 20) continue;
      ctx.fillRect(m.x, m.y, m.size, m.size);
    }

    // 2. Render Particle Bursts
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    ctx.restore();
  }
}

export default new ParticleFxService();

