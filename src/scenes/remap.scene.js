/**
 * RemapScene — Key remapping UI.
 *
 * Allows players to click on any action and press a new key to rebind it.
 * Changes are saved to localStorage and persist across sessions.
 */

import { CONFIG } from '../config/game.config.js';
import { SoundManager } from '../audio/sound.manager.js';
import { getEffectiveMapping, saveKeybindings, loadKeybindings } from '../systems/input.manager.js';

// All actions per player (in display order)
const ACTIONS = ['left', 'right', 'up', 'down', 'shoot', 'jump'];

// Human-readable labels for actions
const ACTION_LABELS = {
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down',
  shoot: 'Shoot',
  jump: 'Jump',
};

// Player color accents
const PLAYER_COLORS = ['#3388ff', '#ff4444', '#44cc44', '#ffcc00'];

/**
 * Convert a Phaser key name to a friendly display string.
 */
function friendlyKeyName(keyName) {
  const map = {
    ' ': 'Space',
    'space': 'Space',
    'enter': 'Enter',
    'tab': 'Tab',
    'esc': 'Esc',
    'shift': 'Shift',
    'ctrl': 'Ctrl',
    'alt': 'Alt',
    'up': '↑',
    'down': '↓',
    'left': '←',
    'right': '→',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'numpad0': 'Num0',
    'numpad1': 'Num1',
    'numpad2': 'Num2',
    'numpad3': 'Num3',
    'numpad4': 'Num4',
    'numpad5': 'Num5',
    'numpad6': 'Num6',
    'numpad7': 'Num7',
    'numpad8': 'Num8',
    'numpad9': 'Num9',
    'numpad_add': 'Num+',
    'numpad_subtract': 'Num-',
    'numpad_enter': 'NumEnter',
    'numpad_decimal': 'Num.',
    'comma': ',',
    'period': '.',
    'minus': '-',
    'plus': '+',
    'openbracket': '[',
    'closebracket': ']',
    'backslash': '\\',
    'semicolon': ';',
    'quote': "'",
    'slash': '/',
    'backquote': '`',
    'intlbackslash': '\\',
  };
  if (map[keyName.toLowerCase()]) return map[keyName.toLowerCase()];
  // Single letters/numbers: uppercase
  if (keyName.length === 1) return keyName.toUpperCase();
  return keyName;
}

/**
 * Convert a DOM KeyboardEvent to a Phaser-compatible key name string.
 */
function domEventToKeyName(event) {
  const key = event.key;
  const code = event.code;

  // Letters
  if (key.length === 1 && key >= 'a' && key <= 'z') return key;
  if (key.length === 1 && key >= 'A' && key <= 'Z') return key.toLowerCase();

  // Digits (regular number row)
  if (key.length === 1 && key >= '0' && key <= '9') return key;

  // Numpad detection via event.code
  if (code && code.startsWith('Numpad')) {
    const numpadMap = {
      'Numpad0': 'numpad0',
      'Numpad1': 'numpad1',
      'Numpad2': 'numpad2',
      'Numpad3': 'numpad3',
      'Numpad4': 'numpad4',
      'Numpad5': 'numpad5',
      'Numpad6': 'numpad6',
      'Numpad7': 'numpad7',
      'Numpad8': 'numpad8',
      'Numpad9': 'numpad9',
      'NumpadAdd': 'numpad_add',
      'NumpadSubtract': 'numpad_subtract',
      'NumpadEnter': 'numpad_enter',
      'NumpadDecimal': 'numpad_decimal',
    };
    if (numpadMap[code]) return numpadMap[code];
  }

  // Named keys
  const namedMap = {
    ' ': 'space',
    'Space': 'space',
    'Enter': 'enter',
    'Tab': 'tab',
    'Escape': 'esc',
    'Shift': 'shift',
    'Control': 'ctrl',
    'Alt': 'alt',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    ',': 'comma',
    '.': 'period',
    '-': 'minus',
    '=': 'plus',
    '[': 'openbracket',
    ']': 'closebracket',
    '\\': 'backslash',
    ';': 'semicolon',
    "'": 'quote',
    '/': 'slash',
    '`': 'backquote',
    'Meta': 'meta',
    'CapsLock': 'capslock',
    'Backspace': 'backspace',
    'Delete': 'delete',
    'Insert': 'insert',
    'Home': 'home',
    'End': 'end',
    'PageUp': 'pageup',
    'PageDown': 'pagedown',
  };
  if (namedMap[key] !== undefined) return namedMap[key];

  // Fallback: try the code after normalizing
  if (code) {
    const lower = code.toLowerCase().replace(/^key/, '');
    if (lower.length <= 2) return lower;
    return code.toLowerCase();
  }
  return key;
}

