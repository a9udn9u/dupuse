/**
 * VictoryScene — Displayed when the boss is defeated.
 */

import { CONFIG } from '../config/game.config.js';
import { SoundManager } from '../audio/sound.manager.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(data) {
    this._playerCount = data.playerCount || 1;
    this._score = data.score || 0;
    this.cameras.main.setBackgroundColor('#001a00');

    // Title with animation
    const title = this.add.text(CONFIG.gameWidth / 2, 80, 'MISSION COMPLETE!', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Score
    this.add.text(CONFIG.gameWidth / 2, 160, 'FINAL SCORE', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(CONFIG.gameWidth / 2, 190, `${this._score}`, {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffff00',
    }).setOrigin(0.5);

    // Stats
    this.add.text(CONFIG.gameWidth / 2, 240, `${this._playerCount} PLAYER${this._playerCount > 1 ? 'S' : ''}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#88ff88',
    }).setOrigin(0.5);

    // Continue button
    const continueBg = this.add.rectangle(CONFIG.gameWidth / 2, 320, 200, 40, 0x44aa44)
      .setInteractive({ useHandCursor: true });

    const continueText = this.add.text(CONFIG.gameWidth / 2, 320, 'PLAY AGAIN', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    continueBg.on('pointerover', () => continueBg.setFillStyle(0x55cc55));
    continueBg.on('pointerout', () => continueBg.setFillStyle(0x44aa44));
    continueBg.on('pointerdown', () => this._restart());

    // Menu button
    const menuBg = this.add.rectangle(CONFIG.gameWidth / 2, 370, 200, 40, 0x444466)
      .setInteractive({ useHandCursor: true });

    const menuText = this.add.text(CONFIG.gameWidth / 2, 370, 'MAIN MENU', {
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

    // Celebration particles
    this._spawnCelebration();
  }

  _spawnCelebration() {
    const particles = this.add.particles(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, 'bullet', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 2000,
      quantity: 30,
      tint: [0x44ff44, 0xffff00, 0xff4444, 0x4444ff],
      blending: Phaser.BlendModes.ADD,
      gravityY: 100,
    });
    this.time.delayedCall(2500, () => particles.destroy());
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
