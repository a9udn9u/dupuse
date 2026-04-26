/**
 * Enemy — Base class for all enemies.
 *
 * AI states: patrol → detect → chase/shoot → dead
 */

import { CONFIG } from '../../config/game.config.js';
import { SoundManager } from '../../audio/sound.manager.js';
import { POWERUP_TYPES } from '../../assets/asset.registry.js';

export class Enemy {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config - Enemy config from CONFIG.enemies
   */
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.config = config;
    this.alive = true;
    this.hp = config.hp;
    this.maxHP = config.hp;
    this.score = config.score;

    // AI state
    this.state = 'patrol'; // patrol, detect, chase, shoot, dead
    this.patrolDir = Math.random() > 0.5 ? 1 : -1;
    this.patrolTimer = 0;
    this.shootTimer = 0;
    this.detectionRange = 400;

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey);
    this.sprite.enemyRef = this; // back-reference for collision callbacks
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setDepth(5);
    // Tighter hitbox
    this.sprite.body.setSize(20, 38);
    this.sprite.body.setOffset(6, 6);

    // Bullet group for this enemy
    this.bulletGroup = scene.physics.add.group();
  }

  get textureKey() { return 'enemy_base'; }

  update(time, delta) {
    if (!this.alive) return;

    // Find nearest player
    const nearest = this._findNearestPlayer();
    const dist = nearest ? this._distanceTo(nearest) : Infinity;

    // State machine
    switch (this.state) {
      case 'patrol':
        this._patrol(time, delta);
        if (nearest && dist < this.detectionRange) {
          this.state = 'detect';
        }
        break;

      case 'detect':
        if (!nearest || dist > this.detectionRange * 1.5) {
          this.state = 'patrol';
          break;
        }
        this._detect(nearest);
        if (dist < this.detectionRange * 0.6) {
          this.state = 'chase';
        }
        break;

      case 'chase':
        if (!nearest || dist > this.detectionRange * 1.5) {
          this.state = 'patrol';
          break;
        }
        this._chase(nearest, time, delta);
        this._shoot(nearest, time);
        break;
    }
  }

  _findNearestPlayer() {
    const players = this.scene.players;
    if (!players) return null;

    let nearest = null;
    let minDist = Infinity;
    for (const player of players) {
      if (!player.alive) continue;
      const dist = this._distanceTo(player.sprite);
      if (dist < minDist) {
        minDist = dist;
        nearest = player.sprite;
      }
    }
    return nearest;
  }

  _distanceTo(target) {
    return Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      target.x, target.y
    );
  }

  _patrol(_time, delta) {
    if (this.config.speed === 0) return; // Turrets don't patrol

    this.sprite.body.setVelocityX(this.patrolDir * this.config.speed);

    this.patrolTimer += delta;
    if (this.patrolTimer > 3000 + Math.random() * 2000) {
      this.patrolDir *= -1;
      this.patrolTimer = 0;
    }

    // Turn around at edges
    if (this.sprite.x <= 50 || this.sprite.x >= CONFIG.worldBounds.right - 50) {
      this.patrolDir *= -1;
    }
  }

  _detect(target) {
    // Face the player
    this.patrolDir = target.x > this.sprite.x ? 1 : -1;
    this.sprite.body.setVelocityX(0);
  }

  _chase(target, _time, delta) {
    if (this.config.speed === 0) return;

    const dir = target.x > this.sprite.x ? 1 : -1;
    this.sprite.body.setVelocityX(dir * this.config.speed);
    this.patrolDir = dir;
  }

  _shoot(target, time) {
    if (!target) return;

    this.shootTimer += 16; // approximate frame time
    if (this.shootTimer < this.config.shootInterval) return;
    this.shootTimer = 0;

    // Calculate direction to player
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    this.scene.weaponManager.fireEnemyBullet(
      this.sprite.x,
      this.sprite.y - 10,
      dirX, dirY,
      this.config.bulletSpeed,
      this.config.damage
    );
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.hp -= amount;
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.state = 'dead';
    this.sprite.body.setEnable(false);

    // Explosion
    this.scene._spawnExplosion(this.sprite.x, this.sprite.y);
    SoundManager.play('explosion');

    // Add score
    this.scene.score += this.score;

    // Drop power-up chance
    if (Math.random() < CONFIG.powerUpDropChance) {
      const types = [POWERUP_TYPES.SPREAD, POWERUP_TYPES.LASER, POWERUP_TYPES.FLAME];
      const type = types[Math.floor(Math.random() * types.length)];
      this.scene.enemySpawner.spawnPowerUp(this.sprite.x, this.sprite.y, type);
    }

    // Remove after delay
    this.scene.time.delayedCall(500, () => {
      this.sprite.destroy();
    });
  }

  destroy() {
    this.alive = false;
    this.sprite.destroy();
    this.bulletGroup.clear(true, true);
  }
}
