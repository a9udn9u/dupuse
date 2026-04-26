/**
 * Central game configuration.
 * All tunable values live here. Change these to adjust gameplay.
 */

export const CONFIG = {
  // --- Asset mode ---
  // false = procedural generation, true = load from assets/sprites/ and assets/audio/real/
  useRealAssets: false,

  // --- Display ---
  gameWidth: 800,
  gameHeight: 450,
  fps: 60,

  // --- Physics ---
  gravity: { x: 0, y: 600 },
  worldBounds: { left: 0, right: 6400, top: 0, bottom: 450 },

  // --- Player ---
  playerMaxHP: 3,          // configurable hit count before death
  playerSpeed: 160,
  playerCrouchSpeed: 60,
  playerJumpVelocity: -520,
  playerClimbSpeed: 120,
  playerInvincibilityDuration: 1500, // ms after being hit
  playerShootCooldown: 180,  // ms between shots
  playerBulletsPerShot: 1,
  playerBulletSpeed: 500,
  playerBulletDamage: 1,
  playerColors: [
    { body: 0x3388ff, accent: 0x2266cc }, // P1 - Blue
    { body: 0xff4444, accent: 0xcc2222 }, // P2 - Red
    { body: 0x44cc44, accent: 0x228822 }, // P3 - Green
    { body: 0xffcc00, accent: 0xcc9900 }, // P4 - Yellow
  ],

  // --- Weapons ---
  weapons: {
    normal: { name: 'Normal', fireRate: 180, damage: 1, bulletSpeed: 500, bulletCount: 1, spread: 0, color: 0xffffff, piercing: false },
    spread: { name: 'S-Fire', fireRate: 350, damage: 1, bulletSpeed: 450, bulletCount: 5, spread: 0.35, color: 0xff8800, piercing: false },
    laser:  { name: 'Laser',  fireRate: 250, damage: 2, bulletSpeed: 800, bulletCount: 1, spread: 0, color: 0x00ffff, piercing: true },
    flame:  { name: 'Flame',  fireRate: 300,  damage: 2, bulletSpeed: 250, bulletCount: 1, spread: 0.15, color: 0xff4400, piercing: false, lifetime: 2000 },
  },
  powerUpDropChance: 0.35,

  // --- Enemies ---
  enemies: {
    soldier: { hp: 3, speed: 60, shootInterval: 2000, damage: 1, bulletSpeed: 250, score: 100, color: 0x88aa44 },
    turret:  { hp: 8, speed: 0,  shootInterval: 4800, damage: 1, bulletSpeed: 300, score: 200, color: 0x888888 },
    helicopter: { hp: 6, speed: 80, shootInterval: 2500, damage: 1, bulletSpeed: 200, score: 300, color: 0x666688 },
  },

  // --- Boss ---
  boss: {
    hp: 80,
    speed: 50,
    phase2Threshold: 0.6,  // HP fraction to trigger phase 2
    phase3Threshold: 0.3,  // HP fraction to trigger phase 3
    shootInterval: 800,
    missileInterval: 3000,
    groundSlamInterval: 5000,
    damage: 1,
    bulletSpeed: 300,
    color: 0x884444,
  },

  // --- Destructible tiles ---
  destructible: {
    hp: 2, // hits to destroy
    debrisParticles: 8,
  },

  // --- Input mappings (1-4 players) ---
  input: {
    1: { left: 'a', right: 'd', up: 'w', down: 's', shoot: 'j', jump: 'k', crouch: 's' },
    2: { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown', shoot: 'enter', jump: 'numpad0', crouch: 'arrowdown' },
    3: { left: 'j', right: 'l', up: 'i', down: 'k', shoot: 'u', jump: 'o', crouch: 'k' },
    4: { left: '1', right: '3', up: '4', down: '2', shoot: '5', jump: '6', crouch: '2' },
  },

  // --- Particles ---
  particles: {
    explosion: { count: 20, speed: 200, lifetime: 400, colors: [0xff4400, 0xff8800, 0xffcc00, 0xffffff] },
    muzzleFlash: { count: 5, speed: 100, lifetime: 80, colors: [0xffff00, 0xffffff] },
    debris: { count: 8, speed: 150, lifetime: 500, colors: [0x886644, 0x664422, 0x997755] },
    powerUpGlow: { count: 10, speed: 60, lifetime: 600, colors: [0x00ff00, 0x88ff00, 0xffff00] },
  },

  // --- Screen shake ---
  screenShake: {
    playerHit: { intensity: 100, duration: 150 },
    explosion: { intensity: 200, duration: 200 },
    bossAttack: { intensity: 300, duration: 300 },
  },

  // --- Level ---
  level: {
    tileSize: 32,
    columns: 200, // 6400px wide
    rows: 15,     // 480px tall
  },
};
