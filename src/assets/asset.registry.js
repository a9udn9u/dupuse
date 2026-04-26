/**
 * AssetRegistry — Central manifest of all required game assets.
 *
 * Every sprite, texture, and animation key is defined here.
 * Game code references assets by key only.
 *
 * The registry checks CONFIG.useRealAssets:
 *   true  → loads PNG files from assets/sprites/
 *   false → delegates to ProceduralAssetGenerator
 */

import { CONFIG } from '../config/game.config.js';

// ─── Sprite key manifest ───────────────────────────────────────────────
// Each entry: { key, frames?: { key: { w, h } } }
// For real assets, key maps to assets/sprites/<key>.png

export const ASSET_MANIFEST = {
  // --- Player sprites (generated as sprite sheets) ---
  player: {
    key: 'player',
    type: 'spritesheet',
    frameWidth: 32,
    frameHeight: 48,
    // Frames: [idle0, idle1, run0, run1, run2, run3, jump, crouch, climb0, climb1, shoot0, shoot1, death]
    // × 4 directions (front, back, left, right) = 52 frames per direction set
    // Layout: direction rows (0=front, 1=back, 2=left, 3=right) × 13 animation frames
    frames: 52, // 13 frames × 4 directions
  },

  // --- Enemy sprites ---
  enemySoldier: {
    key: 'enemy_soldier',
    type: 'spritesheet',
    frameWidth: 32,
    frameHeight: 48,
    frames: 8, // idle0, idle1, walk0, walk1, shoot, death0, death1, death2
  },
  enemyTurret: {
    key: 'enemy_turret',
    type: 'spritesheet',
    frameWidth: 48,
    frameHeight: 48,
    frames: 4, // idle0, idle1, shoot, death
  },
  enemyHelicopter: {
    key: 'enemy_helicopter',
    type: 'spritesheet',
    frameWidth: 64,
    frameHeight: 48,
    frames: 6, // fly0, fly1, fly2, shoot, death0, death1
  },

  // --- Boss ---
  boss: {
    key: 'boss',
    type: 'spritesheet',
    frameWidth: 96,
    frameHeight: 96,
    frames: 12, // walk0, walk1, walk2, shoot0, shoot1, missile, slam0, slam1, slam2, death0, death1, death2
  },

  // --- Power-ups ---
  powerUp: {
    key: 'powerup',
    type: 'spritesheet',
    frameWidth: 32,
    frameHeight: 32,
    frames: 8, // normal, spread, laser, flame, life, speed, shield, multi (each 1 frame, 2 states: glow on/off)
  },

  // --- Tiles (individual frames in a tileset) ---
  tileset: {
    key: 'tileset',
    type: 'spritesheet',
    frameWidth: 32,
    frameHeight: 32,
    // Frame index mapping:
    // 0: ground, 1: ground_top, 2: platform, 3: platform_left, 4: platform_right
    // 5: ladder, 6: ladder_top, 7: destructible, 8: destructible_damaged, 9: destructible_gone
    // 10: wall, 11: wall_top, 12: spike, 13: spike_left, 14: spike_right, 15: empty
    frames: 16,
  },

  // --- Projectiles ---
  bullet: { key: 'bullet', type: 'single', width: 8, height: 8 },
  enemyBullet: { key: 'enemy_bullet', type: 'single', width: 10, height: 10 },
  missile: { key: 'missile', type: 'single', width: 12, height: 16 },
  flame: { key: 'flame', type: 'single', width: 16, height: 16 },

  // --- UI ---
  heart: { key: 'heart', type: 'single', width: 24, height: 24 },
  heartEmpty: { key: 'heart_empty', type: 'single', width: 24, height: 24 },
  weaponIcon: { key: 'weapon_icon', type: 'spritesheet', frameWidth: 32, frameHeight: 32, frames: 4 }, // normal, spread, laser, flame

  // --- Background ---
  bgLayer1: { key: 'bg_layer1', type: 'tile', width: 32, height: 32 },
  bgLayer2: { key: 'bg_layer2', type: 'tile', width: 32, height: 32 },
  bgLayer3: { key: 'bg_layer3', type: 'tile', width: 32, height: 32 },
};

// ─── Power-up type enum ────────────────────────────────────────────────
export const POWERUP_TYPES = {
  NORMAL: 'normal',
  SPREAD: 'spread',
  LASER: 'laser',
  FLAME: 'flame',
  LIFE: 'life',
};

// ─── Tile type enum ────────────────────────────────────────────────────
export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  GROUND_TOP: 2,
  PLATFORM: 3,
  PLATFORM_LEFT: 4,
  PLATFORM_RIGHT: 5,
  LADDER: 6,
  LADDER_TOP: 7,
  DESTRUCTIBLE: 8,
  DESTRUCTIBLE_DAMAGED: 9,
  DESTRUCTIBLE_GONE: 10,
  WALL: 11,
  WALL_TOP: 12,
  SPIKE: 13,
  SPIKE_LEFT: 14,
  SPIKE_RIGHT: 15,
};

// ─── Asset Registry class ──────────────────────────────────────────────
export class AssetRegistry {
  /**
   * Load all assets into the Phaser scene.
   * @param {Phaser.Scene} scene - The Phaser scene (BootScene)
   */
  static loadAll(scene) {
    if (CONFIG.useRealAssets) {
      this._loadRealAssets(scene);
    } else {
      this._loadProceduralAssets(scene);
    }
  }

  static _loadRealAssets(scene) {
    const { load } = scene;
    for (const [id, asset] of Object.entries(ASSET_MANIFEST)) {
      const path = `assets/sprites/${asset.key}.png`;
      if (asset.type === 'spritesheet') {
        load.spritesheet(asset.key, path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
        });
      } else if (asset.type === 'single' || asset.type === 'tile') {
        load.image(asset.key, path);
      }
    }
  }

  static _loadProceduralAssets(scene) {
    // Import the procedural generator dynamically
    import('./../assets/procedural.generator.js').then(module => {
      const generator = module.ProceduralAssetGenerator;
      generator.generateAll(scene);
    });
  }

  /**
   * Get the real asset path for a manifest entry (for file existence checks).
   */
  static getRealPath(assetKey) {
    const asset = ASSET_MANIFEST[assetKey];
    if (!asset) return null;
    return `assets/sprites/${asset.key}.png`;
  }

  /**
   * Check if a real asset file exists at the expected path.
   * Returns a Promise<boolean>.
   */
  static async checkRealAssetExists(assetKey) {
    const path = this.getRealPath(assetKey);
    if (!path) return false;
    try {
      const resp = await fetch(path, { method: 'HEAD' });
      return resp.ok;
    } catch {
      return false;
    }
  }
}
