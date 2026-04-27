/**
 * Boss — Multi-phase boss enemy (armored walker).
 *
 * Phases:
 *   Phase 1: Spread shots + occasional missiles
 *   Phase 2: Faster spread + more missiles
 *   Phase 3: Ground slam + missile barrage
 */

import { CONFIG } from '../../config/game.config.js';
import { SoundManager } from '../../audio/sound.manager.js';

export class Boss {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.alive = true;
    this.config = CONFIG.boss;

    this.hp = this.config.hp;
    this.maxHP = this.config.hp;
    this.phase = 1;
    this.entering = true;

    // Timers
    this.shootTimer = 0;
    this.missileTimer = 0;
    this.slamTimer = 0;
    this.moveTimer = 0;
    this.moveDir = -1;

    // Create sprite at given position, then animate entrance
    this.sprite = scene.physics.add.sprite(x, y, 'boss');
    this.sprite.setDisplaySize(96, 96);
    // setCollideWorldBounds is enabled AFTER entrance animation completes
    // to prevent physics from clamping the entrance tween
    this.sprite.body.setCollideWorldBounds(false);
    this.sprite.setBounce(0);
    this.sprite.setDepth(6);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(60, 70);
    this.sprite.body.setOffset(18, 14);

    // Bullet group
    this.bulletGroup = scene.physics.add.group();

    // Entrance animation: move in from above using a tween.
    // _move() is skipped while entering=true, so no conflict.
    // NOTE: setCollideWorldBounds is enabled AFTER entrance in _enterAnimation
    // to avoid physics fighting the tween (body would clamp to y=0 otherwise).
    this._enterAnimation();
  }

  _enterAnimation() {
    // Disable world bounds during entrance so the tween can move the boss freely
    this.sprite.body.setCollideWorldBounds(false);

    // Start above the visible area (gameHeight=450, start at y=-120)
    const startY = -120;
    this.sprite.setY(startY);

    this.scene.tweens.add({
      targets: this.sprite,
      y: 60,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        this.entering = false;
        // Re-enable world bounds after entrance is complete
        // Guard: sprite/body may be null if scene was shut down during the tween
        if (this.sprite && this.sprite.body) {
          this.sprite.body.setCollideWorldBounds(true);
        }
        SoundManager.play('bossRoar');
      },
    });
  }

  update(time, delta) {
    if (!this.alive) return;

    // Guard: sprite body may be null during scene transitions or if destroyed
    if (!this.sprite || !this.sprite.body) return;

    // Check phase transitions
    this._checkPhase();

    // Movement — patrol back and forth (skip during entrance animation)
    if (!this.entering) {
      this._move(delta);
    }

    // Attacks based on phase
    this.shootTimer += delta;
    this.missileTimer += delta;
    this.slamTimer += delta;

    const shootInterval = this.config.shootInterval / this.phase;
    const missileInterval = this.config.missileInterval / Math.max(1, this.phase - 0.5);

    // Spread shot (all phases)
    if (this.shootTimer >= shootInterval) {
      this._spreadShot();
      this.shootTimer = 0;
    }

    // Missiles (phase 1+)
    if (this.missileTimer >= missileInterval) {
      this._fireMissiles();
      this.missileTimer = 0;
    }

    // Ground slam (phase 3)
    if (this.phase >= 3 && this.slamTimer >= this.config.groundSlamInterval) {
      this._groundSlam();
      this.slamTimer = 0;
    }
  }

  _checkPhase() {
    const hpFraction = this.hp / this.maxHP;

    if (this.phase === 1 && hpFraction <= this.config.phase2Threshold) {
      this.phase = 2;
      SoundManager.play('bossRoar');
      this.scene.cameras.main.shake(
        CONFIG.screenShake.bossAttack.duration,
        CONFIG.screenShake.bossAttack.intensity * 0.01
      );
    } else if (this.phase === 2 && hpFraction <= this.config.phase3Threshold) {
      this.phase = 3;
      SoundManager.play('bossRoar');
      this.scene.cameras.main.shake(
        CONFIG.screenShake.bossAttack.duration,
        CONFIG.screenShake.bossAttack.intensity * 0.01
      );
    }
  }

  _move(delta) {
    if (!this.sprite || !this.sprite.body) return;

    this.moveTimer += delta;
    if (this.moveTimer > 3000 + Math.random() * 2000) {
      this.moveDir *= -1;
      this.moveTimer = 0;
    }

    this.sprite.body.setVelocityX(this.moveDir * this.config.speed);
    this.sprite.body.setVelocityY(0);

    // Flip sprite
    this.sprite.setFlipX(this.moveDir > 0);
  }

  _spreadShot() {
    const target = this._findNearestPlayer();
    if (!target) return;

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const baseAngle = Math.atan2(dy, dx);

    const count = 3 + this.phase * 2; // More shots in later phases
    const spread = 0.4;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - (count - 1) / 2) * (spread / (count - 1 || 1));
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      this.scene.weaponManager.fireEnemyBullet(
        this.sprite.x + dirX * 48,
        this.sprite.y,
        dirX, dirY,
        this.config.bulletSpeed * (1 + this.phase * 0.1),
        this.config.damage
      );
    }

    SoundManager.play('gunshot');
  }

  _fireMissiles() {
    const target = this._findNearestPlayer();
    const count = this.phase >= 2 ? 3 : 1;

    for (let i = 0; i < count; i++) {
      let dirX, dirY;
      if (target) {
        const dx = target.x - this.sprite.x;
        const dy = target.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        dirX = dx / dist;
        dirY = dy / dist;
      } else {
        dirX = -1;
        dirY = 0.5;
      }

      this.scene.weaponManager.fireMissile(
        this.sprite.x + dirX * 50,
        this.sprite.y,
        dirX, dirY,
        200 + this.phase * 30
      );

      SoundManager.play('missile');
    }
  }

  _groundSlam() {
    // Jump up and slam down
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 60,
      duration: 300,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        SoundManager.play('explosion');
        this.scene.cameras.main.shake(
          CONFIG.screenShake.bossAttack.duration,
          CONFIG.screenShake.bossAttack.intensity * 0.01
        );

        // AoE damage to players in range
        this.scene.players.forEach(player => {
          if (!player.alive) return;
          const dist = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y + 48,
            player.sprite.x, player.sprite.y
          );
          if (dist < 200) {
            player.takeDamage(1);
          }
        });

        // Spawn shockwave visual
        this.scene.add.circle(this.sprite.x, this.sprite.y + 48, 5, 0xffaa00)
          .setDepth(4)
          .setAlpha(0.8);
        this.scene.tweens.add({
          targets: this.scene.add.circle(this.sprite.x, this.sprite.y + 48, 5, 0xffaa00),
          x: 0, y: 0, scaleX: 40, scaleY: 8, alpha: 0,
          duration: 500,
          ease: 'Power1',
        });
      },
    });
  }

  _findNearestPlayer() {
    const players = this.scene.players;
    if (!players) return null;

    let nearest = null;
    let minDist = Infinity;
    for (const player of players) {
      if (!player.alive) continue;
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        player.sprite.x, player.sprite.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = player.sprite;
      }
    }
    return nearest;
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.hp -= amount;
    this.sprite.setTint(0xff4444);
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.sprite.clearTint();
    });

    // Flash HUD
    this.scene.hud.flashBossBar();

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.sprite.body.setEnable(false);

    this.scene._onBossDefeated();
  }

  /**
   * Get current HP fraction (0-1) for health bar.
   */
  getHPFraction() {
    return Math.max(0, this.hp / this.maxHP);
  }
}
