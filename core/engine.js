/**
 * GameEngine - Handles Canvas setup, input tracking, camera lerping, and the 60FPS loop
 * DO NOT MODIFY THIS FILE.
 */
export class GameEngine {
  constructor(canvasId, kernel) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.kernel = kernel;

    this.width = 960;
    this.height = 540;

    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      width: this.width,
      height: this.height,
      shake: 0
    };

    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      shift: false,
      shiftPressed: false,
      keys: {}
    };

    this.lastTime = 0;
    this.running = false;

    this.setupDisplay();
    this.setupInput();
  }

  setupDisplay() {
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.parentElement.getBoundingClientRect();

      // Maintain 16:9 aspect ratio
      let w = rect.width;
      let h = (w * 9) / 16;
      if (h > rect.height) {
        h = rect.height;
        w = (h * 16) / 9;
      }

      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      this.ctx.scale(dpr, dpr);
      this.ctx.imageSmoothingEnabled = false;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (!this.input.jump) this.input.jumpPressed = true;
        this.input.jump = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') {
        if (!this.input.shift) this.input.shiftPressed = true;
        this.input.shift = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') this.input.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') this.input.shift = false;
    });

    // Touch / Click to shift for accessibility
    this.canvas.addEventListener('pointerdown', (e) => {
      this.input.shiftPressed = true;
    });
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    if (!this.running) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Clamp dt to prevent tunneling
    this.lastTime = currentTime;

    // 1. Update Camera
    this.updateCamera(dt);

    // 2. Kernel Update
    this.kernel.update(dt, this.input);

    // Clear single-frame triggers
    this.input.jumpPressed = false;
    this.input.shiftPressed = false;

    // 3. Clear Canvas
    this.ctx.save();
    this.ctx.fillStyle = '#0a0a14';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply Camera Shake & Translation
    let shakeX = 0;
    let shakeY = 0;
    if (this.camera.shake > 0) {
      shakeX = (Math.random() - 0.5) * this.camera.shake;
      shakeY = (Math.random() - 0.5) * this.camera.shake;
      this.camera.shake = Math.max(0, this.camera.shake - dt * 25);
    }

    this.ctx.translate(-Math.floor(this.camera.x + shakeX), -Math.floor(this.camera.y + shakeY));

    // 4. Kernel Render World Layers
    this.kernel.render(this.ctx, this.camera);

    this.ctx.restore();

    requestAnimationFrame((t) => this.loop(t));
  }

  updateCamera(dt) {
    const lerpSpeed = 5.0;
    this.camera.x += (this.camera.targetX - (this.width / 2) - this.camera.x) * lerpSpeed * dt;
    this.camera.y += (this.camera.targetY - (this.height / 1.8) - this.camera.y) * lerpSpeed * dt;
  }
}

