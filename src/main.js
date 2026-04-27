/**
 * main.js — Phaser game entry point.
 *
 * Registers all scenes and creates the Phaser game instance.
 */

import { CONFIG } from './config/game.config.js';
import { BootScene } from './scenes/boot.scene.js';
import { MenuScene } from './scenes/menu.scene.js';
import { RemapScene } from './scenes/remap.scene.js';
import { GameScene } from './scenes/game.scene.js';
import { GameOverScene } from './scenes/gameover.scene.js';
import { VictoryScene } from './scenes/victory.scene.js';

const config = {
  type: Phaser.AUTO,
  width: CONFIG.gameWidth,
  height: CONFIG.gameHeight,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: CONFIG.gravity.x, y: CONFIG.gravity.y },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, RemapScene, GameScene, GameOverScene, VictoryScene],
};

const game = new Phaser.Game(config);

// Make game instance available globally for debugging
window.game = game;
