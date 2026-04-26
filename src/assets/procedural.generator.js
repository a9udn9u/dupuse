/**
 * ProceduralAssetGenerator — Generates all game sprites at runtime.
 *
 * Creates pixel-art-style textures on offscreen canvases and registers
 * them with Phaser's texture manager. Each generated asset uses the same
 * key as its real-asset counterpart, so game code never changes.
 */

import { ASSET_MANIFEST } from './asset.registry.js';

export class ProceduralAssetGenerator {
  /**
   * Generate all assets and register them with the Phaser scene.
   * @param {Phaser.Scene} scene
   */
  static generateAll(scene) {
    const tx = scene.textures;

    // Single-frame textures (use addCanvas - works fine for single frames)
    this._generateBullet(tx);
    this._generateEnemyBullet(tx);
    this._generateMissile(tx);
    this._generateFlame(tx);
    this._generateHeart(tx);
    this._generateHeartEmpty(tx);
    this._generateBgLayer1(tx);
    this._generateBgLayer2(tx);
    this._generateBgLayer3(tx);

    // Sprite sheet textures (use addCanvas + texture.add with correct signature)
    this._generatePlayer(tx);
    this._generateEnemySoldier(tx);
    this._generateEnemyTurret(tx);
    this._generateEnemyHelicopter(tx);
    this._generateBoss(tx);
    this._generatePowerUps(tx);
    this._generateTileset(tx);
    this._generateWeaponIcons(tx);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  static _createCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return { canvas, ctx: canvas.getContext('2d') };
  }

  static _drawPixel(ctx, x, y, color, size = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
  }

  static _drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  static _drawCircle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Register a sprite sheet texture with frame data.
   * Uses addCanvas (synchronous) then adds individual frames.
   * @param {Phaser.Textures.TextureManager} tx
   * @param {string} key
   * @param {HTMLCanvasElement} canvas
   * @param {number} frameW
   * @param {number} frameH
   * @param {number} totalFrames
   */
  static _registerSpriteSheet(tx, key, canvas, frameW, frameH, totalFrames) {
    // addCanvas creates the texture with a single 'default' frame
    tx.addCanvas(key, canvas);
    const texture = tx.get(key);
    if (!texture) return;
    // Remove the auto-generated 'default' frame
    try { texture.remove('default'); } catch (e) { /* ignore */ }
    // Add individual frames: texture.add(name, sourceIndex, x, y, width, height)
    // sourceIndex = 0 because addCanvas creates one TextureSource at index 0
    const cols = Math.floor(canvas.width / frameW);
    for (let i = 0; i < totalFrames; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      texture.add(i, 0, col * frameW, row * frameH, frameW, frameH);
    }
  }

  /**
   * Register a single-frame texture from canvas.
   */
  static _registerSingle(tx, key, canvas) {
    tx.addCanvas(key, canvas);
  }

