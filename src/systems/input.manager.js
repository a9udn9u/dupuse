/**
 * InputManager — Handles keyboard input for 1-4 players.
 *
 * Key mappings (from CONFIG.input):
 *   P1: WASD + Space (shoot) + F (jump)
 *   P2: Arrows + Enter (shoot) + Numpad0 (jump)
 *   P3: IJKL + U (shoot) + O (jump)
 *   P4: Numpad 1-6
 */

import { CONFIG } from '../config/game.config.js';

export class InputManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} playerCount
   */
  constructor(scene, playerCount) {
    this.scene = scene;
    this.playerCount = playerCount;
    this.keys = {}; // cached key references
    this.state = {}; // current input state per player
    this.prevDown = {}; // previous frame isDown state for edge detection

    this._captureKeys();
    this._resetState();
  }

  _captureKeys() {
    const kb = this.scene.input.keyboard;

    for (let p = 0; p < this.playerCount; p++) {
      const mapping = CONFIG.input[p + 1]; // CONFIG is 1-indexed
      if (!mapping) continue;

      this.keys[p] = {};
      for (const [action, keyName] of Object.entries(mapping)) {
        this.keys[p][action] = kb.addKey(keyName);
      }
    }
  }

  _resetState() {
    for (let p = 0; p < this.playerCount; p++) {
      this.state[p] = {
        left: false,
        right: false,
        up: false,
        down: false,
        shoot: false,
        jump: false,
      };
    }
  }

  /**
   * Call this each frame to update input state.
   */
  update() {
    const kb = this.scene.input.keyboard;

    for (let p = 0; p < this.playerCount; p++) {
      if (!this.keys[p]) continue;

      this.state[p].left   = this._isKeyDown(this.keys[p].left);
      this.state[p].right  = this._isKeyDown(this.keys[p].right);
      this.state[p].up     = this._isKeyDown(this.keys[p].up);
      this.state[p].down   = this._isKeyDown(this.keys[p].down);
      this.state[p].shoot  = this._isDown(this.keys[p].shoot);
      this.state[p].jump   = this._wasJustPressed(this.keys[p].jump);
    }
  }

  _isKeyDown(key) {
    return key && key.isDown;
  }

  _isDown(key) {
    return key && key.isDown;
  }

  _wasJustPressed(key) {
    if (!key) return false;
    const isDown = key.isDown;
    // Use the key object itself as the map key for previous state tracking
    if (!this._prevDown) this._prevDown = {};
    const wasDown = this._prevDown[key] || false;
    const justPressed = isDown && !wasDown;
    this._prevDown[key] = isDown;
    return justPressed;
  }

  /**
   * Get the current input state for a player.
   * @param {number} playerNum - 0-based player index
   * @returns {object} Input state object
   */
  getInput(playerNum) {
    if (playerNum < 0 || playerNum >= this.playerCount) return null;
    return this.state[playerNum];
  }

  /**
   * Check if any player is pressing a key (for global actions like pause).
   */
  isAnyPausePressed() {
    return this.scene.input.keyboard.addKey('ESC').isDown;
  }
}
