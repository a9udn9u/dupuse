/**
 * MenuScene — Title screen and player count selection.
 *
 * Shows: game title, player count selector (1-4), start button.
 */

import { CONFIG } from '../config/game.config.js';
import { SoundManager } from '../audio/sound.manager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(CONFIG.gameWidth / 2, 80, 'DUPUSE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(CONFIG.gameWidth / 2, 120, 'A Run & Gun Platformer', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Player count selection
    this.playerCount = 1;
    this.selectedSlot = 0;

    const slotLabels = ['1 PLAYER', '2 PLAYERS', '3 PLAYERS', '4 PLAYERS'];
    this.slotButtons = [];

    for (let i = 0; i < 4; i++) {
      const y = 180 + i * 40;
      const bgColor = i === 0 ? 0x3388ff : 0x333333;

      const bg = this.add.rectangle(CONFIG.gameWidth / 2, y, 200, 30, bgColor)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      const text = this.add.text(CONFIG.gameWidth / 2, y, slotLabels[i], {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: i === 0 ? '#ffffff' : '#888888',
      }).setOrigin(0.5).setDepth(11);

      bg.on('pointerover', () => {
        bg.setFillStyle(0x4488ff);
        text.setColor('#ffffff');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(i === this.selectedSlot ? 0x3388ff : 0x333333);
        text.setColor(i === this.selectedSlot ? '#ffffff' : '#888888');
      });
      bg.on('pointerdown', () => {
        this.selectedSlot = i;
        this.playerCount = i + 1;
        // Update all slots
        this.slotButtons.forEach((slot, idx) => {
          slot.bg.setFillStyle(idx === i ? 0x3388ff : 0x333333);
          slot.text.setColor(idx === i ? '#ffffff' : '#888888');
        });
      });

      this.slotButtons.push({ bg, text });
    }

    // Start button
    const startBg = this.add.rectangle(CONFIG.gameWidth / 2, 340, 180, 40, 0x44aa44)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    const startText = this.add.text(CONFIG.gameWidth / 2, 340, 'START', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(11);

    startBg.on('pointerover', () => startBg.setFillStyle(0x55cc55));
    startBg.on('pointerout', () => startBg.setFillStyle(0x44aa44));
    startBg.on('pointerdown', () => this._startGame());

    // Keyboard start
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());

    // Controls info
    const controlsY = 400;
    this.add.text(CONFIG.gameWidth / 2, controlsY, 'CONTROLS:', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5);

    const controlLines = [
      'P1: WASD + Space(Shoot) + F(Jump)',
      'P2: Arrows + Enter(Shoot) + Numpad0(Jump)',
      'P3: IJKL + U(Shoot) + O(Jump)',
      'P4: Numpad + 5(Shoot) + 6(Jump)',
    ];
    controlLines.forEach((line, i) => {
      this.add.text(CONFIG.gameWidth / 2, controlsY + 16 + i * 14, line, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#555555',
      }).setOrigin(0.5);
    });

    // Initialize audio context on first click
    this.input.on('pointerdown', () => {
      SoundManager.play('jump'); // Triggers AudioContext init
    }, { once: true });
  }

  _startGame() {
    SoundManager.play('powerUp');
    this.scene.start('GameScene', {
      playerCount: this.playerCount,
    });
  }
}
