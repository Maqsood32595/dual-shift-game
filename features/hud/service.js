/**
 * Cyberpunk HUD Service
 * Screen-space UI rendering timer, dimension state, and mission objectives.
 */
export class HudService {
  constructor() {
    this.bus = null;
    this.currentRealm = 'ALPHA';
    this.shardsCollected = 0;
    this.shardsTotal = 8;
    this.elapsedTime = 0;
    this.stageCleared = false;
    this.clearTime = 0;
  }

  init(context) {
    this.bus = context.bus;

    this.bus.on('dimension:changed', ({ current }) => {
      this.currentRealm = current;
    });

    this.bus.on('shard:collected', ({ collected, total }) => {
      this.shardsCollected = collected;
      this.shardsTotal = total;
    });

    this.bus.on('stage:cleared', () => {
      this.stageCleared = true;
      this.clearTime = this.elapsedTime;
    });
  }

  update(dt) {
    if (!this.stageCleared) {
      this.elapsedTime += dt;
    }
  }

  render(ctx, camera) {
    ctx.save();
    // Render in screen space relative to camera offset
    ctx.translate(camera.x, camera.y);

    const isAlpha = (this.currentRealm === 'ALPHA');
    const accentColor = isAlpha ? '#f59e0b' : '#06b6d4';
    const tagBg = isAlpha ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.15)';

    // 1. Current Realm Card (Top-Left)
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(18, 18, 260, 68);
    ctx.strokeRect(18, 18, 260, 68);

    // Realm status pill
    ctx.fillStyle = tagBg;
    ctx.fillRect(26, 26, 130, 22);
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(isAlpha ? '● SOLAR ALPHA' : '● CYBER OMEGA', 34, 41);

    // Shift Key prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText('Press [SHIFT] or click to shift', 26, 72);

    // 2. Shards & Mission Objective (Top-Right)
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.fillRect(camera.width - 240, 18, 222, 68);
    ctx.strokeRect(camera.width - 240, 18, 222, 68);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(`SHARDS: ${this.shardsCollected} / ${this.shardsTotal}`, camera.width - 226, 40);

    // Shard Progress Bar
    const barWidth = 190;
    const progress = Math.min(1.0, this.shardsCollected / this.shardsTotal);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(camera.width - 226, 50, barWidth, 10);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(camera.width - 226, 50, barWidth * progress, 10);

    // 3. Bottom Controls Helper Banner
    ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
    ctx.fillRect(18, camera.height - 38, camera.width - 36, 26);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('CONTROLS: [A/D or Arrows] Move  |  [W/Space] Jump  |  [SHIFT or J] Shift Dimension', 30, camera.height - 21);

    // 4. Timer (Bottom Right)
    const mins = Math.floor(this.elapsedTime / 60);
    const secs = (this.elapsedTime % 60).toFixed(1);
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`TIME: ${timeFormatted}`, camera.width - 130, camera.height - 21);

    // 5. Stage Cleared Victory Banner
    if (this.stageCleared) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(0, 0, camera.width, camera.height);

      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DIMENSION SECURED!', camera.width / 2, camera.height / 2 - 25);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Final Time: ${timeFormatted} | All Shards Recovered`, camera.width / 2, camera.height / 2 + 15);
      ctx.fillText('Game Off 2026 Submission Prototype Ready!', camera.width / 2, camera.height / 2 + 45);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}

export default new HudService();