  // ─── Player Sprite Sheet ─────────────────────────────────────────────
  // 32×48 frames, 4 directions (front/back/left/right), 13 anim frames each
  // Layout: rows by direction, 4 columns of frames
  static _generatePlayer(tx) {
    const fw = 32, fh = 48;
    const animFrames = 13; // idle0, idle1, run0-3, jump, crouch, climb0, climb1, shoot0, shoot1, death
    const directions = 4;
    const cols = animFrames;
    const rows = directions;

    const { canvas, ctx } = this._createCanvas(fw * cols, fh * rows);

    const colors = {
      skin: '#ffcc99',
      helmet: '#4466aa',
      body: '#3388ff',
      pants: '#445522',
      boots: '#553311',
      gun: '#888888',
      gunDark: '#555555',
    };

    for (let dir = 0; dir < directions; dir++) {
      for (let f = 0; f < animFrames; f++) {
        const ox = f * fw;
        const oy = dir * fh;

        ctx.save();
        ctx.translate(ox + fw / 2, oy + fh / 2);
        if (dir === 2) ctx.scale(-1, 1); // left = mirrored
        if (dir === 1) ctx.translate(0, 0); // back view
        ctx.translate(-fw / 2, -fh / 2);

        // Determine animation pose
        const isIdle = f < 2;
        const isRun = f >= 2 && f < 6;
        const isJump = f === 6;
        const isCrouch = f === 7;
        const isClimb = f >= 8 && f < 10;
        const isShoot = f >= 10 && f < 12;
        const isDeath = f === 12;

        let bodyY = 0, legOffset = 0, armAngle = 0;

        if (isIdle) {
          bodyY = (f % 2) * 1; // slight bob
        } else if (isRun) {
          legOffset = Math.sin(f * 1.5) * 4;
          bodyY = Math.abs(Math.sin(f * 1.5)) * -2;
        } else if (isJump) {
          bodyY = -4;
          legOffset = -3;
        } else if (isCrouch) {
          bodyY = 8;
        } else if (isClimb) {
          armAngle = Math.sin(f * 2) * 0.5;
        } else if (isShoot) {
          armAngle = -0.3;
        } else if (isDeath) {
          bodyY = -8;
        }

        // Helmet
        this._drawRect(ctx, 10, 4 + bodyY, 12, 8, colors.helmet);
        // Face
        this._drawRect(ctx, 11, 12 + bodyY, 10, 6, colors.skin);
        // Eyes
        this._drawPixel(ctx, 18, 14 + bodyY, '#000', 2);

        // Body
        this._drawRect(ctx, 8, 18 + bodyY, 16, 14, colors.body);
        // Belt
        this._drawRect(ctx, 8, 28 + bodyY, 16, 2, colors.gunDark);

        // Legs
        this._drawRect(ctx, 10, 32 + bodyY, 5, 10 + legOffset, colors.pants);
        this._drawRect(ctx, 17, 32 + bodyY, 5, 10 - legOffset, colors.pants);
        // Boots
        this._drawRect(ctx, 9, 40 + bodyY + legOffset, 7, 4, colors.boots);
        this._drawRect(ctx, 16, 40 + bodyY - legOffset, 7, 4, colors.boots);

        // Gun arm
        this._drawRect(ctx, 22, 20 + bodyY, 8, 4, colors.skin);
        // Gun
        this._drawRect(ctx, 26, 19 + bodyY, 6, 3, colors.gun);
        this._drawRect(ctx, 24, 20 + bodyY, 4, 5, colors.gunDark);

        ctx.restore();
      }
    }

    this._registerSpriteSheet(tx, 'player', canvas, fw, fh, animFrames * directions);
  }

