/**
 * SoundManager — Central audio interface.
 *
 * Game code calls SoundManager.play(key) or SoundManager.playBGM(key).
 * The manager checks CONFIG.useRealAssets:
 *   true  → loads and plays files from assets/audio/real/
 *   false → delegates to AudioSynthesizer (Web Audio API)
 *
 * All game code is source-agnostic.
 */

import { CONFIG } from '../config/game.config.js';

// ─── Sound key manifest ────────────────────────────────────────────────
export const SOUND_MANIFEST = {
  // SFX
  gunshot:       { key: 'gunshot',       realPath: 'assets/audio/real/gunshot.wav' },
  explosion:     { key: 'explosion',     realPath: 'assets/audio/real/explosion.wav' },
  powerUp:       { key: 'powerup',       realPath: 'assets/audio/real/powerup.wav' },
  jump:          { key: 'jump',          realPath: 'assets/audio/real/jump.wav' },
  hit:           { key: 'hit',           realPath: 'assets/audio/real/hit.wav' },
  death:         { key: 'death',         realPath: 'assets/audio/real/death.wav' },
  bossRoar:      { key: 'bossRoar',      realPath: 'assets/audio/real/bossRoar.wav' },
  bossExplode:   { key: 'bossExplode',   realPath: 'assets/audio/real/bossExplode.wav' },
  ladder:        { key: 'ladder',        realPath: 'assets/audio/real/ladder.wav' },
  destruct:      { key: 'destruct',      realPath: 'assets/audio/real/destruct.wav' },
  missile:       { key: 'missile',       realPath: 'assets/audio/real/missile.wav' },
  flame:         { key: 'flame',         realPath: 'assets/audio/real/flame.wav' },
  laser:         { key: 'laser',         realPath: 'assets/audio/real/laser.wav' },

  // BGM
  bgmStage1:     { key: 'bgm_stage1',    realPath: 'assets/audio/real/bgm_stage1.ogg', loop: true },
  bgmBoss:       { key: 'bgm_boss',      realPath: 'assets/audio/real/bgm_boss.ogg', loop: true },
  bgmVictory:    { key: 'bgm_victory',   realPath: 'assets/audio/real/bgm_victory.ogg', loop: true },
  bgmGameOver:   { key: 'bgm_gameover',  realPath: 'assets/audio/real/bgm_gameover.ogg', loop: true },
};

// ─── SoundManager class ────────────────────────────────────────────────
export class SoundManager {
  static initialized = false;
  static synth = null;
  static phaserSound = null; // reference to Phaser sound manager
  static bgmKey = null;
  static bgmInstance = null;

  /**
   * Initialize the SoundManager.
   * @param {Phaser.Scene} scene - The BootScene
   */
  static init(scene) {
    if (this.initialized) return;
    this.initialized = true;
    this.phaserSound = scene.sound;

    if (CONFIG.useRealAssets) {
      this._loadRealAudio(scene);
    } else {
      // Import synthesizer lazily
      import('./audio.synthesizer.js').then(module => {
        this.synth = new module.AudioSynthesizer();
      });
    }
  }

  static _loadRealAudio(scene) {
    const { load } = scene;
    for (const [id, sound] of Object.entries(SOUND_MANIFEST)) {
      const ext = sound.realPath.split('.').pop();
      if (ext === 'ogg' || sound.loop) {
        load.audio(sound.key, sound.realPath);
      } else {
        load.audio(sound.key, sound.realPath);
      }
    }
  }

  /**
   * Play a sound effect by key.
   * @param {string} key - Sound key (e.g., 'gunshot', 'explosion')
   * @param {object} options - Optional Phaser sound config
   */
  static play(key, options = {}) {
    if (CONFIG.useRealAssets && this.phaserSound) {
      this.phaserSound.play(key, options);
    } else if (this.synth) {
      this.synth.play(key, options);
    }
  }

  /**
   * Play background music by key.
   * @param {string} key - BGM key (e.g., 'bgmStage1', 'bgmBoss')
   */
  static playBGM(key) {
    // Stop current BGM
    this.stopBGM();

    if (CONFIG.useRealAssets && this.phaserSound) {
      this.bgmInstance = this.phaserSound.play(key, { loop: true, volume: 0.4 });
      this.bgmKey = key;
    } else if (this.synth) {
      this.synth.playBGM(key);
      this.bgmKey = key;
    }
  }

  /**
   * Stop current background music.
   */
  static stopBGM() {
    if (CONFIG.useRealAssets && this.bgmInstance) {
      this.bgmInstance.stop();
      this.bgmInstance = null;
    } else if (this.synth) {
      this.synth.stopBGM();
    }
    this.bgmKey = null;
  }

  /**
   * Set global volume.
   * @param {number} volume - 0.0 to 1.0
   */
  static setVolume(volume) {
    if (CONFIG.useRealAssets && this.phaserSound) {
      this.phaserSound.setVolume(volume);
    } else if (this.synth) {
      this.synth.setVolume(volume);
    }
  }

  /**
   * Mute/unmute all audio.
   * @param {boolean} mute
   */
  static setMute(mute) {
    if (CONFIG.useRealAssets && this.phaserSound) {
      this.phaserSound.setMute(mute);
    } else if (this.synth) {
      this.synth.setMute(mute);
    }
  }
}
