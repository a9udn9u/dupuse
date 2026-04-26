/**
 * WeaponManager — Handles player weapons, bullets, and firing.
 *
 * Supports: Normal, Spread, Laser, Flame weapons.
 * Uses object pooling for bullet performance.
 */

import { CONFIG } from '../config/game.config.js';

export class WeaponManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    // Bullet groups (pooled)
    this.bulletGroup = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 500,
      runChildUpdate: true,
    });

    // Enemy bullet group (for enemy projectiles — managed by enemies but tracked here)
    this.enemyBulletGroup = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 300,
    });
  }

  /**
   * Fire a player bullet.
   * @param {number} x - Origin X
   * @param {number} y - Origin Y
   * @param {number} dirX - Direction X (-1 to 1)
   * @param {number} dirY - Direction Y (-1 to 1)
   * @param {object} weaponConfig - Weapon config from CONFIG.weapons
   * @param {number} ownerPlayerNum - Player index who fired
   */
  fireBullet(x, y, dirX, dirY, weaponConfig, ownerPlayerNum) {
    const bullet = this.bulletGroup.get();
    if (!bullet) return;

    let texture = 'bullet';
    if (weaponConfig.name === 'Flame') texture = 'flame';

    bullet.setTexture(texture);
    bullet.setPosition(x, y);
    bullet.setVelocity(dirX * weaponConfig.bulletSpeed, dirY * weaponConfig.bulletSpeed);
    bullet.setTint(weaponConfig.color);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setAlpha(1);
    bullet.body.setAllowGravity(false);

    // Custom properties
    bullet.damage = weaponConfig.damage;
    bullet.piercing = weaponConfig.piercing || false;
    bullet.ownerPlayerNum = ownerPlayerNum;
    bullet.weaponType = weaponConfig.name.toLowerCase();

    // Lifetime for flame bullets
    if (weaponConfig.lifetime) {
      this.scene.time.delayedCall(weaponConfig.lifetime, () => {
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
        }
      });
    }

    // Auto-recycle after distance/time
    this.scene.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });

    // Muzzle flash particle
    this._spawnMuzzleFlash(x, y);
  }

  /**
   * Fire an enemy bullet (used by enemies and boss).
   * Uses the scene's shared enemy bullet group via the spawner.
   * @param {number} x
   * @param {number} y
   * @param {number} dirX
   * @param {number} dirY
   * @param {number} speed
   * @param {number} damage
   */
  fireEnemyBullet(x, y, dirX, dirY, speed, damage = 1) {
    // Use the spawner's enemy bullet group if available, otherwise our own
    const group = this.scene.enemySpawner?.enemyBulletGroup || this.enemyBulletGroup;
    const bullet = group.get();
    if (!bullet) return;

    bullet.setTexture('enemy_bullet');
    bullet.setPosition(x, y);
    bullet.setVelocity(dirX * speed, dirY * speed);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.damage = damage;
    bullet.body.setAllowGravity(false);

    // Auto-recycle
    this.scene.time.delayedCall(3000, () => {
      if (bullet.active) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });
  }

  /**
   * Fire a missile (boss attack).
   * @param {number} x
   * @param {number} y
   * @param {number} dirX
   * @param {number} dirY
   * @param {number} speed
   */
  fireMissile(x, y, dirX, dirY, speed = 250) {
    const group = this.scene.enemySpawner?.enemyBulletGroup || this.enemyBulletGroup;
    const bullet = group.get();
    if (!bullet) return;

    bullet.setTexture('missile');
    bullet.setPosition(x, y);
    bullet.setVelocity(dirX * speed, dirY * speed);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.damage = 1;
    bullet.body.setAllowGravity(false);
    bullet.isMissile = true;

    this.scene.time.delayedCall(4000, () => {
      if (bullet.active) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }
    });
  }

  // ─── Particles ───────────────────────────────────────────────────────

  _spawnMuzzleFlash(x, y) {
    const particles = this.scene.add.particles(x, y, 'bullet', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.3, end: 0 },
      lifespan: 80,
      quantity: 3,
      tint: [0xffff00, 0xffffff],
      blending: Phaser.BlendModes.ADD,
    });
    this.scene.time.delayedCall(100, () => particles.destroy());
  }
}
