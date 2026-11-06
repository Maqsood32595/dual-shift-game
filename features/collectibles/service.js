/**
 * Collectibles & Stage Portal Service
 * Shards are dimension-locked: collect Alpha shards while in Alpha, Omega shards while in Omega.
 */
export class CollectiblesService {
  constructor() {
    this.bus = null;
    this.currentRealm = 'ALPHA';

    this.shards = [
      { id: 1, x: 420, y: 350, realm: 'ALPHA', collected: false },
      { id: 2, x: 590, y: 320, realm: 'OMEGA', collected: false },
      { id: 3, x: 800, y: 300, realm: 'ALPHA', collected: false },
      { id: 4, x: 980, y: 260, realm: 'OMEGA', collected: false },
      { id: 5, x: 1350, y: 210, realm: 'OMEGA', collected: false },
      { id: 6, x: 1510, y: 210, realm: 'ALPHA', collected: false },
      { id: 7, x: 2230, y: 220, realm: 'ALPHA', collected: false },
      { id: 8, x: 2400, y: 180, realm: 'OMEGA', collected: false }
    ];

    this.portal = {
      x: 3000,
      y: 280,
      w: 48,
      h: 96,
      cleared: false
    };

    this.collectedCount = 0;
    this.totalCount = this.shards.length;
    this.floatTimer = 0;
    this.playerRect = null;
  }

  init(context) {
    this.bus = context.bus;

    this.bus.on('dimension:changed', ({ current }) => {
      this.currentRealm = current;
    });

    this.bus.on('player:position', (rect) => {
      this.playerRect = rect;
    });

    this.bus.on('player:died', () => {
      // Keep collected count or challenge player
    });

    this.bus.on('game:restart', () => {
      for (const shard of this.shards) {
        shard.collected = false;
      }
      this.collectedCount = 0;
      this.portal.cleared = false;
    });
  }

  update(dt) {
    this.floatTimer += dt * 3.5;

    // Check Player collisions via decoupled event state
    if (!this.playerRect) return;
    const pRect = this.playerRect;

    // 1. Shards Pickup
    for (const shard of this.shards) {
      if (!shard.collected && shard.realm === this.currentRealm) {
        const shardRect = { x: shard.x - 12, y: shard.y - 12, w: 24, h: 24 };
        if (this.checkOverlap(pRect, shardRect)) {
          shard.collected = true;
          this.collectedCount++;
          this.bus.emit('audio:play', 'shard');
          this.bus.emit('shard:collected', {
            collected: this.collectedCount,
            total: this.totalCount,
            realm: shard.realm
          });
          this.bus.emit('particles:burst', {
            x: shard.x,
            y: shard.y,
            color: shard.realm === 'ALPHA' ? '#f59e0b' : '#06b6d4',
            count: 20
          });
        }
      }
    }

    // 2. Portal Win Trigger
    if (!this.portal.cleared && this.collectedCount >= this.totalCount) {
      if (this.checkOverlap(pRect, this.portal)) {
        this.portal.cleared = true;
        this.bus.emit('audio:play', 'victory');
        this.bus.emit('stage:cleared', {
          time: performance.now()
        });
        this.bus.emit('camera:shake', 15);
      }
    }
  }

  checkOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  render(ctx, camera) {
    ctx.save();

    // 1. Render Floating Shards
    for (const shard of this.shards) {
      if (shard.collected) continue;
      if (shard.x < camera.x - 50 || shard.x > camera.x + camera.width + 50) continue;

      const isCurrentRealm = (shard.realm === this.currentRealm);
      const floatY = shard.y + Math.sin(this.floatTimer + shard.id) * 6;

      ctx.save();
      ctx.translate(shard.x, floatY);
      ctx.rotate(this.floatTimer * 0.8);

      if (isCurrentRealm) {
        ctx.shadowColor = shard.realm === 'ALPHA' ? '#f59e0b' : '#06b6d4';
        ctx.shadowBlur = 14;
        ctx.fillStyle = shard.realm === 'ALPHA' ? '#fbbf24' : '#22d3ee';
        ctx.fillRect(-8, -8, 16, 16);
      } else {
        ctx.strokeStyle = shard.realm === 'ALPHA' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -8, 16, 16);
      }
      ctx.restore();
    }

    // 2. Render Exit Gateway
    const isReady = (this.collectedCount >= this.totalCount);
    ctx.save();
    ctx.shadowBlur = isReady ? 25 : 8;
    ctx.shadowColor = isReady ? '#a855f7' : '#4b5563';

    // Gate Pillars
    ctx.fillStyle = isReady ? '#9333ea' : '#374151';
    ctx.fillRect(this.portal.x, this.portal.y, 10, this.portal.h);
    ctx.fillRect(this.portal.x + this.portal.w - 10, this.portal.y, 10, this.portal.h);
    ctx.fillRect(this.portal.x, this.portal.y, this.portal.w, 10);

    // Energy Vortex in Portal
    if (isReady) {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.7)';
      ctx.fillRect(this.portal.x + 10, this.portal.y + 10, this.portal.w - 20, this.portal.h - 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('ENTER', this.portal.x + 6, this.portal.y - 12);
    } else {
      ctx.fillStyle = 'rgba(75, 85, 99, 0.2)';
      ctx.fillRect(this.portal.x + 10, this.portal.y + 10, this.portal.w - 20, this.portal.h - 10);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px monospace';
      ctx.fillText(`LOCKED (${this.collectedCount}/${this.totalCount})`, this.portal.x - 18, this.portal.y - 10);
    }

    ctx.restore();
    ctx.restore();
  }
}

export default new CollectiblesService();

