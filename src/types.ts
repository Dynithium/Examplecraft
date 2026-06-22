export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  GLASS = 6,
  BRICK = 7,
  SAND = 8,
  GOLD_ORE = 9,
  DIAMOND_ORE = 10,
  OBSIDIAN = 11,
  COAL_ORE = 12,
  WATER = 13,
  GLOWSTONE = 14,
  IRON_BLOCK = 15,
  MELON = 16,
  LAVA = 17,
}

export interface BlockConfig {
  id: BlockType;
  name: string;
  color: string; // fallback color
  textColor: string;
  texturePattern: string; // 'grass_top', 'dirt', 'stone', 'wood', etc.
  sidesColors?: {
    top: string;
    bottom: string;
    side: string;
  };
  isTransparent?: boolean;
  isSolid?: boolean;
  isLightSource?: boolean;
  soundType: 'dirt' | 'stone' | 'wood' | 'glass' | 'sand' | 'water';
}

export const BLOCK_DEFS: Record<BlockType, BlockConfig> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: 'Air',
    color: '#000000',
    textColor: '#ffffff',
    texturePattern: 'air',
    isSolid: false,
    soundType: 'dirt',
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: 'Grass Block',
    color: '#55ff55',
    textColor: '#1a4314',
    texturePattern: 'grass',
    sidesColors: {
      top: '#59cc59', // Green
      bottom: '#866043', // Dirt brown
      side: '#749257', // Grass-side mix
    },
    isSolid: true,
    soundType: 'dirt',
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: 'Dirt',
    color: '#866043',
    textColor: '#ffffff',
    texturePattern: 'dirt',
    isSolid: true,
    soundType: 'dirt',
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: 'Stone',
    color: '#808080',
    textColor: '#ffffff',
    texturePattern: 'stone',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.WOOD]: {
    id: BlockType.WOOD,
    name: 'Oak Wood',
    color: '#a07040',
    textColor: '#ffffff',
    texturePattern: 'wood',
    sidesColors: {
      top: '#cfaf7b', // Inner rings
      bottom: '#cfaf7b',
      side: '#6a4e32', // Bark
    },
    isSolid: true,
    soundType: 'wood',
  },
  [BlockType.LEAVES]: {
    id: BlockType.LEAVES,
    name: 'Oak Leaves',
    color: '#2e8b57',
    textColor: '#ffffff',
    texturePattern: 'leaves',
    isTransparent: true,
    isSolid: true,
    soundType: 'grass' as any || 'dirt', // Map to dirt fallback sound
  },
  [BlockType.GLASS]: {
    id: BlockType.GLASS,
    name: 'Glass Block',
    color: '#ffffff',
    textColor: '#000000',
    texturePattern: 'glass',
    isTransparent: true,
    isSolid: true,
    soundType: 'glass',
  },
  [BlockType.BRICK]: {
    id: BlockType.BRICK,
    name: 'Bricks',
    color: '#b22222',
    textColor: '#ffffff',
    texturePattern: 'brick',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.SAND]: {
    id: BlockType.SAND,
    name: 'Sand',
    color: '#f4a460',
    textColor: '#5a3d16',
    texturePattern: 'sand',
    isSolid: true,
    soundType: 'sand',
  },
  [BlockType.GOLD_ORE]: {
    id: BlockType.GOLD_ORE,
    name: 'Gold Ore',
    color: '#ffcc00',
    textColor: '#000000',
    texturePattern: 'gold_ore',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.DIAMOND_ORE]: {
    id: BlockType.DIAMOND_ORE,
    name: 'Diamond Ore',
    color: '#33ccff',
    textColor: '#000000',
    texturePattern: 'diamond_ore',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.OBSIDIAN]: {
    id: BlockType.OBSIDIAN,
    name: 'Obsidian',
    color: '#191970',
    textColor: '#ffffff',
    texturePattern: 'obsidian',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.COAL_ORE]: {
    id: BlockType.COAL_ORE,
    name: 'Coal Ore',
    color: '#333333',
    textColor: '#ffffff',
    texturePattern: 'coal_ore',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.WATER]: {
    id: BlockType.WATER,
    name: 'Water Block',
    color: '#1e90ff',
    textColor: '#ffffff',
    texturePattern: 'water',
    isTransparent: true,
    isSolid: false,
    soundType: 'water',
  },
  [BlockType.GLOWSTONE]: {
    id: BlockType.GLOWSTONE,
    name: 'Glowstone',
    color: '#ffebcd',
    textColor: '#000000',
    texturePattern: 'glowstone',
    isLightSource: true,
    isSolid: true,
    soundType: 'glass',
  },
  [BlockType.IRON_BLOCK]: {
    id: BlockType.IRON_BLOCK,
    name: 'Iron Block',
    color: '#e6e6e6',
    textColor: '#000000',
    texturePattern: 'iron_block',
    isSolid: true,
    soundType: 'stone',
  },
  [BlockType.MELON]: {
    id: BlockType.MELON,
    name: 'Melon Block',
    color: '#228b22',
    textColor: '#ffffff',
    texturePattern: 'melon',
    sidesColors: {
      top: '#1b4d1b',
      bottom: '#1b4d1b',
      side: '#ff6b6b', // Juicy red sliced inside or striped side
    },
    isSolid: true,
    soundType: 'wood',
  },
  [BlockType.LAVA]: {
    id: BlockType.LAVA,
    name: 'Lava Block',
    color: '#ff4500',
    textColor: '#ffffff',
    texturePattern: 'lava',
    isLightSource: true,
    isSolid: false,
    soundType: 'water',
  },
};

export type PresetType = 'grasslands' | 'flatlands' | 'mountains' | 'archipelago';

export interface WorldConfig {
  seed: string;
  preset: PresetType;
  worldSizeX: number;
  worldSizeY: number;
  worldSizeZ: number;
}

export type VoxelsData = Record<string, BlockType>; // Key is "x,y,z"

export interface SaveGame {
  id: string;
  name: string;
  date: string;
  config: WorldConfig;
  voxels: VoxelsData;
  playerPos: [number, number, number];
}
