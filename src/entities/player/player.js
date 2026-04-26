/**
 * Player — The controllable hero.
 *
 * States: idle, run, jump, crouch, climb, shoot, dead
 * Supports 8-directional shooting, configurable HP, jump-dodge,
 * hit invincibility, and multi-player color differentiation.
 */

import { CONFIG } from '../../config/game.config.js';
import { SoundManager } from '../../audio/sound.manager.js';
import { POWERUP_TYPES } from '../../assets/asset.registry.js';

export class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} playerNum - 0-based player index (0-3)
   * @param {InputManager} inputManager
   */
  constructor(scene, x, y, playerNum, inputManager) {
    this.scene = scene;
    this.playerNum = playerNum;
    this.inputManager = inputManager;
    this.alive = true;
    this.invincible = false;
    this.invincibleTimer = null;

    // HP
    this.maxHP = CONFIG.playerMaxHP;
    this.hp = this.maxHP;

    // Movement state
    this.isCrouching = false;
    this.isClimbing = false;
    this.isJumping = false;
    this.facing = 1; // 1 = right, -1 = left
    this.shootDirX = 1;
    this.shootDirY = 0;

    // Current weapon
    this.currentWeapon = 'normal';

    // Last ground contact
    this.onGround = false;

    // Create sprite
    const colors = CONFIG.playerColors[playerNum] || CONFIG.playerColors[0];
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.playerRef = this; // back-reference for collision callbacks
    this.sprite.playerIndex = playerNum; // custom property, not a Phaser method
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setTint(colors.body);
    this.sprite.setDepth(10 + playerNum);
    // Tighter hitbox (texture is 32x48)
    this.sprite.body.setSize(20, 38);
    this.sprite.body.setOffset(6, 6);

    // Set initial animation
    this._setAnimation('idle');

    // Shoot cooldown
    this.lastShotTime = 0;

    // Crouch jump (jump-dodge) timer
    this.crouchReleaseTime = 0;
  }

  update(time, delta) {
    if (!this.alive) return;

    const input = this.inputManager.getInput(this.playerNum);
    if (!input) return;

    // Update facing direction and shoot direction
    this._updateFacing(input);

    // Check ladder overlap
    this._checkLadder();

    // Handle climbing
    if (this.isClimbing) {
      this._handleClimbing(input);
    } else {
      // Handle ground movement
      this._handleGroundMovement(input, time, delta);
    }

    // Handle shooting
    this._handleShooting(input, time);

    // Check pit death
    if (this.sprite.y > CONFIG.gameHeight + 50) {
      this.die();
    }

    // Update animation
    this._updateAnimation(input);
  }

  // ─── Facing & Direction ──────────────────────────────────────────────

  _updateFacing(input) {
    if (input.left) {
      this.facing = -1;
      this.shootDirX = -1;
    } else if (input.right) {
      this.facing = 1;
      this.shootDirX = 1;
    }

    if (input.up && !this.isClimbing) {
      this.shootDirY = -1;
    } else if (input.down && !this.isClimbing) {
      this.shootDirY = 1;
    } else if (!this.isClimbing) {
      this.shootDirY = 0;
    }

    // Normalize shoot direction
    if (this.shootDirX !== 0 && this.shootDirY !== 0) {
      const len = Math.sqrt(this.shootDirX * this.shootDirX + this.shootDirY * this.shootDirY);
      this.shootDirX /= len;
      this.shootDirY /= len;
    }
  }

  // ─── Ladder ──────────────────────────────────────────────────────────

  _checkLadder() {
    const ladderTiles = this.scene.ladderTiles;
    if (!ladderTiles) return;

    let onLadder = false;
    ladderTiles.getChildren().forEach(tile => {
      if (tile.active && Phaser.Geom.Intersects.RectangleToRectangle(
        this.sprite.getBounds(),
        tile.getBounds()
      )) {
        onLadder = true;
      }
    });

    if (onLadder && !this.isClimbing) {
      // Player can start climbing if pressing up or down
      const input = this.inputManager.getInput(this.playerNum);
      if (input && (input.up || input.down)) {
        this.isClimbing = true;
        this.sprite.body.setVelocityY(0);
        this.sprite.body.setGravityY(0);
        SoundManager.play('ladder');
      }
    }
  }

  _handleClimbing(input) {
    this.sprite.body.setVelocityX(0);
    this.sprite.body.setVelocityY(0);
    this.isCrouching = false;

    if (input.up) {
      this.sprite.body.setVelocityY(-CONFIG.playerClimbSpeed);
    } else if (input.down) {
      this.sprite.body.setVelocityY(CONFIG.playerClimbSpeed);
    }

    // Jump off ladder
    if (input.jump) {
      this.isClimbing = false;
      this.sprite.body.setGravityY(CONFIG.gravity.y);
      this.sprite.body.setVelocityY(CONFIG.playerJumpVelocity);
      this.isJumping = true;
      SoundManager.play('jump');
    }

    // Stop climbing if no longer on ladder
    if (!input.up && !input.down) {
      // Check if still on ladder
      const stillOnLadder = this._isOnLadder();
      if (!stillOnLadder) {
        this.isClimbing = false;
        this.sprite.body.setGravityY(CONFIG.gravity.y);
      }
    }
  }

  _isOnLadder() {
    const ladderTiles = this.scene.ladderTiles;
    if (!ladderTiles) return false;

    for (const tile of ladderTiles.getChildren()) {
      if (tile.active && Phaser.Geom.Intersects.RectangleToRectangle(
        this.sprite.getBounds(),
        tile.getBounds()
      )) {
        return true;
      }
    }
    return false;
  }

  // ─── Ground Movement ─────────────────────────────────────────────────

  _handleGroundMovement(input, time, delta) {
    this.sprite.body.setGravityY(CONFIG.gravity.y);

    // Crouching
    const wasCrouching = this.isCrouching;
    this.isCrouching = input.down && this.onGround && !this.isJumping;

    // Jump-dodge: quick jump from crouch when releasing down
    if (wasCrouching && !this.isCrouching && input.jump) {
      this.sprite.body.setVelocityY(CONFIG.playerJumpVelocity * 1.1);
      this.isJumping = true;
      this.onGround = false;
      SoundManager.play('jump');
      return;
    }

    if (this.isCrouching) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    // Horizontal movement
    let speed = CONFIG.playerSpeed;
    if (input.left) {
      this.sprite.body.setVelocityX(-speed);
    } else if (input.right) {
      this.sprite.body.setVelocityX(speed);
    } else {
      this.sprite.body.setVelocityX(0);
    }

    // Jump
    if (input.jump && this.onGround) {
      this.sprite.body.setVelocityY(CONFIG.playerJumpVelocity);
      this.isJumping = true;
      this.onGround = false;
      SoundManager.play('jump');
    }

    // Track ground contact
    this.onGround = this.sprite.body.touching.down;
    if (this.onGround) {
      this.isJumping = false;
    }
  }

  // ─── Shooting ────────────────────────────────────────────────────────

  _handleShooting(input, time) {
    if (!input.shoot) return;
    if (time < this.lastShotTime) return;

    const weaponConfig = CONFIG.weapons[this.currentWeapon];
    if (!weaponConfig) return;

    this.lastShotTime = time + weaponConfig.fireRate;

    // Determine weapon sound
    const soundKey = this.currentWeapon === 'normal' ? 'gunshot' :
                     this.currentWeapon === 'laser' ? 'laser' :
                     this.currentWeapon === 'flame' ? 'flame' : 'gunshot';
    SoundManager.play(soundKey);

    // Fire bullets
    const originX = this.sprite.x + this.shootDirX * 16;
    const originY = this.sprite.y + this.shootDirY * 8 - 4;

    const count = weaponConfig.bulletCount;
    const spread = weaponConfig.spread;

    for (let i = 0; i < count; i++) {
      let dirX = this.shootDirX;
      let dirY = this.shootDirY;

      if (count > 1) {
        // Spread shot
        const angle = Math.atan2(dirY, dirX);
        const spreadAngle = angle + (i - (count - 1) / 2) * spread;
        dirX = Math.cos(spreadAngle);
        dirY = Math.sin(spreadAngle);
      }

      this.scene.weaponManager.fireBullet(
        originX, originY,
        dirX, dirY,
        weaponConfig,
        this.playerNum
      );
    }
  }

  // ─── Damage & Death ──────────────────────────────────────────────────

  takeDamage(amount) {
    if (this.invincible || !this.alive) return;

    this.hp -= amount;
    this.invincible = true;

    // Flash effect
    this.sprite.setAlpha(0.5);
    this.invincibleTimer = this.scene.time.addEvent({
      delay: CONFIG.playerInvincibilityDuration,
      callback: () => {
        this.invincible = false;
        this.sprite.setAlpha(1);
      },
    });

    // Knockback
    this.sprite.body.setVelocityY(-200);

    SoundManager.play('hit');
    this.scene.cameras.main.shake(
      CONFIG.screenShake.playerHit.duration,
      CONFIG.screenShake.playerHit.intensity * 0.01
    );

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.sprite.body.setEnable(false);
    this.sprite.setAlpha(0.3);
    SoundManager.play('death');

    // Respawn after delay if other players are alive
    const hasLivingPlayers = this.scene.players.some(p => p !== this && p.alive);
    if (hasLivingPlayers) {
      this.scene.time.delayedCall(3000, () => this.respawn());
    }
  }

  respawn() {
    if (this.alive) return;

    // Find a living player to respawn near
    const living = this.scene.players.find(p => p !== this && p.alive);
    const x = living ? living.sprite.x - 40 : this.scene.levelData.playerStart.x;
    const y = living ? living.sprite.y : this.scene.levelData.playerStart.y;

    this.alive = true;
    this.hp = this.maxHP;
    this.invincible = true;
    this.sprite.body.setEnable(true);
    this.sprite.setPosition(x, y);
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setGravityY(CONFIG.gravity.y);
    this.sprite.setAlpha(0.5);
    this.isClimbing = false;
    this.isCrouching = false;
    this.isJumping = false;
    this.currentWeapon = 'normal';

    SoundManager.play('powerUp');

    this.invincibleTimer = this.scene.time.addEvent({
      delay: 2000,
      callback: () => {
        this.invincible = false;
        this.sprite.setAlpha(1);
      },
    });
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }

  // ─── Power-ups ───────────────────────────────────────────────────────

  usePowerUp(type) {
    switch (type) {
      case POWERUP_TYPES.SPREAD:
      case POWERUP_TYPES.LASER:
      case POWERUP_TYPES.FLAME:
      case POWERUP_TYPES.NORMAL:
        this.currentWeapon = type;
        break;
      case POWERUP_TYPES.LIFE:
        this.heal(1);
        break;
    }
    SoundManager.play('powerUp');
  }

  // ─── Animation ───────────────────────────────────────────────────────

  _updateAnimation(input) {
    if (!this.alive) return;

    if (this.isClimbing) {
      this._setAnimation('climb');
    } else if (this.isCrouching) {
      this._setAnimation('crouch');
    } else if (this.isJumping || !this.onGround) {
      this._setAnimation('jump');
    } else if (input.left || input.right) {
      this._setAnimation('run');
    } else {
      this._setAnimation('idle');
    }
  }

  _setAnimation(name) {
    // Since we're using procedural sprites, we'll handle animation via frame switching
    // For now, just track the state
    this.currentAnim = name;
  }
}
