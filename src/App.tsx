/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlockType, PresetType, SaveGame, WorldConfig, BLOCK_DEFS } from './types';
import { SimpleNoise } from './utils/noise';
import { SoundEngine } from './utils/sounds';
import GameCanvas from './components/GameCanvas';
import Inventory from './components/Inventory';
import MainUI from './components/MainUI';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function App() {
  // --- WORLD BUILDER CONFIG ---
  const [seed, setSeed] = useState('CREATOR');
  const [preset, setPreset] = useState<PresetType>('grasslands');
  const [worldX, setWorldX] = useState(48);
  const [worldY, setWorldY] = useState(16);
  const [worldZ, setWorldZ] = useState(48);

  // --- GAME PLAY RUNTIME STATE ---
  const [gameStarted, setGameStarted] = useState(false);
  const [currentSaveName, setCurrentSaveName] = useState('sandbox_world');
  const [voxels, setVoxels] = useState<Record<string, BlockType>>({});
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([24, 10, 24]);
  const [isFlightMode, setIsFlightMode] = useState(false);
  const [gameTime, setGameTime] = useState(2000); // 2000 ticks is early morning

  // --- HOTBAR BLOCK SLOTS (9 total, default selected items) ---
  const [hotbar, setHotbar] = useState<BlockType[]>([
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.STONE,
    BlockType.WOOD,
    BlockType.LEAVES,
    BlockType.GLASS,
    BlockType.BRICK,
    BlockType.MELON,
    BlockType.WATER,
  ]);
  const [activeHotbarIndex, setActiveHotbarIndex] = useState(0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // --- PHYSICS CONFIG SLIDERS ---
  const [movementSpeed, setMovementSpeed] = useState(1.0);
  const [gravity, setGravity] = useState(1.0);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isMusicOn, setIsMusicOn] = useState(false); // Music disabled by default

  // --- SAVED WORLD LISTS ---
  const [saves, setSaves] = useState<SaveGame[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Load saves from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('react_minecraft_saves_v2');
      if (stored) {
        setSaves(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load save slots from localstorage.', e);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // --- WORLD ENGINE PROCEDURAL GENERATION ---
  const generateVoxelTerrain = () => {
    const data: Record<string, BlockType> = {};
    const noiseGen = new SimpleNoise(seed);

    // Dynamic scale depending on preset
    const scale = preset === 'archipelago' ? 12.0 : preset === 'mountains' ? 14.5 : 16.0;

    for (let x = 0; x < worldX; x++) {
      for (let z = 0; z < worldZ; z++) {
        let height = 4; // base level

        if (preset === 'flatlands') {
          height = 4;
        } else if (preset === 'grasslands') {
          // Soft hills
          const n = noiseGen.fbm2D(x / scale, z / scale, 3);
          height = Math.round(n * 5 + 6);
        } else if (preset === 'mountains') {
          // Sharp tall peaks
          const n = noiseGen.fbm2D(x / scale, z / scale, 4, 2.0, 0.45);
          height = Math.round(n * 9 + 8);
        } else if (preset === 'archipelago') {
          // Islands in water
          const n = noiseGen.fbm2D(x / scale, z / scale, 3);
          height = Math.round(n * 6 + 3);
        }

        // Clip height boundaries
        height = Math.max(1, Math.min(worldY - 2, height));

        // Let's populate columns down from height to y=0
        for (let y = 0; y <= height; y++) {
          const key = `${x},${y},${z}`;

          if (preset === 'flatlands') {
            if (y === height) {
              data[key] = BlockType.GRASS;
            } else if (y >= height - 2) {
              data[key] = BlockType.DIRT;
            } else {
              data[key] = BlockType.STONE;
            }
          } 
          else if (preset === 'grasslands') {
            if (y === height) {
              data[key] = BlockType.GRASS;
            } else if (y >= height - 2) {
              data[key] = BlockType.DIRT;
            } else {
              // Rocky stone sublayer can contain ores!
              const oreRand = Math.random();
              if (oreRand < 0.015) data[key] = BlockType.COAL_ORE;
              else if (oreRand < 0.022) data[key] = BlockType.IRON_BLOCK;
              else data[key] = BlockType.STONE;
            }
          } 
          else if (preset === 'mountains') {
            if (y === height) {
              // Snowcapped rocky peak above height 12
              if (height >= 12) {
                data[key] = BlockType.IRON_BLOCK; // standard rock/snow look
              } else {
                data[key] = BlockType.GRASS;
              }
            } else if (y >= height - 2) {
              data[key] = height >= 12 ? BlockType.STONE : BlockType.DIRT;
            } else {
              // Deep ore generation
              const oreRand = Math.random();
              if (oreRand < 0.007) data[key] = BlockType.DIAMOND_ORE;
              else if (oreRand < 0.015) data[key] = BlockType.GOLD_ORE;
              else if (oreRand < 0.035) data[key] = BlockType.COAL_ORE;
              else data[key] = BlockType.STONE;
            }
          } 
          else if (preset === 'archipelago') {
            // Undersea water level at y = 5
            const waterLevel = 5;

            if (height <= 4) {
              // Is underwater sand bar
              data[key] = BlockType.SAND;
            } else {
              if (y === height) {
                // Shorelines sand, peaks have grass
                data[key] = height <= 5 ? BlockType.SAND : BlockType.GRASS;
              } else if (y >= height - 2) {
                data[key] = BlockType.DIRT;
              } else {
                data[key] = BlockType.STONE;
              }
            }
          }
        }

        // Fill empty low zones with WATER blocks if archipelago is enabled
        if (preset === 'archipelago') {
          const waterLevel = 5;
          for (let y = height + 1; y <= waterLevel; y++) {
            data[`${x},${y},${z}`] = BlockType.WATER;
          }
        }
      }
    }

    // --- GROW TREES PROCEDURALLY ---
    // Sprinkle a few trees randomly across appropriate grass zones
    if (preset !== 'flatlands') {
      const treeCount = preset === 'archipelago' ? 6 : preset === 'mountains' ? 8 : 14;
      for (let i = 0; i < treeCount; i++) {
        const tx = Math.floor(Math.random() * (worldX - 6)) + 3;
        const tz = Math.floor(Math.random() * (worldZ - 6)) + 3;

        // Find standing floor height
        let ty = worldY - 1;
        while (ty > 0 && !data[`${tx},${ty},${tz}`]) {
          ty--;
        }

        const baseVoxel = data[`${tx},${ty},${tz}`];
        if (baseVoxel === BlockType.GRASS) {
          // Grow solid Wood trunk up 4 blocks
          const trunkHeight = 4;
          for (let j = 1; j <= trunkHeight; j++) {
            data[`${tx},${ty + j},${tz}`] = BlockType.WOOD;
          }

          // Foliage dome at trunk peak (Oak Leaves)
          const leafTopY = ty + trunkHeight;
          for (let lx = tx - 2; lx <= tx + 2; lx++) {
            for (let lz = tz - 2; lz <= tz + 2; lz++) {
              for (let ly = leafTopY - 1; ly <= leafTopY + 1; ly++) {
                const isTrunkColumn = lx === tx && lz === tz;
                if (!isTrunkColumn || ly > leafTopY) {
                  // Sparse sphere crop
                  const dist = Math.sqrt((lx - tx) ** 2 + (lz - tz) ** 2 + (ly - (leafTopY + 1)) ** 2);
                  if (dist < 2.5) {
                    data[`${lx},${ly},${lz}`] = BlockType.LEAVES;
                  }
                }
              }
            }
          }
        }
      }
    }

    setVoxels(data);

    // Place player at safe spawn elevation (center)
    const centerX = Math.floor(worldX / 2);
    const centerZ = Math.floor(worldZ / 2);
    let floorY = worldY - 1;
    while (floorY > 0 && !data[`${centerX},${floorY},${centerZ}`]) {
      floorY--;
    }
    setPlayerPos([centerX, floorY + 3.0, centerZ]);
    setIsFlightMode(false); // start grounded
  };

  const handleRegenerateWorld = () => {
    generateVoxelTerrain();
    triggerToast('Generated a fresh sandbox terrain!');
  };

  // --- SAVE / LOAD GAME ENGINE ---
  const handleSaveGame = (name: string) => {
    try {
      const newSave: SaveGame = {
        id: Date.now().toString(),
        name: name,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        config: {
          seed,
          preset,
          worldSizeX: worldX,
          worldSizeY: worldY,
          worldSizeZ: worldZ,
        },
        voxels: voxels,
        playerPos: playerPos,
      };

      const updated = [newSave, ...saves.filter((s) => s.name !== name)];
      setSaves(updated);
      localStorage.setItem('react_minecraft_saves_v2', JSON.stringify(updated));
      setCurrentSaveName(name);
      triggerToast(`Successful Saved: "${name}" list recorded!`);
    } catch (e) {
      console.error(e);
      triggerToast('Failed to save. Storage quota might be exceeded!');
    }
  };

  const handleLoadSave = (save: SaveGame) => {
    setSeed(save.config.seed);
    setPreset(save.config.preset);
    setWorldX(save.config.worldSizeX);
    setWorldY(save.config.worldSizeY);
    setWorldZ(save.config.worldSizeZ);
    setVoxels(save.voxels);
    setPlayerPos(save.playerPos);
    setCurrentSaveName(save.name);
    setGameStarted(true);
    triggerToast(`Loaded world save: "${save.name}"`);
  };

  const handleDeleteSave = (id: string) => {
    const updated = saves.filter((s) => s.id !== id);
    setSaves(updated);
    localStorage.setItem('react_minecraft_saves_v2', JSON.stringify(updated));
    triggerToast('Save file removed.');
  };

  // --- ENGINE STATISTICS HOOKS ---
  const [stats, setStats] = useState({
    blocksCount: 0,
    currentCoords: 'X: 0.0, Y: 0.0, Z: 0.0',
    blockUnderAim: 'None',
  });

  return (
    <div className="relative w-screen h-screen bg-[#111111] overflow-hidden select-none">
      
      {/* 1. GAME ACTIVE SCREEN */}
      {gameStarted && (
        <GameCanvas
          seed={seed}
          preset={preset}
          worldX={worldX}
          worldY={worldY}
          worldZ={worldZ}
          hotbar={hotbar}
          activeHotbarIndex={activeHotbarIndex}
          voxels={voxels}
          setVoxels={setVoxels}
          isFlightMode={isFlightMode}
          setIsFlightMode={setIsFlightMode}
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
          movementSpeedMultiplier={movementSpeed}
          gravityMultiplier={gravity}
          isMusicOn={isMusicOn}
          isSoundOn={isSoundOn}
          currentSaveName={currentSaveName}
          gameTime={gameTime}
          setGameTime={setGameTime}
          setStats={setStats}
        />
      )}

      {/* 2. FULL CONTROLLER OVERLAYS */}
      <MainUI
        seed={seed}
        setSeed={setSeed}
        preset={preset}
        setPreset={setPreset}
        worldX={worldX}
        setWorldX={setWorldX}
        worldY={worldY}
        setWorldY={setWorldY}
        worldZ={worldZ}
        setWorldZ={setWorldZ}
        isFlightMode={isFlightMode}
        setIsFlightMode={setIsFlightMode}
        movementSpeed={movementSpeed}
        setMovementSpeed={setMovementSpeed}
        gravity={gravity}
        setGravity={setGravity}
        isMusicOn={isMusicOn}
        setIsMusicOn={setIsMusicOn}
        isSoundOn={isSoundOn}
        setIsSoundOn={setIsSoundOn}
        gameStarted={gameStarted}
        setGameStarted={setGameStarted}
        currentSaveName={currentSaveName}
        setCurrentSaveName={setCurrentSaveName}
        saves={saves}
        onLoadSave={handleLoadSave}
        onSaveGame={handleSaveGame}
        onDeleteSave={handleDeleteSave}
        onRegenerateWorld={handleRegenerateWorld}
        gameTime={gameTime}
        stats={stats}
        hotbar={hotbar}
        activeHotbarIndex={activeHotbarIndex}
        setActiveHotbarIndex={setActiveHotbarIndex}
        onOpenInventory={() => setIsInventoryOpen(true)}
      />

      {/* 3. MODULAR FLOATING INVENTORY BOX */}
      <Inventory
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        hotbar={hotbar}
        setHotbar={setHotbar}
        activeHotbarIndex={activeHotbarIndex}
        setActiveHotbarIndex={setActiveHotbarIndex}
      />

      {/* 4. REAL-TIME GAMEPLAY KEY LISTENER FOR QUICK INVENTORY FLIP */}
      <KeyboardEventHandler
        onPressE={() => {
          if (gameStarted) {
            setIsInventoryOpen((prev) => !prev);
            SoundEngine.playClick();
          }
        }}
      />

      {/* 5. GALAXY TOAST NOTIFICATIONS */}
      <div id="save-toast-banner" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-[#2e2e2e] border-2 border-yellow-500 font-mono text-xs px-4 py-2.5 rounded shadow-2xl text-yellow-300 font-bold flex items-center space-x-2 border-dashed"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// Simple key listener helper for Tab / E
function KeyboardEventHandler({ onPressE }: { onPressE: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'e' || key === 'tab') {
        e.preventDefault();
        onPressE();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPressE]);

  return null;
}
