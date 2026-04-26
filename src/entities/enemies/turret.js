/**
 * Turret — Stationary enemy that tracks and fires at players.
 */

import { Enemy } from './enemy.js';
import { CONFIG } from '../../config/game.config.js';

export class Turret extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.enemies.turret);
    this.sprite.setTexture('enemy_turret');
    this.sprite.setDisplaySize(48, 48);
    this.sprite.body.setSize(30, 36);
    this.sprite.body.setOffset(9, 8);
    this.detectionRange = 500;
    this.shootInterval = CONFIG.enemies.turret.shootInterval;
  }

  get textureKey() { return 'enemy_turret'; }

  update(time, delta) {
    if (!this.alive) return;

    const nearest = this._findNearestPlayer();
    const dist = nearest ? this._distanceTo(nearest) : Infinity;

    // Turrets don't move
    this.sprite.body.setVelocityX(0);
    this.sprite.body.setVelocityY(0);

    if (nearest && dist < this.detectionRange) {
      this.state = 'chase'; // "chase" for turret means aiming
      this._shoot(nearest, time);
    } else {
      this.state = 'patrol';
    }
  }

  _shoot(target, time) {
    if (!target) return;

    this.shootTimer += 16;
    if (this.shootTimer < this.shootInterval) return;
    this.shootTimer = 0;

    const dx = target.x - this.sprite.x;
    const dy = (target.y - 10) - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    this.scene.weaponManager.fireEnemyBullet(
      this.sprite.x + dirX * 24,
      this.sprite.y - 4,
      dirX, dirY,
      this.config.bulletSpeed,
      this.config.damage
    );
  }
}