  // ─── Enemy Soldier ───────────────────────────────────────────────────
  static _generateEnemySoldier(tx) {
    const fw = 32, fh = 48, frames = 8;
    const { canvas, ctx } = this._createCanvas(fw * frames, fh);

    const colors = { skin: '#ddbb88', helmet: '#667733', body: '#778833', pants: '#554422', boots: '#443311', gun: '#777777' };

    for (let f = 0; f < frames; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);

      const isDeath = f >= 5;
      const bodyY = isDeath ? -6 : (f < 2 ? (f % 2) : 0);
      const legOff = (f >= 2 && f < 4) ? Math.sin(f * 2) * 3 : 0;

      // Helmet
      this._drawRect(ctx, 10, 4 + bodyY, 12, 8, colors.helmet);
      // Face
      this._drawRect(ctx, 11, 12 + bodyY, 10, 6, colors.skin);
      this._drawPixel(ctx, 18, 14 + bodyY, '#000', 2);
      // Body
      this._drawRect(ctx, 8, 18 + bodyY, 16, 14, colors.body);
      this._drawRect(ctx, 8, 28 + bodyY, 16, 2, '#443311');
      // Legs
      this._drawRect(ctx, 10, 32 + bodyY, 5, 10 + legOff, colors.pants);
      this._drawRect(ctx, 17, 32 + bodyY, 5, 10 - legOff, colors.pants);
      this._drawRect(ctx, 9, 40 + bodyY + legOff, 7, 4, colors.boots);
      this._drawRect(ctx, 16, 40 + bodyY - legOff, 7, 4, colors.boots);
      // Gun
      this._drawRect(ctx, 22, 20 + bodyY, 8, 4, colors.skin);
      this._drawRect(ctx, 26, 19 + bodyY, 6, 3, colors.gun);

      if (isDeath) {
        // Red flash
        this._drawRect(ctx, 0, 0, fw, fh, 'rgba(255,0,0,0.4)');
      }

      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'enemy_soldier', canvas, fw, fh, frames);
  }

  // ─── Enemy Turret ────────────────────────────────────────────────────
  static _generateEnemyTurret(tx) {
    const fw = 48, fh = 48, frames = 4;
    const { canvas, ctx } = this._createCanvas(fw * frames, fh);

    for (let f = 0; f < frames; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);

      // Base
      this._drawRect(ctx, 8, 28, 32, 20, '#666666');
      this._drawRect(ctx, 4, 36, 40, 8, '#555555');
      // Dome
      this._drawCircle(ctx, 24, 24, 14, '#777777');
      // Barrel
      this._drawRect(ctx, 34, 20, 12, 6, '#888888');
      // Detail
      this._drawRect(ctx, 12, 32, 24, 2, '#888888');

      if (f === 2) {
        // Muzzle flash
        this._drawCircle(ctx, 48, 23, 6, '#ffff00');
        this._drawCircle(ctx, 48, 23, 3, '#ffffff');
      }
      if (f === 3) {
        this._drawRect(ctx, 0, 0, fw, fh, 'rgba(255,100,0,0.5)');
      }

      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'enemy_turret', canvas, fw, fh, frames);
  }

  // ─── Enemy Helicopter ────────────────────────────────────────────────
  static _generateEnemyHelicopter(tx) {
    const fw = 64, fh = 48, frames = 6;
    const { canvas, ctx } = this._createCanvas(fw * frames, fh);

    for (let f = 0; f < frames; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);

      const bobY = (f < 3) ? Math.sin(f * 2) * 2 : 0;

      // Body
      this._drawRect(ctx, 16, 16 + bobY, 32, 20, '#666688');
      // Cockpit
      this._drawRect(ctx, 40, 18 + bobY, 10, 10, '#88aacc');
      // Tail
      this._drawRect(ctx, 4, 20 + bobY, 14, 6, '#555577');
      // Tail rotor
      this._drawRect(ctx, 0, 16 + bobY, 6, 2, '#888888');
      // Main rotor
      this._drawRect(ctx, 8, 10 + bobY, 48, 3, '#888888');
      this._drawRect(ctx, 28, 8 + bobY, 8, 6, '#777799');
      // Skids
      this._drawRect(ctx, 20, 36 + bobY, 24, 3, '#555555');
      this._drawRect(ctx, 22, 36 + bobY, 2, 6, '#555555');
      this._drawRect(ctx, 38, 36 + bobY, 2, 6, '#555555');

      if (f === 3) {
        // Bomb drop
        this._drawRect(ctx, 28, 40 + bobY, 6, 6, '#444444');
      }
      if (f >= 4) {
        this._drawRect(ctx, 0, 0, fw, fh, 'rgba(255,100,0,0.5)');
      }

      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'enemy_helicopter', canvas, fw, fh, frames);
  }

  // ─── Boss ────────────────────────────────────────────────────────────
  static _generateBoss(tx) {
    const fw = 96, fh = 96, frames = 12;
    const { canvas, ctx } = this._createCanvas(fw * frames, fh);

    for (let f = 0; f < frames; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);

      const isDeath = f >= 9;
      const bodyY = isDeath ? -10 : (f < 3 ? Math.sin(f * 2) * 2 : 0);

      // Main body
      this._drawRect(ctx, 20, 20 + bodyY, 56, 50, '#884444');
      // Armor plates
      this._drawRect(ctx, 16, 16 + bodyY, 64, 10, '#995555');
      this._drawRect(ctx, 16, 60 + bodyY, 64, 10, '#995555');
      // Eyes
      this._drawRect(ctx, 32, 28 + bodyY, 10, 6, '#ff0000');
      this._drawRect(ctx, 54, 28 + bodyY, 10, 6, '#ff0000');
      // Cannon
      this._drawRect(ctx, 64, 36 + bodyY, 24, 10, '#777777');
      // Treads
      this._drawRect(ctx, 10, 68 + bodyY, 76, 16, '#555555');
      this._drawCircle(ctx, 24, 76 + bodyY, 8, '#444444');
      this._drawCircle(ctx, 72, 76 + bodyY, 8, '#444444');
      // Detail lines
      this._drawRect(ctx, 24, 40 + bodyY, 48, 2, '#663333');
      this._drawRect(ctx, 24, 50 + bodyY, 48, 2, '#663333');

      if (f === 5) {
        // Missile launch
        this._drawRect(ctx, 84, 34 + bodyY, 8, 14, '#ff8800');
      }
      if (f === 6 || f === 7) {
        // Ground slam
        this._drawRect(ctx, 0, 80 + bodyY, fw, 16, 'rgba(255,200,0,0.6)');
      }
      if (isDeath) {
        this._drawRect(ctx, 0, 0, fw, fh, 'rgba(255,100,0,0.6)');
      }

      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'boss', canvas, fw, fh, frames);
  }

  // ─── Power-ups ───────────────────────────────────────────────────────
  static _generatePowerUps(tx) {
    const fw = 32, fh = 32, frames = 8;
    const { canvas, ctx } = this._createCanvas(fw * frames, fh);

    const typeColors = ['#ffffff', '#ff8800', '#00ffff', '#ff4400', '#ff4444', '#44ff44', '#4444ff', '#ff44ff'];
    const typeLetters = ['N', 'S', 'L', 'F', '♥', '»', '◆', '★'];

    for (let f = 0; f < frames; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);

      // Box
      this._drawRect(ctx, 2, 2, 28, 28, typeColors[f]);
      this._drawRect(ctx, 4, 4, 24, 24, '#222222');
      this._drawRect(ctx, 6, 6, 20, 20, typeColors[f]);
      // Letter
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typeLetters[f], 16, 16);

      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'powerup', canvas, fw, fh, frames);
  }

  // ─── Tileset ─────────────────────────────────────────────────────────
  static _generateTileset(tx) {
    const fw = 32, fh = 32, frames = 16;
    const { canvas, ctx } = this._createCanvas(fw * 4, fh * 4); // 4×4 grid

    const tileDefs = [
      { idx: 0,  draw: () => { this._drawRect(ctx, 0, 0, 32, 32, '#8B7355'); this._drawRect(ctx, 0, 0, 32, 4, '#6B5335'); } }, // ground
      { idx: 1,  draw: () => { this._drawRect(ctx, 0, 0, 32, 32, '#8B7355'); this._drawRect(ctx, 0, 0, 32, 8, '#4a8c3f'); } }, // ground_top
      { idx: 2,  draw: () => { this._drawRect(ctx, 0, 0, 32, 8, '#777777'); this._drawRect(ctx, 0, 8, 32, 4, '#555555'); } }, // platform
      { idx: 3,  draw: () => { this._drawRect(ctx, 0, 0, 8, 8, '#777777'); this._drawRect(ctx, 0, 8, 8, 4, '#555555'); } }, // platform_left
      { idx: 4,  draw: () => { this._drawRect(ctx, 24, 0, 8, 8, '#777777'); this._drawRect(ctx, 24, 8, 8, 4, '#555555'); } }, // platform_right
      { idx: 5,  draw: () => { this._drawRect(ctx, 12, 0, 8, 32, '#886633'); this._drawRect(ctx, 8, 4, 4, 4, '#886633'); this._drawRect(ctx, 20, 4, 4, 4, '#886633'); this._drawRect(ctx, 8, 14, 4, 4, '#886633'); this._drawRect(ctx, 20, 14, 4, 4, '#886633'); this._drawRect(ctx, 8, 24, 4, 4, '#886633'); this._drawRect(ctx, 20, 24, 4, 4, '#886633'); } }, // ladder
      { idx: 6,  draw: () => { this._drawRect(ctx, 12, 0, 8, 16, '#886633'); this._drawRect(ctx, 8, 4, 4, 4, '#886633'); this._drawRect(ctx, 20, 4, 4, 4, '#886633'); this._drawRect(ctx, 10, 0, 12, 4, '#886633'); } }, // ladder_top
      { idx: 7,  draw: () => { this._drawRect(ctx, 0, 0, 32, 32, '#997755'); this._drawRect(ctx, 2, 2, 28, 28, '#886644'); this._drawRect(ctx, 4, 4, 24, 24, '#997755'); } }, // destructible
      { idx: 8,  draw: () => { this._drawRect(ctx, 0, 0, 32, 32, '#776655'); this._drawRect(ctx, 8, 8, 16, 16, '#554433'); this._drawRect(ctx, 4, 4, 2, 2, '#554433'); this._drawRect(ctx, 24, 20, 2, 2, '#554433'); } }, // destructible_damaged
      { idx: 9,  draw: () => { /* empty - destroyed */ } }, // destructible_gone
      { idx: 10, draw: () => { this._drawRect(ctx, 0, 0, 32, 32, '#666666'); this._drawRect(ctx, 2, 2, 28, 28, '#555555'); } }, // wall
      { idx: 11, draw: () => { this._drawRect(ctx, 0, 0, 32, 32, '#666666'); this._drawRect(ctx, 0, 0, 32, 6, '#4a8c3f'); } }, // wall_top
      { idx: 12, draw: () => { this._drawRect(ctx, 14, 4, 4, 28, '#aaaaaa'); this._drawRect(ctx, 12, 8, 8, 24, '#aaaaaa'); this._drawRect(ctx, 10, 12, 12, 20, '#aaaaaa'); this._drawRect(ctx, 8, 16, 16, 16, '#aaaaaa'); } }, // spike
      { idx: 13, draw: () => { this._drawRect(ctx, 20, 4, 4, 28, '#aaaaaa'); this._drawRect(ctx, 18, 8, 8, 24, '#aaaaaa'); this._drawRect(ctx, 16, 12, 12, 20, '#aaaaaa'); this._drawRect(ctx, 8, 16, 16, 16, '#aaaaaa'); } }, // spike_left
      { idx: 14, draw: () => { this._drawRect(ctx, 8, 4, 4, 28, '#aaaaaa'); this._drawRect(ctx, 6, 8, 8, 24, '#aaaaaa'); this._drawRect(ctx, 4, 12, 12, 20, '#aaaaaa'); this._drawRect(ctx, 8, 16, 16, 16, '#aaaaaa'); } }, // spike_right
      { idx: 15, draw: () => { /* empty */ } }, // empty
    ];

    for (const tile of tileDefs) {
      const col = tile.idx % 4;
      const row = Math.floor(tile.idx / 4);
      ctx.save();
      ctx.translate(col * fw, row * fh);
      tile.draw();
      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'tileset', canvas, fw, fh, frames);
  }

  // ─── Projectiles ─────────────────────────────────────────────────────
  static _generateBullet(tx) {
    const { canvas, ctx } = this._createCanvas(8, 8);
    this._drawCircle(ctx, 4, 4, 4, '#ffffff');
    this._drawCircle(ctx, 4, 4, 2, '#ffff00');
    this._registerSingle(tx, 'bullet', canvas);
  }

  static _generateEnemyBullet(tx) {
    const { canvas, ctx } = this._createCanvas(10, 10);
    this._drawCircle(ctx, 5, 5, 5, '#ff4444');
    this._drawCircle(ctx, 5, 5, 2, '#ff8888');
    this._registerSingle(tx, 'enemy_bullet', canvas);
  }

  static _generateMissile(tx) {
    const { canvas, ctx } = this._createCanvas(12, 16);
    this._drawRect(ctx, 4, 0, 4, 4, '#ff8800');
    this._drawRect(ctx, 2, 4, 8, 8, '#888888');
    this._drawRect(ctx, 3, 12, 2, 4, '#ff4400');
    this._drawRect(ctx, 7, 12, 2, 4, '#ff4400');
    this._registerSingle(tx, 'missile', canvas);
  }

  static _generateFlame(tx) {
    const { canvas, ctx } = this._createCanvas(16, 16);
    this._drawCircle(ctx, 8, 8, 8, '#ff4400');
    this._drawCircle(ctx, 8, 8, 5, '#ff8800');
    this._drawCircle(ctx, 8, 8, 3, '#ffcc00');
    this._registerSingle(tx, 'flame', canvas);
  }

  // ─── UI ──────────────────────────────────────────────────────────────
  static _generateHeart(tx) {
    const { canvas, ctx } = this._createCanvas(24, 24);
    ctx.fillStyle = '#ff3344';
    ctx.beginPath();
    ctx.moveTo(12, 20);
    ctx.bezierCurveTo(2, 12, 2, 4, 8, 4);
    ctx.bezierCurveTo(12, 2, 12, 8, 12, 8);
    ctx.bezierCurveTo(12, 8, 12, 2, 16, 4);
    ctx.bezierCurveTo(22, 4, 22, 12, 12, 20);
    ctx.fill();
    // Shine
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.arc(8, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    this._registerSingle(tx, 'heart', canvas);
  }

  static _generateHeartEmpty(tx) {
    const { canvas, ctx } = this._createCanvas(24, 24);
    ctx.strokeStyle = '#663344';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 20);
    ctx.bezierCurveTo(2, 12, 2, 4, 8, 4);
    ctx.bezierCurveTo(12, 2, 12, 8, 12, 8);
    ctx.bezierCurveTo(12, 8, 12, 2, 16, 4);
    ctx.bezierCurveTo(22, 4, 22, 12, 12, 20);
    ctx.stroke();
    this._registerSingle(tx, 'heart_empty', canvas);
  }

  static _generateWeaponIcons(tx) {
    const fw = 32, fh = 32, frames = 4;
    const { canvas, ctx } = this._createCanvas(fw * frames, fh);

    const labels = ['N', 'S', 'L', 'F'];
    const colors = ['#ffffff', '#ff8800', '#00ffff', '#ff4400'];

    for (let f = 0; f < frames; f++) {
      const ox = f * fw;
      ctx.save();
      ctx.translate(ox, 0);
      this._drawRect(ctx, 2, 2, 28, 28, colors[f]);
      this._drawRect(ctx, 4, 4, 24, 24, '#222222');
      ctx.fillStyle = colors[f];
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[f], 16, 16);
      ctx.restore();
    }

    this._registerSpriteSheet(tx, 'weapon_icon', canvas, fw, fh, frames);
  }

  // ─── Background tiles ────────────────────────────────────────────────
  static _generateBgLayer1(tx) {
    const { canvas, ctx } = this._createCanvas(32, 32);
    this._drawRect(ctx, 0, 0, 32, 32, '#1a1a2e');
    // Mountains silhouette
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(8, 12);
    ctx.lineTo(16, 20);
    ctx.lineTo(24, 8);
    ctx.lineTo(32, 24);
    ctx.lineTo(32, 32);
    ctx.fill();
    this._registerSingle(tx, 'bg_layer1', canvas);
  }

  static _generateBgLayer2(tx) {
    const { canvas, ctx } = this._createCanvas(32, 32);
    this._drawRect(ctx, 0, 0, 32, 32, '#16213e');
    // Trees silhouette
    ctx.fillStyle = '#0f3460';
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(4, 28);
    ctx.lineTo(28, 28);
    ctx.fill();
    this._drawRect(ctx, 14, 28, 4, 4, '#1a1a2e');
    this._registerSingle(tx, 'bg_layer2', canvas);
  }

  static _generateBgLayer3(tx) {
    const { canvas, ctx } = this._createCanvas(32, 32);
    this._drawRect(ctx, 0, 0, 32, 32, '#0f3460');
    // Grass/bushes
    ctx.fillStyle = '#1a4a2e';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(4 + i * 8, 24, 6, Math.PI, 0);
      ctx.fill();
    }
    this._registerSingle(tx, 'bg_layer3', canvas);
  }
}
