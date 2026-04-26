/**
 * Soldier — Walking enemy that shoots at players.
 */

import { Enemy } from './enemy.js';
import { CONFIG } from '../../config/game.config.js';

export class Soldier extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.enemies.soldier);
    this.sprite.setTexture('enemy_soldier');
    this.detectionRange = 350;
  }

  get textureKey() { return 'enemy_soldier'; }

  update(time, delta) {
    if (!this.alive) return;

    const nearest = this._findNearestPlayer();
    const dist = nearest ? this._distanceTo(nearest) : Infinity;

    switch (this.state) {
      case 'patrol':
        this.sprite.body.setVelocityX(this.patrolDir * this.config.speed);
        this.patrolTimer += delta;
        if (this.patrolTimer > 2000 + Math.random() * 2000) {
          this.patrolDir *= -1;
          this.patrolTimer = 0;
        }
        if (nearest && dist < this.detectionRange) this.state = 'detect';
        break;

      case 'detect':
        if (!nearest || dist > this.detectionRange * 1.5) {
          this.state = 'patrol';
          break;
        }
        this.sprite.body.setVelocityX(0);
        this.patrolDir = nearest.x > this.sprite.x ? 1 : -1;
        if (dist < this.detectionRange * 0.5) this.state = 'chase';
        break;

      case 'chase':
        if (nearest) {
          const dir = nearest.x > this.sprite.x ? 1 : -1;
          this.sprite.body.setVelocityX(dir * this.config.speed * 1.2);
          this.patrolDir = dir;
        }
        this._shoot(nearest, time);
        if (!nearest || dist > this.detectionRange * 1.5) this.state = 'patrol';
        break;
    }

    // Flip sprite based on direction
    this.sprite.setFlipX(this.patrolDir < 0);
  }
}
