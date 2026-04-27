/**
 * GameScene — Main gameplay scene.
 *
 * Handles: tilemap rendering, parallax backgrounds, camera,
 * player spawning, enemy spawning, boss triggering, and game-over logic.
 */

import { CONFIG } from '../config/game.config.js';
import { SoundManager } from '../audio/sound.manager.js';
import { Player } from '../entities/player/player.js';
import { InputManager } from '../systems/input.manager.js';
import { WeaponManager } from '../systems/weapon.manager.js';
import { EnemySpawner } from '../systems/enemy.spawner.js';
import { Boss } from '../entities/enemies/boss.js';
import { HUD } from '../systems/hud.js';
import { getLevel } from '../levels/level1.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(data) {
    this.playerCount = data.playerCount || 1;
    this.levelData = data.level || getLevel(0);
    this.score = 0;
    this.gameOver = false;
    this.bossDefeated = false;
    this.bossTriggered = false;

    // ─── Background ────────────────────────────────────────────────────
    this._createBackground();

    // ─── Tilemap / World ───────────────────────────────────────────────
    this._createWorld();

    // ─── Physics ───────────────────────────────────────────────────────
    this.physics.world.setBounds(
      CONFIG.worldBounds.left,
      CONFIG.worldBounds.top,
      CONFIG.worldBounds.right,
      CONFIG.worldBounds.bottom
    );

    // ─── Camera ────────────────────────────────────────────────────────
    this.cameras.main.setBounds(
      CONFIG.worldBounds.left,
      CONFIG.worldBounds.top,
      CONFIG.worldBounds.right,
      CONFIG.worldBounds.bottom
    );
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // ─── Systems ───────────────────────────────────────────────────────
    this.inputManager = new InputManager(this, this.playerCount);
    this.weaponManager = new WeaponManager(this);
    this.enemySpawner = new EnemySpawner(this, this.levelData);
    this.hud = new HUD(this, this.playerCount);

    // ─── Players ───────────────────────────────────────────────────────
    this.players = [];
    const start = this.levelData.playerStart;
    for (let i = 0; i < this.playerCount; i++) {
      const player = new Player(this, start.x + i * 40, start.y, i, this.inputManager);
      this.players.push(player);
    }

    // Follow the first living player
    this._updateCameraFollow();

    // ─── Boss ──────────────────────────────────────────────────────────
    this.boss = null;

    // ─── Collisions ────────────────────────────────────────────────────
    this._setupCollisions();

    // ─── UI ────────────────────────────────────────────────────────────
    this.hud.create();

    // ─── Pause ─────────────────────────────────────────────────────────
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());

    // ─── BGM ───────────────────────────────────────────────────────────
    SoundManager.playBGM('bgmStage1');

    // ─── Timers ────────────────────────────────────────────────────────
    this.time.addEvent({
      delay: 1000,
      callback: this._updateHUD,
      callbackScope: this,
      loop: true,
    });

    // Start enemy spawning
    this.enemySpawner.start();
  }

  update(time, delta) {
    if (this.gameOver || this.isPaused) return;

    // Update input FIRST so players read fresh state
    this.inputManager.update();

    // Update all players
    let livingPlayer = null;
    this.players.forEach(player => {
      player.update(time, delta);
      if (player.alive && !livingPlayer) livingPlayer = player;
      // Save for one-way platform detection in next frame's physics step
      player.sprite._prevY = player.sprite.y;
      player.sprite._prevVelY = player.sprite.body.velocity.y;
    });

    // Camera follow
    if (livingPlayer) {
      this.cameras.main.startFollow(livingPlayer.sprite, true, 0.1, 0.1);
      // Keep camera within bounds
      const cam = this.cameras.main;
      const scrollX = Phaser.Math.Clamp(
        livingPlayer.sprite.x - cam.width / 2,
        0,
        CONFIG.worldBounds.right - cam.width
      );
      cam.scrollX = scrollX;
    }

    // Check boss trigger
    if (!this.bossTriggered && !this.bossDefeated) {
      const rightmostPlayer = this.players
        .filter(p => p.alive)
        .reduce((max, p) => p.sprite.x > max.sprite.x ? p : max, this.players[0]);

      if (rightmostPlayer && rightmostPlayer.sprite.x >= this.levelData.bossTriggerX) {
        this._triggerBoss();
      }
    }

    // Update enemies
    this.enemySpawner.update(time, delta);

    // Update boss
    if (this.boss && this.boss.alive) {
      this.boss.update(time, delta);
    }

    // Update background parallax
    this.updateBackground();

    // Update HUD
    this.hud.update();

    // Check game over
    if (!this.bossDefeated && this.players.every(p => !p.alive)) {
      this._triggerGameOver();
    }
  }

  // ─── Background ──────────────────────────────────────────────────────

  _createBackground() {
    const w = CONFIG.worldBounds.right;
    const h = CONFIG.gameHeight;

    // Layer 1 (farthest, slowest)
    this.bgLayer1 = this.add.tileSprite(w / 2, h / 2, w, h, 'bg_layer1');
    this.bgLayer1.setScrollFactor(0);
    this.bgLayer1.setDepth(-3);

    // Layer 2
    this.bgLayer2 = this.add.tileSprite(w / 2, h / 2, w, h, 'bg_layer2');
    this.bgLayer2.setScrollFactor(0);
    this.bgLayer2.setDepth(-2);

    // Layer 3 (closest, fastest)
    this.bgLayer3 = this.add.tileSprite(w / 2, h / 2, w, h, 'bg_layer3');
    this.bgLayer3.setScrollFactor(0);
    this.bgLayer3.setDepth(-1);
  }

  updateBackground() {
    const scrollX = this.cameras.main.scrollX;
    if (this.bgLayer1) this.bgLayer1.setTilePosition(scrollX * 0.1, 0);
    if (this.bgLayer2) this.bgLayer2.setTilePosition(scrollX * 0.3, 0);
    if (this.bgLayer3) this.bgLayer3.setTilePosition(scrollX * 0.6, 0);
  }

  // ─── World / Tilemap ─────────────────────────────────────────────────

  _createWorld() {
    const ts = CONFIG.level.tileSize;
    const level = this.levelData;

    // Ground group (static, immovable)
    this.groundTiles = this.physics.add.staticGroup();
    level.ground.forEach(seg => {
      for (let col = seg.startCol; col <= seg.endCol; col++) {
        const x = col * ts;
        const y = seg.row * ts;
        const tile = this.groundTiles.create(x + ts / 2, y + ts / 2, 'tileset', 1); // ground_top frame
        tile.setDisplaySize(ts, ts);
        tile.refreshBody();
        // Also add a ground tile below
        const tileBelow = this.groundTiles.create(x + ts / 2, y + ts + ts / 2, 'tileset', 0); // ground frame
        tileBelow.setDisplaySize(ts, ts);
        tileBelow.refreshBody();
      }
    });

    // Platforms (static)
    this.platformTiles = this.physics.add.staticGroup();
    level.platforms.forEach(p => {
      const numTiles = Math.ceil(p.width / ts);
      for (let i = 0; i < numTiles; i++) {
        let frame = 2; // platform
        if (i === 0 && numTiles === 1) frame = 2;
        else if (i === 0) frame = 3; // platform_left
        else if (i === numTiles - 1) frame = 4; // platform_right

        const tile = this.platformTiles.create(p.x + i * ts + ts / 2, p.y + ts / 2, 'tileset', frame);
        tile.setDisplaySize(ts, ts);
        tile.refreshBody();
      }
    });

    // Ladders (static, non-colliding — player checks overlap)
    this.ladderTiles = this.add.group();
    level.ladders.forEach(l => {
      const numTiles = Math.ceil(l.height / ts);
      for (let i = 0; i < numTiles; i++) {
        let frame = 5; // ladder
        if (i === 0) frame = 6; // ladder_top
        const tile = this.ladderTiles.create(l.x + ts / 2, l.y + i * ts + ts / 2, 'tileset', frame);
        tile.setDisplaySize(ts, ts);
        tile.setScrollFactor(1);
      }
    });

    // Destructible tiles
    this.destructibleTiles = this.physics.add.staticGroup();
    this.destructibleData = []; // track HP per tile
    level.destructibles.forEach(d => {
      const numW = Math.ceil(d.width / ts);
      const numH = Math.ceil(d.height / ts);
      for (let wy = 0; wy < numH; wy++) {
        for (let wx = 0; wx < numW; wx++) {
          const tile = this.destructibleTiles.create(
            d.x + wx * ts + ts / 2,
            d.y + wy * ts + ts / 2,
            'tileset', 7 // destructible frame
          );
          tile.setDisplaySize(ts, ts);
          tile.refreshBody();
          tile.hp = CONFIG.destructible.hp;
          tile.damaged = false;
          this.destructibleData.push(tile);
        }
      }
    });
  }

  // ─── Collisions ──────────────────────────────────────────────────────

  _setupCollisions() {
    // Players vs ground
    this.players.forEach(player => {
      this.physics.add.collider(player.sprite, this.groundTiles);
      // One-way platforms: processCallback prevents collision when jumping through from below
      this.physics.add.collider(player.sprite, this.platformTiles, null, this._oneWayPlatformCheck, this);
      this.physics.add.collider(player.sprite, this.destructibleTiles);
    });

    // Enemies vs ground (so they stand on tiles, not fall through)
    this.physics.add.collider(this.enemySpawner.enemyGroup, this.groundTiles);
    // Enemies also use one-way platforms
    this.physics.add.collider(this.enemySpawner.enemyGroup, this.platformTiles, null, this._oneWayPlatformCheck, this);
    this.physics.add.collider(this.enemySpawner.enemyGroup, this.destructibleTiles);

    // Power-ups vs ground (fall and land on tiles)
    this.physics.add.collider(this.enemySpawner.powerUpGroup, this.groundTiles);

    // Player bullets vs enemies
    this.physics.add.overlap(
      this.weaponManager.bulletGroup,
      this.enemySpawner.enemyGroup,
      this._onBulletHitEnemy,
      null,
      this
    );

    // Player bullets vs boss — set up in _triggerBoss when boss is created
    // (no overlap added here because this.boss is null at create time)

    // Player bullets vs destructible tiles
    this.physics.add.overlap(
      this.weaponManager.bulletGroup,
      this.destructibleTiles,
      this._onBulletHitDestructible,
      null,
      this
    );

    // Enemy bullets vs players (uses shared enemyBulletGroup from spawner)
    this.players.forEach(player => {
      this.physics.add.overlap(
        player.sprite,
        this.enemySpawner.enemyBulletGroup,
        this._onEnemyBulletHitPlayer,
        null,
        this
      );
    });

    // Players vs power-ups
    this.players.forEach(player => {
      this.physics.add.overlap(
        player.sprite,
        this.enemySpawner.powerUpGroup,
        this._onPlayerCollectPowerUp,
        null,
        this
      );
    });
  }

  // ─── One-Way Platform (Contra-style: stand on top, jump through from below) ──
  // processCallback: return false to let the character pass through, true to land on top

  _oneWayPlatformCheck(character, platform) {
    const platTop = platform.body.top;
    const prevY = character._prevY !== undefined ? character._prevY : character.y;
    const prevBottom = prevY + character.body.height / 2;
    const prevVelY = character._prevVelY !== undefined ? character._prevVelY : 0;

    // If character was below the platform and moving upward, pass through (no collision)
    if (prevBottom > platTop && prevVelY < 0) {
      return false;
    }
    // Otherwise: land on top (let the physics engine resolve the collision)
    return true;
  }

  // ─── Collision Handlers ──────────────────────────────────────────────

  _onBulletHitEnemy(bullet, enemySprite) {
    if (!bullet.active || !enemySprite.active) return;
    const enemy = enemySprite.enemyRef;
    if (!enemy) return;

    const damage = bullet.damage || 1;
    enemy.takeDamage(damage);

    if (bullet.piercing) return; // Laser pierces through
    bullet.destroy();

    SoundManager.play('hit');
  }

  _onBulletHitBoss(bullet, bossSprite) {
    if (!bullet.active || !this.boss || !this.boss.alive) return;

    const damage = bullet.damage || 1;
    this.boss.takeDamage(damage);

    if (bullet.piercing) return;
    bullet.destroy();

    SoundManager.play('hit');
  }

  _onBulletHitDestructible(bullet, tile) {
    if (!bullet.active || !tile.active || tile.hp <= 0) return;

    tile.hp--;
    bullet.destroy();

    if (tile.hp <= 0) {
      // Destroyed
      this._spawnDebris(tile.x, tile.y);
      tile.destroy();
      SoundManager.play('destruct');
    } else if (!tile.damaged) {
      // Damaged — switch to damaged frame
      tile.setFrame(8); // destructible_damaged
      tile.damaged = true;
      SoundManager.play('hit');
    }
  }

  _onEnemyBulletHitPlayer(playerSprite, bullet) {
    const player = playerSprite.playerRef;
    if (!player || !player.alive || !bullet.active || player.invincible) return;
    bullet.destroy();
    player.takeDamage(1);
    SoundManager.play('hit');
  }

  _onPlayerCollectPowerUp(playerSprite, powerUpSprite) {
    const player = playerSprite.playerRef;
    const powerUp = powerUpSprite.powerUpRef;
    if (!player || !player.alive || !powerUp || !powerUp.active) return;
    powerUp.collect(player);
    powerUp.destroy();
  }

  // ─── Particles ───────────────────────────────────────────────────────

  _spawnDebris(x, y) {
    const particles = this.add.particles(x, y, 'tileset', {
      frame: [7, 8],
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      gravityY: 300,
      quantity: CONFIG.particles.debris.count,
      blending: Phaser.BlendModes.NORMAL,
    });
    this.time.delayedCall(600, () => particles.destroy());
  }

  _spawnExplosion(x, y, big = false) {
    const cfg = CONFIG.particles.explosion;
    const particles = this.add.particles(x, y, 'bullet', {
      speed: { min: big ? 100 : 50, max: big ? cfg.speed : cfg.speed * 0.6 },
      angle: { min: 0, max: 360 },
      scale: { start: big ? 1 : 0.5, end: 0 },
      lifespan: big ? cfg.lifetime * 1.5 : cfg.lifetime,
      quantity: big ? cfg.count * 2 : cfg.count,
      tint: cfg.colors,
      blending: Phaser.BlendModes.ADD,
    });
    this.time.delayedCall(big ? 800 : 600, () => particles.destroy());

    if (big) {
      this.cameras.main.shake(CONFIG.screenShake.explosion.duration, CONFIG.screenShake.explosion.intensity * 0.01);
    }
  }

  // ─── Boss ────────────────────────────────────────────────────────────

  _triggerBoss() {
    this.bossTriggered = true;
    SoundManager.stopBGM();
    SoundManager.playBGM('bgmBoss');
    SoundManager.play('bossRoar');

    const bossData = this.levelData.boss;
    this.boss = new Boss(this, bossData.x, bossData.y || 200);

    // Update boss collision now that boss exists
    this.physics.add.overlap(
      this.weaponManager.bulletGroup,
      this.boss.sprite,
      this._onBulletHitBoss,
      null,
      this
    );

    // Boss bullets use the shared enemyBulletGroup (already set up above)
    // No need for separate collision — weaponManager.fireEnemyBullet routes to spawner's group

    // Show boss health bar
    this.hud.showBossHealthBar(this.boss);

    // Screen shake
    this.cameras.main.shake(CONFIG.screenShake.bossAttack.duration, CONFIG.screenShake.bossAttack.intensity * 0.01);
  }

  _onBossDefeated() {
    this.bossDefeated = true;
    this._spawnExplosion(this.boss.sprite.x, this.boss.sprite.y, true);
    SoundManager.play('bossExplode');
    SoundManager.stopBGM();
    SoundManager.playBGM('bgmVictory');

    this.score += 5000;

    // Drop power-ups
    this.enemySpawner.spawnPowerUp(this.boss.sprite.x, this.boss.sprite.y, 'spread');
    this.enemySpawner.spawnPowerUp(this.boss.sprite.x + 40, this.boss.sprite.y, 'laser');

    this.hud.hideBossHealthBar();

    // Transition to victory after delay
    this.time.delayedCall(3000, () => {
      this.scene.start('VictoryScene', { score: this.score, playerCount: this.playerCount });
    });
  }

  // ─── Game Over ───────────────────────────────────────────────────────

  _triggerGameOver() {
    this.gameOver = true;
    SoundManager.stopBGM();
    SoundManager.playBGM('bgmGameOver');

    this.time.delayedCall(2000, () => {
      this.scene.start('GameOverScene', { score: this.score, playerCount: this.playerCount });
    });
  }

  // ─── Camera ──────────────────────────────────────────────────────────

  _updateCameraFollow() {
    const living = this.players.find(p => p.alive);
    if (living) {
      this.cameras.main.startFollow(living.sprite, true, 0.1, 0.1);
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────

  _updateHUD() {
    this.hud.updateScore(this.score);
    this.hud.updatePlayers(this.players);
  }

  // ─── Pause ───────────────────────────────────────────────────────────

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.hud.showPause();
    } else {
      this.physics.resume();
      this.hud.hidePause();
    }
  }
}