export class RemapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RemapScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.listening = null; // { playerNum, action } while waiting for a keypress
    this.bindingDirty = {}; // tracks changed bindings

    // Load saved bindings as starting point (or empty object)
    this.customBindings = loadKeybindings() || {};

    // ─── Title ────────────────────────────────────────────────────────
    this.add.text(CONFIG.gameWidth / 2, 24, 'KEY BINDINGS', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(CONFIG.gameWidth / 2, 48, 'Click a binding, then press the new key', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // ─── Binding UI per player ────────────────────────────────────────
    this.bindingWidgets = {}; // { "playerNum:action": { bg, label } }

    const startX = 60;
    const playerSpacing = 180;
    const actionStartY = 80;
    const actionSpacing = 34;

    for (let p = 0; p < 4; p++) {
      const playerNum = p + 1;
      const px = startX + p * playerSpacing;

      // Player heading
      this.add.text(px + 70, actionStartY - 4, `P${playerNum}`, {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: PLAYER_COLORS[p],
      }).setOrigin(0.5, 0);

      ACTIONS.forEach((action, ai) => {
        const ay = actionStartY + 20 + ai * actionSpacing;

        // Current effective key for display
        const currentKey = this._getCurrentKey(playerNum, action);

        // Background rectangle (clickable)
        const bg = this.add.rectangle(px + 70, ay, 150, 28, 0x333333)
          .setStrokeStyle(1, 0x555555)
          .setInteractive({ useHandCursor: true })
          .setDepth(10);

        // Action label
        const actionLabel = this.add.text(px + 5, ay, ACTION_LABELS[action], {
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#aaaaaa',
        }).setOrigin(0, 0.5).setDepth(11);

        // Key name label
        const keyLabel = this.add.text(px + 140, ay, friendlyKeyName(currentKey), {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#ffffff',
        }).setOrigin(1, 0.5).setDepth(11);

        // Click handler
        bg.on('pointerdown', () => {
          this._startListening(playerNum, action, bg, keyLabel);
        });

        // Hover effect
        bg.on('pointerover', () => {
          if (!this.listening) bg.setFillStyle(0x444444);
        });
        bg.on('pointerout', () => {
          if (!this.listening || this.listening.playerNum !== playerNum || this.listening.action !== action) {
            bg.setFillStyle(0x333333);
          }
        });

        const key = `${playerNum}:${action}`;
        this.bindingWidgets[key] = { bg, keyLabel };
      });
    }

    // ─── Reset button ─────────────────────────────────────────────────
    const resetBg = this.add.rectangle(CONFIG.gameWidth / 2, 380, 180, 36, 0x884444)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    this.add.text(CONFIG.gameWidth / 2, 380, 'RESET TO DEFAULTS', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(11);

    resetBg.on('pointerdown', () => {
      this.customBindings = {};
      this._refreshAllWidgets();
      saveKeybindings(this.customBindings);
      SoundManager.play('explosion');
    });
    resetBg.on('pointerover', () => resetBg.setFillStyle(0xaa5555));
    resetBg.on('pointerout', () => resetBg.setFillStyle(0x884444));

    // ─── Save & Back button ───────────────────────────────────────────
    const saveBg = this.add.rectangle(CONFIG.gameWidth / 2, 422, 180, 36, 0x44aa44)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    this.add.text(CONFIG.gameWidth / 2, 422, 'SAVE & BACK', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(11);

    saveBg.on('pointerdown', () => {
      saveKeybindings(this.customBindings);
      SoundManager.play('powerUp');
      this.scene.start('MenuScene');
    });
    saveBg.on('pointerover', () => saveBg.setFillStyle(0x55cc55));
    saveBg.on('pointerout', () => saveBg.setFillStyle(0x44aa44));

    // ─── Keyboard handler for remapping ───────────────────────────────
    this._keyHandler = (event) => {
      if (!this.listening) return;

      const { playerNum, action, bg, keyLabel } = this.listening;
      const keyName = domEventToKeyName(event);

      // Don't allow remapping to ESC (used for pause)
      if (keyName === 'esc') return;

      // Store the custom binding
      const pKey = String(playerNum);
      if (!this.customBindings[pKey]) {
        this.customBindings[pKey] = {};
      }
      this.customBindings[pKey][action] = keyName;

      // Update the label
      keyLabel.setText(friendlyKeyName(keyName));

      // Restore bg color
      bg.setFillStyle(0x333333);

      // Clear listening state
      this.listening = null;
    };

    this.input.keyboard.on('keydown', this._keyHandler);

    // Initialize audio context
    this.input.on('pointerdown', () => {
      SoundManager.play('jump');
    }, { once: true });
  }

  /**
   * Get the current effective key name for a player action.
   * Checks in-memory customBindings first (unsaved changes), then localStorage, then defaults.
   */
  _getCurrentKey(playerNum, action) {
    // 1. In-memory unsaved changes (highest priority)
    const pKey = String(playerNum);
    if (this.customBindings[pKey] && this.customBindings[pKey][action] !== undefined) {
      return this.customBindings[pKey][action];
    }
    // 2. Saved bindings from localStorage
    const mapping = getEffectiveMapping(playerNum);
    if (mapping && mapping[action] !== undefined) return mapping[action];
    // 3. Default from config
    const defaults = CONFIG.input[playerNum];
    if (defaults && defaults[action] !== undefined) return defaults[action];
    return '';
  }

  /**
   * Start listening for a keypress to rebind the given action.
   */
  _startListening(playerNum, action, bg, keyLabel) {
    // Clear any previous listening state
    if (this.listening) {
      this.listening.bg.setFillStyle(0x333333);
    }

    this.listening = { playerNum, action, bg, keyLabel };
    bg.setFillStyle(0x226622);
    keyLabel.setText('...');
  }

  /**
   * Refresh all displayed key labels after reset.
   */
  _refreshAllWidgets() {
    for (const [key, widget] of Object.entries(this.bindingWidgets)) {
      const [pStr, action] = key.split(':');
      const playerNum = parseInt(pStr, 10);
      const currentKey = this._getCurrentKey(playerNum, action);
      widget.keyLabel.setText(friendlyKeyName(currentKey));
      widget.bg.setFillStyle(0x333333);
    }
  }

  shutdown() {
    if (this._keyHandler && this.input && this.input.keyboard) {
      this.input.keyboard.off('keydown', this._keyHandler);
    }
  }
}
