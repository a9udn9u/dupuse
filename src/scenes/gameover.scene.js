/**
 * GameOverScene — Displayed when all players are dead.
 */

import { CONFIG } from '../config/game.config.js';
import { SoundManager } from '../audio/sound.manager.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data) {
    this._playerCount = data.playerCount || 1;
    this._score = data.score || 0;
    this.cameras.main.setBackgroundColor('#1a0000');

    // Title
    this.add.text(CONFIG.gameWidth / 2, 100, 'GAME OVER', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#ff2222',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Score
    this.add.text(CONFIG.gameWidth / 2, 180, `FINAL SCORE`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(CONFIG.gameWidth / 2, 210, `${this._score}`, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Players
    this.add.text(CONFIG.gameWidth / 2, 260, `${this._playerCount} PLAYER${this._playerCount > 1 ? 'S' : ''}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Retry button
    const retryBg = this.add.rectangle(CONFIG.gameWidth / 2, 330, 180, 40, 0x884444)
      .setInteractive({ useHandCursor: true });

    const retryText = this.add.text(CONFIG.gameWidth / 2, 330, 'TRY AGAIN', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    retryBg.on('pointerover', () => retryBg.setFillStyle(0xaa5555));
    retryBg.on('pointerout', () => retryBg.setFillStyle(0x884444));
    retryBg.on('pointerdown', () => this._restart());

    // Menu button
    const menuBg = this.add.rectangle(CONFIG.gameWidth / 2, 380, 180, 40, 0x444466)
      .setInteractive({ useHandCursor: true });

    const menuText = this.add.text(CONFIG.gameWidth / 2, 380, 'MAIN MENU', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    menuBg.on('pointerover', () => menuBg.setFillStyle(0x555588));
    menuBg.on('pointerout', () => menuBg.setFillStyle(0x444466));
    menuBg.on('pointerdown', () => this._goToMenu());

    // Keyboard
    this.input.keyboard.on('keydown-ENTER', () => this._restart());
    this.input.keyboard.on('keydown-SPACE', () => this._restart());
  }

  _restart() {
    SoundManager.stopBGM();
    SoundManager.play('powerUp');
    this.scene.start('GameScene', {
      playerCount: this._playerCount,
    });
  }

  _goToMenu() {
    SoundManager.stopBGM();
    this.scene.start('MenuScene');
  }
}
