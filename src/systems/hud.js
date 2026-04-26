/**
 * HUD — Heads-up display.
 *
 * Shows: player lives, weapon indicator, score, timer,
 * boss health bar, player slot indicators, pause overlay.
 */

import { CONFIG } from '../config/game.config.js';

export class HUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} playerCount
   */
  constructor(scene, playerCount) {
    this.scene = scene;
    this.playerCount = playerCount;
    this.score = 0;
    this.startTime = 0;

    // UI containers
    this.scoreText = null;
    this.timerText = null;
    this.playerHUDs = [];
    this.bossBarContainer = null;
    this.bossBarFill = null;
    this.pauseOverlay = null;
    this.pauseText = null;
  }

  create() {
    this.startTime = this.scene.time.now;
    this._createScore();
    this._createTimer();
    this._createPlayerHUDs();
    this._createBossBar();
    this._createPauseOverlay();
  }

  update() {
    this._updateTimer();
  }

  // ─── Score ───────────────────────────────────────────────────────────

  _createScore() {
    this.scoreText = this.scene.add.text(10, 10, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setDepth(100).setScrollFactor(0);
  }

  updateScore(score) {
    this.score = score;
    if (this.scoreText) {
      this.scoreText.setText(`SCORE: ${this.score}`);
    }
  }

  // ─── Timer ───────────────────────────────────────────────────────────

  _createTimer() {
    this.timerText = this.scene.add.text(
      CONFIG.gameWidth - 10, 10, '0:00', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);
  }

  _updateTimer() {
    if (!this.timerText) return;
    const elapsed = Math.floor((this.scene.time.now - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
  }

  // ─── Player HUDs ─────────────────────────────────────────────────────

  _createPlayerHUDs() {
    const slotWidth = 120;
    const startX = (CONFIG.gameWidth - this.playerCount * slotWidth) / 2;

    for (let i = 0; i < this.playerCount; i++) {
      const container = this.scene.add.container(startX + i * slotWidth, 18);
      container.setDepth(100).setScrollFactor(0);

      // Player number
      const label = this.scene.add.text(0, -12, `${i + 1}P`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#' + CONFIG.playerColors[i].body.toString(16).padStart(6, '0'),
      });

      // Hearts container
      const hearts = [];
      for (let h = 0; h < CONFIG.playerMaxHP; h++) {
        const heart = this.scene.add.image(h * 26 - (CONFIG.playerMaxHP * 26) / 2 + 13, 4, 'heart');
        heart.setDisplaySize(20, 20);
        hearts.push(heart);
      }

      // Weapon icon
      const weaponIcon = this.scene.add.image(slotWidth - 20, 4, 'weapon_icon', 0);
      weaponIcon.setDisplaySize(24, 24);

      container.add([label, ...hearts, weaponIcon]);
      this.scene.add.existing(container);

      this.playerHUDs.push({ container, label, hearts, weaponIcon, playerNum: i });
    }
  }

  updatePlayers(players) {
    this.playerHUDs.forEach((hud, i) => {
      const player = players[i];
      if (!player) return;

      // Update hearts
      hud.hearts.forEach((heart, h) => {
        if (h < player.hp) {
          heart.setTexture('heart');
          heart.setAlpha(1);
        } else {
          heart.setTexture('heart_empty');
          heart.setAlpha(0.6);
        }
      });

      // Update weapon icon
      const weaponFrames = { normal: 0, spread: 1, laser: 2, flame: 3 };
      const frame = weaponFrames[player.currentWeapon] || 0;
      hud.weaponIcon.setFrame(frame);

      // Show/hide based on alive state
      hud.container.setVisible(player.alive);
      hud.container.setAlpha(player.alive ? 1 : 0.3);
    });
  }

  // ─── Boss Health Bar ─────────────────────────────────────────────────

  _createBossBar() {
    this.bossBarContainer = this.scene.add.container(CONFIG.gameWidth / 2, 50);
    this.bossBarContainer.setDepth(100).setScrollFactor(0);
    this.bossBarContainer.setVisible(false);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 300, 16, 0x333333);
    // Border
    const border = this.scene.add.rectangle(0, 0, 304, 20, 0x000000);
    border.setStrokeStyle(2, 0xffffff);
    // Fill
    this.bossBarFill = this.scene.add.rectangle(-148, 0, 296, 12, 0xff0000);
    // Label
    const label = this.scene.add.text(0, -16, 'BOSS', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ff4444',
    });

    this.bossBarContainer.add([border, bg, this.bossBarFill, label]);
    this.scene.add.existing(this.bossBarContainer);
  }

  showBossHealthBar(boss) {
    this.boss = boss;
    this.bossBarContainer.setVisible(true);
  }

  hideBossHealthBar() {
    this.bossBarContainer.setVisible(false);
  }

  flashBossBar() {
    if (!this.bossBarFill) return;
    this.bossBarFill.setFillStyle(0xffffff);
    this.scene.time.delayedCall(80, () => {
      // Next update() cycle will restore correct color
    });
  }

  update() {
    if (this.boss && this.boss.alive && this.bossBarContainer.visible) {
      const fraction = this.boss.getHPFraction();
      this.bossBarFill.setScale(fraction, 1);
      this.bossBarFill.x = -148 + (1 - fraction) * 148;

      // Color changes with HP
      if (fraction > 0.6) {
        this.bossBarFill.setFillStyle(0x00ff00);
      } else if (fraction > 0.3) {
        this.bossBarFill.setFillStyle(0xffff00);
      } else {
        this.bossBarFill.setFillStyle(0xff0000);
      }
    }
  }

  // ─── Pause ───────────────────────────────────────────────────────────

  _createPauseOverlay() {
    this.pauseOverlay = this.scene.add.rectangle(
      CONFIG.gameWidth / 2, CONFIG.gameHeight / 2,
      CONFIG.gameWidth, CONFIG.gameHeight,
      0x000000, 0.7
    ).setDepth(200).setScrollFactor(0).setVisible(false);

    this.pauseText = this.scene.add.text(
      CONFIG.gameWidth / 2, CONFIG.gameHeight / 2,
      'PAUSED', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setVisible(false);
  }

  showPause() {
    this.pauseOverlay.setVisible(true);
    this.pauseText.setVisible(true);
  }

  hidePause() {
    this.pauseOverlay.setVisible(false);
    this.pauseText.setVisible(false);
  }
}
