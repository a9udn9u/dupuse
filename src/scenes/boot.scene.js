/**
 * BootScene — Loads and generates all assets.
 *
 * This is the first scene. It generates procedural assets (or loads real ones)
 * and initializes the audio system before transitioning to the menu.
 */

import { CONFIG } from '../config/game.config.js';
import { AssetRegistry } from '../assets/asset.registry.js';
import { SoundManager } from '../audio/sound.manager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading text
    const loadingText = this.add.text(
      CONFIG.gameWidth / 2, CONFIG.gameHeight / 2,
      'LOADING...', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.cameras.main.setBackgroundColor('#000000');
  }

  create() {
    // Generate or load all assets
    AssetRegistry.loadAll(this);

    // Initialize audio system
    SoundManager.init(this);

    // Move to menu
    this.scene.start('MenuScene');
  }
}
