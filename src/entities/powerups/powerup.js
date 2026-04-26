/**
 * PowerUp — Collectible weapon/life pickup.
 */

import { CONFIG } from '../../config/game.config.js';
import { SoundManager } from '../../audio/sound.manager.js';
import { POWERUP_TYPES } from '../../assets/asset.registry.js';

export class PowerUp {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} type - Power-up type from POWERUP_TYPES
   */
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.active = true;

    // Map type to frame index
    const frameMap = {
      [POWERUP_TYPES.NORMAL]: 0,
      [POWERUP_TYPES.SPREAD]: 1,
      [POWERUP_TYPES.LASER]: 2,
      [POWERUP_TYPES.FLAME]: 3,
      [POWERUP_TYPES.LIFE]: 4,
    };
    const frame = frameMap[type] || 0;

    this.sprite = scene.physics.add.sprite(x, y, 'powerup');
    this.sprite.powerUpRef = this; // back-reference for collision callbacks
    this.sprite.setFrame(frame);
    this.sprite.setDisplaySize(32, 32);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(8);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocity(0, 0);

    // Bobbing animation
    this.bobTimer = 0;
    this.startY = y;

    // Glow particles
    this._createGlow();
  }

  update(time, delta) {
    if (!this.active) return;

    // Bob up and down
    this.bobTimer += delta * 0.003;
    this.sprite.y = this.startY + Math.sin(this.bobTimer) * 5;

    // Rotate slightly
    this.sprite.rotation = Math.sin(this.bobTimer * 0.5) * 0.1;
  }

  collect(player) {
    if (!this.active) return;
    this.active = false;

    player.usePowerUp(this.type);
    SoundManager.play('powerUp');

    // Sparkle effect
    this._spawnCollectEffect();
  }

  _createGlow() {
    const particles = this.scene.add.particles(
      this.sprite.x, this.sprite.y, 'bullet', {
        speed: { min: 10, max: 40 },
        scale: { start: 0.2, end: 0 },
        lifespan: 600,
        frequency: 100,
        tint: [0x00ff00, 0x88ff00, 0xffff00],
        blending: Phaser.BlendModes.ADD,
      }
    );
    // Follow the sprite
    particles.startFollow(this.sprite);
  }

  _spawnCollectEffect() {
    const particles = this.scene.add.particles(
      this.sprite.x, this.sprite.y, 'bullet', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 10,
        tint: [0x00ff00, 0xffff00],
        blending: Phaser.BlendModes.ADD,
      }
    );
    this.scene.time.delayedCall(400, () => particles.destroy());
  }

  destroy() {
    this.active = false;
    this.sprite.destroy();
  }
}
