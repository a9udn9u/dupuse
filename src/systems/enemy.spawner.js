/**
 * EnemySpawner — Wave-based enemy spawning system.
 *
 * Reads level spawn data and triggers enemies by proximity to players.
 * Also handles power-up spawning.
 */

import { CONFIG } from '../config/game.config.js';
import { Soldier } from '../entities/enemies/soldier.js';
import { Turret } from '../entities/enemies/turret.js';
import { Helicopter } from '../entities/enemies/helicopter.js';
import { PowerUp } from '../entities/powerups/powerup.js';

export class EnemySpawner {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} levelData
   */
  constructor(scene, levelData) {
    this.scene = scene;
    this.levelData = levelData;
    this.spawnedSpawns = new Set();

    // Groups
    this.enemyGroup = scene.physics.add.group();
    this.enemyBulletGroup = scene.physics.add.group();
    this.powerUpGroup = scene.physics.add.group();

    // Track all active enemies
    this.activeEnemies = [];
  }

  start() {
    // Check for spawn triggers every 500ms
    this.scene.time.addEvent({
      delay: 500,
      callback: this._checkSpawns,
      callbackScope: this,
      loop: true,
    });
  }

  _checkSpawns() {
    if (this.scene.gameOver || this.scene.bossTriggered) return;

    // Find rightmost living player
    const players = this.scene.players.filter(p => p.alive);
    if (players.length === 0) return;

    const rightmost = players.reduce((max, p) =>
      p.sprite.x > max.sprite.x ? p : max, players[0]
    );

    // Check each spawn point
    for (let i = 0; i < this.levelData.spawns.length; i++) {
      if (this.spawnedSpawns.has(i)) continue;

      const spawn = this.levelData.spawns[i];
      // Spawn when player is within range
      if (rightmost.sprite.x >= spawn.x - 600) {
        this._spawnWave(spawn, i);
        this.spawnedSpawns.add(i);
      }
    }
  }

  _spawnWave(spawn, spawnIndex) {
    const count = spawn.count || 1;
    const spacing = 60;

    for (let i = 0; i < count; i++) {
      const x = spawn.x + i * spacing;
      let y;

      switch (spawn.type) {
        case 'soldier':
          y = 350;
          this._createEnemy(Soldier, x, y);
          break;
        case 'turret':
          y = 384; // on ground
          this._createEnemy(Turret, x, y);
          break;
        case 'helicopter':
          y = 100;
          this._createEnemy(Helicopter, x, y);
          break;
      }
    }
  }

  _createEnemy(EnemyClass, x, y) {
    const enemy = new EnemyClass(this.scene, x, y);
    this.activeEnemies.push(enemy);
    this.enemyGroup.add(enemy.sprite);
  }

  /**
   * Spawn a power-up at a position.
   * @param {number} x
   * @param {number} y
   * @param {string} type - Power-up type
   */
  spawnPowerUp(x, y, type) {
    const powerUp = new PowerUp(this.scene, x, y, type);
    this.powerUpGroup.add(powerUp.sprite);
  }

  /**
   * Update all active enemies.
   * Call from GameScene.update().
   */
  update(time, delta) {
    this.activeEnemies = this.activeEnemies.filter(enemy => {
      enemy.update(time, delta);
      return enemy.alive;
    });
  }

  /**
   * Clean up all enemies.
   */
  destroy() {
    this.activeEnemies.forEach(enemy => enemy.destroy());
    this.activeEnemies = [];
    this.enemyGroup.clear(true, true);
    this.enemyBulletGroup.clear(true, true);
    this.powerUpGroup.clear(true, true);
  }
}
