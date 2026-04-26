/**
 * Level 1 Data — Jungle Fortress
 *
 * Level format:
 * - layers: array of tile layers (background, ground, platforms, ladders, destructible)
 * - spawns: enemy spawn points
 * - powerUps: power-up placements
 * - bossTrigger: x-coordinate that triggers the boss
 * - playerStart: initial player position
 * - bgColors: parallax background colors
 */

import { TILE_TYPES } from '../assets/asset.registry.js';

export const LEVEL_1 = {
  id: 'level1',
  name: 'Jungle Fortress',
  playerStart: { x: 100, y: 350 },
  bossTriggerX: 5800,
  bgColors: ['#1a1a2e', '#16213e', '#0f3460'],

  // Tile layers: each is a 2D array [row][col] of tile type IDs
  // We define it as a series of segments for readability
  ground: [
    // Solid ground from start to end with some gaps
    { startCol: 0, endCol: 30, row: 14 },
    { startCol: 33, endCol: 60, row: 14 },
    { startCol: 63, endCol: 100, row: 14 },
    { startCol: 103, endCol: 140, row: 14 },
    { startCol: 143, endCol: 180, row: 14 },
    { startCol: 183, endCol: 200, row: 14 },
  ],

  platforms: [
    // Floating platforms
    { x: 200, y: 320, width: 96 },
    { x: 400, y: 260, width: 64 },
    { x: 600, y: 300, width: 96 },
    { x: 800, y: 240, width: 128 },
    { x: 1000, y: 280, width: 64 },
    { x: 1200, y: 220, width: 96 },
    { x: 1400, y: 300, width: 64 },
    { x: 1600, y: 260, width: 128 },
    { x: 1800, y: 200, width: 96 },
    { x: 2000, y: 280, width: 64 },
    { x: 2200, y: 240, width: 128 },
    { x: 2400, y: 300, width: 96 },
    { x: 2600, y: 220, width: 64 },
    { x: 2800, y: 260, width: 128 },
    { x: 3000, y: 200, width: 96 },
    { x: 3200, y: 280, width: 64 },
    { x: 3400, y: 240, width: 128 },
    { x: 3600, y: 300, width: 96 },
    { x: 3800, y: 220, width: 64 },
    { x: 4000, y: 260, width: 128 },
    { x: 4200, y: 200, width: 96 },
    { x: 4400, y: 280, width: 64 },
    { x: 4600, y: 240, width: 128 },
    { x: 4800, y: 300, width: 96 },
    { x: 5000, y: 220, width: 64 },
    { x: 5200, y: 260, width: 128 },
    { x: 5400, y: 200, width: 96 },
  ],

  ladders: [
    { x: 350, y: 160, height: 160 },
    { x: 700, y: 120, height: 200 },
    { x: 1100, y: 160, height: 160 },
    { x: 1500, y: 120, height: 200 },
    { x: 1900, y: 160, height: 160 },
    { x: 2300, y: 120, height: 200 },
    { x: 2700, y: 160, height: 160 },
    { x: 3100, y: 120, height: 200 },
    { x: 3500, y: 160, height: 160 },
    { x: 3900, y: 120, height: 200 },
    { x: 4300, y: 160, height: 160 },
    { x: 4700, y: 120, height: 200 },
    { x: 5100, y: 160, height: 160 },
    { x: 5500, y: 120, height: 200 },
  ],

  destructibles: [
    { x: 250, y: 384, width: 32, height: 32 },
    { x: 450, y: 384, width: 64, height: 32 },
    { x: 650, y: 352, width: 32, height: 32 },
    { x: 900, y: 384, width: 32, height: 64 },
    { x: 1100, y: 384, width: 64, height: 32 },
    { x: 1350, y: 352, width: 32, height: 32 },
    { x: 1550, y: 384, width: 32, height: 64 },
    { x: 1750, y: 384, width: 64, height: 32 },
    { x: 2050, y: 352, width: 32, height: 32 },
    { x: 2250, y: 384, width: 32, height: 64 },
    { x: 2550, y: 384, width: 64, height: 32 },
    { x: 2750, y: 352, width: 32, height: 32 },
    { x: 3050, y: 384, width: 32, height: 64 },
    { x: 3250, y: 384, width: 64, height: 32 },
    { x: 3550, y: 352, width: 32, height: 32 },
    { x: 3750, y: 384, width: 32, height: 64 },
    { x: 4050, y: 384, width: 64, height: 32 },
    { x: 4250, y: 352, width: 32, height: 32 },
    { x: 4550, y: 384, width: 32, height: 64 },
    { x: 4750, y: 384, width: 64, height: 32 },
    { x: 5050, y: 352, width: 32, height: 32 },
    { x: 5350, y: 384, width: 32, height: 64 },
  ],

  // Enemy spawn definitions
  spawns: [
    { x: 300,  type: 'soldier', count: 2 },
    { x: 500,  type: 'turret',  count: 1 },
    { x: 700,  type: 'soldier', count: 3 },
    { x: 900,  type: 'helicopter', count: 1 },
    { x: 1100, type: 'soldier', count: 2 },
    { x: 1200, type: 'turret',  count: 1 },
    { x: 1400, type: 'soldier', count: 3 },
    { x: 1600, type: 'helicopter', count: 2 },
    { x: 1800, type: 'soldier', count: 2 },
    { x: 1900, type: 'turret',  count: 2 },
    { x: 2100, type: 'soldier', count: 3 },
    { x: 2300, type: 'helicopter', count: 1 },
    { x: 2500, type: 'soldier', count: 2 },
    { x: 2600, type: 'turret',  count: 1 },
    { x: 2800, type: 'soldier', count: 4 },
    { x: 3000, type: 'helicopter', count: 2 },
    { x: 3200, type: 'soldier', count: 3 },
    { x: 3400, type: 'turret',  count: 2 },
    { x: 3600, type: 'soldier', count: 2 },
    { x: 3800, type: 'helicopter', count: 1 },
    { x: 4000, type: 'soldier', count: 3 },
    { x: 4200, type: 'turret',  count: 1 },
    { x: 4400, type: 'soldier', count: 4 },
    { x: 4600, type: 'helicopter', count: 2 },
    { x: 4800, type: 'soldier', count: 3 },
    { x: 5000, type: 'turret',  count: 2 },
    { x: 5200, type: 'soldier', count: 3 },
    { x: 5400, type: 'helicopter', count: 2 },
    { x: 5600, type: 'soldier', count: 4 },
  ],

  // Power-up drops (placed at fixed positions)
  powerUps: [
    { x: 400, y: 220, type: 'spread' },
    { x: 1000, y: 240, type: 'laser' },
    { x: 1800, y: 160, type: 'flame' },
    { x: 2600, y: 180, type: 'spread' },
    { x: 3400, y: 200, type: 'laser' },
    { x: 4200, y: 160, type: 'flame' },
    { x: 5000, y: 180, type: 'spread' },
  ],

  // Boss
  boss: {
    x: 6000,
    type: 'walker',
  },
};

// ─── Level Registry ────────────────────────────────────────────────────
// Add new levels here. The game cycles through them or picks by index.
export const LEVELS = [LEVEL_1];

export function getLevel(index) {
  if (index < 0 || index >= LEVELS.length) return LEVELS[0];
  return LEVELS[index];
}
