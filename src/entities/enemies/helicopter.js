/**
 * Helicopter — Flying enemy that drops bombs.
 */

import { Enemy } from './enemy.js';
import { CONFIG } from '../../config/game.config.js';
import { SoundManager } from '../../audio/sound.manager.js';

export class Helicopter extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.enemies.helicopter);
    this.sprite.setTexture('enemy_helicopter');
    this.sprite.setDisplaySize(64, 48);
    this.detectionRange = 450;
    this.flyY = y || 120;
    this.bombTimer = 0;
    this.bombInterval = 2500;
  }

  get textureKey() { return 'enemy_helicopter'; }

  update(time, delta) {
    if (!this.alive) return;

    const nearest = this._findNearestPlayer();
    const dist = nearest ? this._distanceTo(nearest) : Infinity;

    // Hover at altitude
    this.sprite.body.setGravityY(0);

    switch (this.state) {
      case 'patrol':
        this.sprite.body.setVelocityX(this.patrolDir * this.config.speed);
        // Gentle bob
        this.sprite.body.setVelocityY(Math.sin(time * 0.003) * 20);

        this.patrolTimer += delta;
        if (this.patrolTimer > 4000 + Math.random() * 3000) {
          this.patrolDir *= -1;
          this.patrolTimer = 0;
        }
        if (nearest && dist < this.detectionRange) this.state = 'detect';
        break;

      case 'detect':
        this.sprite.body.setVelocityX(0);
        this.sprite.body.setVelocityY(Math.sin(time * 0.003) * 20);
        this.patrolDir = nearest ? (nearest.x > this.sprite.x ? 1 : -1) : this.patrolDir;
        if (dist < this.detectionRange * 0.6) this.state = 'chase';
        else if (!nearest || dist > this.detectionRange * 1.5) this.state = 'patrol';
        break;

      case 'chase':
        if (nearest) {
          const dir = nearest.x > this.sprite.x ? 1 : -1;
          this.sprite.body.setVelocityX(dir * this.config.speed * 0.8);
          this.patrolDir = dir;
        }
        this.sprite.body.setVelocityY(Math.sin(time * 0.003) * 20);
        this._dropBomb(nearest, time);
        this._shoot(nearest, time);
        if (!nearest || dist > this.detectionRange * 1.5) this.state = 'patrol';
        break;
    }

    this.sprite.setFlipX(this.patrolDir < 0);
  }

  _dropBomb(target, time) {
    if (!target) return;

    this.bombTimer += 16;
    if (this.bombTimer < this.bombInterval) return;
    this.bombTimer = 0;

    // Drop a bomb at player's X position
    const bomb = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y + 20, 'missile');
    bomb.setVelocity(0, 150);
    bomb.setGravityY(400);
    bomb.damage = 1;
    bomb.setDepth(3);

    // Add to shared enemy bullet group for collision
    this.scene.enemySpawner.enemyBulletGroup.add(bomb);

    SoundManager.play('missile');

    // Clean up
    this.scene.time.delayedCall(3000, () => {
      if (bomb.active) {
        this.scene._spawnExplosion(bomb.x, bomb.y, false);
        SoundManager.play('explosion');
        bomb.destroy();
      }
    });
  }
}
