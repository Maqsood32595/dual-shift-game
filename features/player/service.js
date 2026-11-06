/**
 * Player Service - Precision Platformer Kinematics
 * Completely isolated from specific dimension implementations.
 */
export class PlayerService {
  constructor() {
    this.bus = null;
    this.spawnPoint = { x: 100, y: 380 };

    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.w = 22;
    this.h = 32;

    this.vx = 0;
    this.vy = 0;

    // Kinematic Tuning Constants
    this.moveSpeed = 310;
    this.acceleration = 1800;
    this.friction = 1400;
    this.gravity = 1350;
    this.jumpForce = -520;
    this.maxFallSpeed = 750;

    // Feel Polish
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.coyoteDuration = 0.12;
    this.jumpBufferTimer = 0;
    this.jumpBufferDuration = 0.14;

    this.currentRealm = 'ALPHA';
    this.trail = [];
    this.trailTimer = 0;
  }

  init(context) {
    this.bus = context.bus;

    this.bus.on('dimension:changed', ({ current }) => {
      this.currentRealm = current;
      this.bus.emit('particles:burst', {
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        color: current === 'ALPHA' ? '#fbbf24' : '#22d3ee',
        count: 14
      });
      this.bus.emit('audio:play', 'shift');
    });

    console.log('[PlayerService] Initialized at spawn', this.spawnPoint);
  }

  respawn(reason = 'Out of bounds') {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;

    this.bus.emit('camera:shake', 10);
    this.bus.emit('audio:play', 'death');
    this.bus.emit('particles:burst', {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2,
      color: '#ef4444',
      count: 25
    });
    this.bus.emit('player:died', { reason });
  }

  update(dt, input) {
    // 1. Coyote & Buffer Timers
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteDuration;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = this.jumpBufferDuration;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // 2. Horizontal Acceleration / Deceleration
    let targetVx = 0;
    if (input.left) targetVx -= this.moveSpeed;
    if (input.right) targetVx += this.moveSpeed;

    if (targetVx !== 0) {
      const dir = Math.sign(targetVx);
      this.vx = Math.min(this.moveSpeed, Math.max(-this.moveSpeed, this.vx + dir * this.acceleration * dt));
    } else {
      // Apply friction
      if (Math.abs(this.vx) > 0) {
        const frictionAmt = this.friction * dt;
        if (Math.abs(this.vx) <= frictionAmt) {
          this.vx = 0;
        } else {
          this.vx -= Math.sign(this.vx) * frictionAmt;
        }
      }
    }

    // 3. Jump Execution
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.bus.emit('audio:play', 'jump');
      this.bus.emit('particles:burst', {
        x: this.x + this.w / 2,
        y: this.y + this.h,
        color: '#ffffff',
        count: 8
      });
    }

    // Variable jump cut when releasing button mid-ascent
    if (!input.jump && this.vy < 0) {
      this.vy *= 0.55;
    }

    // 4. Gravity
    this.vy = Math.min(this.maxFallSpeed, this.vy + this.gravity * dt);

    // 5. Query active solid obstacles from environment features
    const solids = [];
    this.bus.emit('physics:get_solids', solids);

    // 6. Integrate Movement & Collide with Solids
    this.moveAndCollide(dt, solids);

    // 7. Check Boost Jump Pads
    this.bus.emit('physics:check_jump_pads', {
      playerRect: { x: this.x, y: this.y, w: this.w, h: this.h },
      onBoost: (power) => {
        this.vy = power;
        this.isGrounded = false;
      }
    });

    // 8. Check Hazards
    this.bus.emit('physics:check_hazards', {
      playerRect: { x: this.x, y: this.y, w: this.w, h: this.h },
      onHit: (hazardName) => this.respawn(hazardName)
    });

    // 9. Fall into the Abyss check
    if (this.y > 700) {
      this.respawn('Fell into void');
    }

    // 10. Update Camera tracking & Trail
    this.bus.emit('camera:target', { x: this.x + this.w / 2, y: this.y + this.h / 2 });

    this.trailTimer += dt;
    if (this.trailTimer > 0.04) {
      this.trailTimer = 0;
      this.trail.push({ x: this.x, y: this.y, alpha: 0.6, realm: this.currentRealm });
      if (this.trail.length > 7) this.trail.shift();
    }
    for (const t of this.trail) {
      t.alpha -= dt * 1.8;
    }
  }

  moveAndCollide(dt, solids) {
    // Horizontal step
    this.x += this.vx * dt;
    for (const s of solids) {
      if (this.checkCollision(this, s)) {
        if (this.vx > 0) {
          this.x = s.x - this.w;
        } else if (this.vx < 0) {
          this.x = s.x + s.w;
        }
        this.vx = 0;
      }
    }

    // Vertical step
    this.y += this.vy * dt;
    this.isGrounded = false;

    for (const s of solids) {
      if (this.checkCollision(this, s)) {
        if (this.vy > 0) {
          this.y = s.y - this.h;
          this.vy = 0;
          this.isGrounded = true;
        } else if (this.vy < 0) {
          this.y = s.y + s.h;
          this.vy = 0;
        }
      }
    }
  }

  checkCollision(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  render(ctx, camera) {
    ctx.save();

    // 1. Render Ghost Trail
    for (const t of this.trail) {
      if (t.alpha <= 0) continue;
      ctx.fillStyle = t.realm === 'ALPHA'
        ? `rgba(245, 158, 11, ${t.alpha * 0.4})`
        : `rgba(6, 182, 212, ${t.alpha * 0.4})`;
      ctx.fillRect(t.x, t.y, this.w, this.h);
    }

    // 2. Render Player Character
    const color = this.currentRealm === 'ALPHA' ? '#f59e0b' : '#06b6d4';
    const highlight = this.currentRealm === 'ALPHA' ? '#fef08a' : '#a5f3fc';

    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // Inner Core / Visor
    ctx.fillStyle = highlight;
    ctx.fillRect(this.x + 4, this.y + 6, this.w - 8, 8);

    // Energy Belt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 2, this.y + 18, this.w - 4, 3);

    ctx.restore();
  }
}

export default new PlayerService();
