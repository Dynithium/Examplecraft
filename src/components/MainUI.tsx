import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BlockType, PresetType, SaveGame, BLOCK_DEFS } from '../types';
import { 
  Volume2, VolumeX, ShieldAlert, FileOutput, ArrowRight, Github, 
  HelpCircle, Settings, RefreshCw, Sun, Moon, Compass, Plus, Play,
  FolderOpen, Info, Trash2, Save, Sparkles, Check, Share2
} from 'lucide-react';
import { SoundEngine } from '../utils/sounds';

interface MainUIProps {
  seed: string;
  setSeed: (seed: string) => void;
  preset: PresetType;
  setPreset: (preset: PresetType) => void;
  worldX: number;
  setWorldX: (x: number) => void;
  worldY: number;
  setWorldY: (y: number) => void;
  worldZ: number;
  setWorldZ: (z: number) => void;
  isFlightMode: boolean;
  setIsFlightMode: (flight: boolean) => void;
  movementSpeed: number;
  setMovementSpeed: (speed: number) => void;
  gravity: number;
  setGravity: (g: number) => void;
  isMusicOn: boolean;
  setIsMusicOn: (music: boolean) => void;
  isSoundOn: boolean;
  setIsSoundOn: (sound: boolean) => void;
  gameStarted: boolean;
  setGameStarted: (state: boolean) => void;
  currentSaveName: string;
  setCurrentSaveName: (name: string) => void;
  saves: SaveGame[];
  onLoadSave: (save: SaveGame) => void;
  onSaveGame: (name: string) => void;
  onDeleteSave: (id: string) => void;
  onRegenerateWorld: () => void;
  gameTime: number; // 0 to 24000
  stats: {
    blocksCount: number;
    currentCoords: string;
    blockUnderAim: string;
  };
  hotbar: BlockType[];
  activeHotbarIndex: number;
  setActiveHotbarIndex: (idx: number) => void;
  onOpenInventory: () => void;
}

export default function MainUI({
  seed,
  setSeed,
  preset,
  setPreset,
  worldX,
  setWorldX,
  worldY,
  setWorldY,
  worldZ,
  setWorldZ,
  isFlightMode,
  setIsFlightMode,
  movementSpeed,
  setMovementSpeed,
  gravity,
  setGravity,
  isMusicOn,
  setIsMusicOn,
  isSoundOn,
  setIsSoundOn,
  gameStarted,
  setGameStarted,
  currentSaveName,
  setCurrentSaveName,
  saves,
  onLoadSave,
  onSaveGame,
  onDeleteSave,
  onRegenerateWorld,
  gameTime,
  stats,
  hotbar,
  activeHotbarIndex,
  setActiveHotbarIndex,
  onOpenInventory,
}: MainUIProps) {
  const [activeMenu, setActiveMenu] = useState<'title' | 'options' | 'saves' | 'export'>('title');
  const [newSaveName, setNewSaveName] = useState('');
  const [exportComplete, setExportComplete] = useState(false);

  // Time formatting helper
  const formatGameTime = (time: number) => {
    const hours = Math.floor((time / 1000) + 6) % 24;
    const minutes = Math.floor((time % 1000) / 1000 * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    let timeLabel = 'Day';
    if (time > 12000 && time <= 14500) timeLabel = 'Sunset 🌇';
    else if (time > 14500 && time <= 22000) timeLabel = 'Night 🌙';
    else if (time > 22000 && time <= 23500) timeLabel = 'Sunrise 🌅';
    else timeLabel = 'Day ☀️';

    return `${displayHours}:${formattedMinutes} ${period} (${timeLabel})`;
  };

  const selectRandomSeed = () => {
    SoundEngine.playClick();
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setSeed(result);
  };

  const handleStartGame = () => {
    SoundEngine.playClick();
    onRegenerateWorld();
    setGameStarted(true);
  };

  const handleToggleSound = () => {
    const nextVal = !isSoundOn;
    setIsSoundOn(nextVal);
    SoundEngine.toggleSound(nextVal);
    SoundEngine.playClick();
  };

  const handleToggleMusic = () => {
    const nextVal = !isMusicOn;
    setIsMusicOn(nextVal);
    SoundEngine.toggleMusic(nextVal);
    SoundEngine.playClick();
  };

  const triggerSaveWorld = () => {
    if (!newSaveName.trim()) return;
    onSaveGame(newSaveName);
    setNewSaveName('');
    SoundEngine.playClick();
  };

  const sizeLabels = (x: number) => {
    if (x <= 24) return 'Small (24x24)';
    if (x <= 48) return 'Standard (48x48)';
    return 'Large (64x64)';
  };

  const handleSizeChange = (val: number) => {
    SoundEngine.playClick();
    setWorldX(val);
    setWorldZ(val);
    if (val === 24) setWorldY(12);
    else if (val === 48) setWorldY(16);
    else setWorldY(18);
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between select-none">
      
      {/* 1. TOP STATUS PANEL / HEADER COMPASS */}
      <div className="w-full p-4 flex justify-between items-start">
        {gameStarted ? (
          /* HUD info during active play */
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto bg-black/75 border-2 border-[#1a1a1a] p-3 text-white font-mono text-[11px] rounded-sm shadow-lg max-w-xs space-y-1"
          >
            <div className="flex items-center space-x-2 border-b border-[#3a3a3a] pb-1.5 mb-1.5">
              <Compass className="w-4 h-4 text-yellow-400 animate-spin-slow" />
              <span className="font-bold text-yellow-300 uppercase tracking-widest text-[12px]">Sandbox Monitor</span>
            </div>
            <div>🗺️ Seed: <span className="text-gray-300">{seed}</span></div>
            <div>🌄 Preset: <span className="text-gray-300 capitalize">{preset}</span></div>
            <div>📍 Pos: <span className="text-[#aaffaa] font-bold">{stats.currentCoords}</span></div>
            <div>📦 Blocks: <span className="text-yellow-400">{stats.blocksCount}</span></div>
            <div className="pt-0.5 mt-0.5 border-t border-[#3a3a3a] text-gray-400">
              🎯 Looking at: <span className="text-green-300 font-bold">{stats.blockUnderAim}</span>
            </div>
          </motion.div>
        ) : (
          <div /> // empty holding spacer
        )}

        {/* TIME CYCLE HUD */}
        {gameStarted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto bg-[#1e1e1e] border-2 border-[#444] text-[11px] text-yellow-400 font-mono px-3 py-1.5 rounded-sm shadow-md flex items-center space-x-2"
          >
            {gameTime > 14500 && gameTime <= 22000 ? (
              <Moon className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            )}
            <span>{formatGameTime(gameTime)}</span>
          </motion.div>
        )}
      </div>

      {/* 2. NO SANDBOX GAME ACTIVE: INTRO TITLE / WORLD GENERATOR MENU */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 bg-neutral-900/40 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#2e2e2e] border-4 border-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden text-white my-8">
            
            {/* Header Title Banner */}
            <div className="bg-[#1a1a1a] p-4 flex flex-col items-center border-b-4 border-yellow-500 font-mono relative">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-[#4caf50] uppercase font-black text-4xl tracking-widest select-none drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  REACT <span className="text-yellow-400">MINE</span>CRAFT
                </div>
                <div className="text-[10px] tracking-wider text-gray-400 uppercase mt-1">
                  Three.js 3D Sandbox Builder • Fully Client-Side
                </div>
              </motion.div>
            </div>

            {/* Menu Sections Tabs */}
            <div className="flex border-b border-[#1a1a1a] font-mono text-xs">
              <button
                id="tab-setup"
                onClick={() => { SoundEngine.playClick(); setActiveMenu('title'); }}
                className={`flex-1 py-3 text-center font-bold border-r border-[#1a1a1a] transition-colors ${
                  activeMenu === 'title' ? 'bg-[#3e3e3e] text-yellow-400 border-t-2 border-yellow-400' : 'bg-[#222] hover:bg-[#333] text-gray-400'
                }`}
              >
                🌲 WORLD BUILDER
              </button>
              <button
                id="tab-options"
                onClick={() => { SoundEngine.playClick(); setActiveMenu('options'); }}
                className={`flex-1 py-3 text-center font-bold border-r border-[#1a1a1a] transition-colors ${
                  activeMenu === 'options' ? 'bg-[#3e3e3e] text-yellow-400 border-t-2 border-yellow-400' : 'bg-[#222] hover:bg-[#333] text-gray-400'
                }`}
              >
                ⚙️ GAME SPECS
              </button>
              <button
                id="tab-saves"
                onClick={() => { SoundEngine.playClick(); setActiveMenu('saves'); }}
                className={`flex-1 py-3 text-center font-bold border-r border-[#1a1a1a] transition-colors ${
                  activeMenu === 'saves' ? 'bg-[#3e3e3e] text-yellow-400 border-t-2 border-yellow-400' : 'bg-[#222] hover:bg-[#333] text-gray-400'
                }`}
              >
                📁 SAVED WORLDS ({saves.length})
              </button>
              <button
                id="tab-export"
                onClick={() => { SoundEngine.playClick(); setActiveMenu('export'); }}
                className={`flex-1 py-3 text-center font-bold transition-colors ${
                  activeMenu === 'export' ? 'bg-[#3e3e3e] text-yellow-400 border-t-2 border-yellow-400' : 'bg-[#222] hover:bg-[#333] text-gray-400'
                }`}
              >
                🚀 DEPLOY TO GITHUB PAGES
              </button>
            </div>

            {/* Section Contents */}
            <div className="p-6 bg-[#383838] min-h-[300px]">
              
              {/* SECTION A: WORLD GENERATOR */}
              {activeMenu === 'title' && (
                <div className="space-y-4">
                  {/* Presets Choice */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">
                      1. Landscape Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['grasslands', 'flatlands', 'mountains', 'archipelago'] as PresetType[]).map((pType) => (
                        <button
                          key={pType}
                          onClick={() => { SoundEngine.playClick(); setPreset(pType); }}
                          className={`p-3 border-2 text-center rounded-none font-mono capitalize transition-all ${
                            preset === pType
                              ? 'border-yellow-400 bg-green-800 text-white shadow-md font-bold'
                              : 'border-[#1a1a1a] bg-[#1d1d1d] hover:bg-[#2c2c2c] text-gray-300'
                          }`}
                        >
                          {pType === 'grasslands' && '🌳 Grassland'}
                          {pType === 'flatlands' && '🛹 Flatland'}
                          {pType === 'mountains' && '🏔️ Mountain'}
                          {pType === 'archipelago' && '🏝️ Archipelago'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seed Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">
                      2. Noise Deterministic Seed
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        className="flex-1 bg-[#1d1d1d] border-2 border-[#1a1a1a] text-white p-2.5 font-mono text-sm uppercase rounded-none focus:outline-none focus:border-yellow-400"
                        placeholder="Enter seed string..."
                      />
                      <button
                        onClick={selectRandomSeed}
                        className="px-4 py-2 bg-[#6b6b6b] border-2 border-b-4 border-r-4 border-neutral-800 hover:bg-[#7e7e7e] font-mono text-xs font-bold text-white transition-colors"
                      >
                        🎲 RANDOM Seed
                      </button>
                    </div>
                  </div>

                  {/* Size Choice */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">
                      3. World Sizing Bounds
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[24, 48, 64].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`p-2.5 border-2 text-center rounded-none font-mono text-xs transition-all ${
                            worldX === size
                              ? 'border-yellow-400 bg-[#4e3a1f] text-white font-bold'
                              : 'border-[#1a1a1a] bg-[#1d1d1d] hover:bg-[#2c2c2c] text-gray-400'
                          }`}
                        >
                          {sizeLabels(size)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save file warning or label */}
                  <div className="bg-[#242424] p-3 text-[10px] text-gray-400 font-mono leading-relaxed border border-yellow-500/20">
                    ℹ️ <span className="text-yellow-400">Sandbox Physics Note:</span> Generating bigger dimensions creates more block meshes. Low-end mobile devices could experience slow raycasts. Let's start with <span className="text-emerald-400">Standard</span> for optimal testing!
                  </div>

                  {/* Launch button */}
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={handleStartGame}
                      className="w-full py-4 bg-green-700 hover:bg-green-600 border-2 border-b-6 border-r-4 border-green-950 font-mono text-lg font-black uppercase tracking-widest text-[#ffeb3b] animate-pulse transition-all hover:scale-[1.01] flex items-center justify-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>GENERATE WORLD & START</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION B: GAME OPTIONS SLIDERS */}
              {activeMenu === 'options' && (
                <div className="space-y-4 font-mono">
                  <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-4">Physics Config</h3>
                  
                  {/* Speed scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>🏃 PLAYER WALK SPEED</span>
                      <span className="text-yellow-400 font-bold">{movementSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={movementSpeed}
                      onChange={(e) => setMovementSpeed(parseFloat(e.target.value))}
                      className="w-full accent-yellow-400 cursor-pointer"
                    />
                  </div>

                  {/* Gravity scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs mt-3">
                      <span>🪐 GRAVITY STRENGTH</span>
                      <span className="text-yellow-400 font-bold">{gravity}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.0"
                      step="0.1"
                      value={gravity}
                      onChange={(e) => setGravity(parseFloat(e.target.value))}
                      className="w-full accent-yellow-400 cursor-pointer"
                    />
                    <div className="text-[10px] text-gray-500">Lower values simulate lunar leaps!</div>
                  </div>

                  {/* Sounds Toggle */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-dashed border-[#555]">
                    <div className="bg-[#1d1d1d] p-3 border border-[#1a1a1a] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                        <span className="text-xs text-gray-300">BLOCK SOUNDS</span>
                      </div>
                      <button
                        onClick={handleToggleSound}
                        className={`px-3 py-1 text-[10px] font-bold rounded-sm ${
                          isSoundOn ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-[#444] text-gray-500'
                        }`}
                      >
                        {isSoundOn ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="bg-[#1d1d1d] p-3 border border-[#1a1a1a] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Volume2 className={`w-4 h-4 ${isMusicOn ? 'text-emerald-400 animate-bounce' : 'text-gray-500'}`} />
                        <span className="text-xs text-gray-300">AMBIENT PIANO MUSIC</span>
                      </div>
                      <button
                        onClick={handleToggleMusic}
                        className={`px-3 py-1 text-[10px] font-bold rounded-sm ${
                          isMusicOn ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-[#444] text-gray-500'
                        }`}
                      >
                        {isMusicOn ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-500/10 p-3 rounded text-[10px] text-gray-400 leading-relaxed mt-4">
                    🔊 <span className="text-amber-300">Swedish Ambient Audio Mode:</span> Enabling Ambient Music synthesizes relaxing arpeggios randomly in the background using direct sine oscillations, creating the authentic retro sound template!
                  </div>
                </div>
              )}

              {/* SECTION C: SAVES MANAGER */}
              {activeMenu === 'saves' && (
                <div className="space-y-4 font-mono">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Active Local Saves</h3>
                    <span className="text-[10px] text-gray-400">Stored in browser storage</span>
                  </div>

                  {saves.length === 0 ? (
                    <div className="bg-[#1d1d1d] border-2 border-dashed border-[#444] p-8 text-center text-gray-500 text-xs">
                      No saved game instances found. Build a house in the sandbox, press Esc, and write a save name to record it here!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {saves.map((save) => (
                        <div
                          key={save.id}
                          className="bg-[#1d1d1d] border-2 border-[#1a1a1a] p-3 flex justify-between items-center hover:bg-neutral-800 transition-colors"
                        >
                          <div>
                            <div className="text-yellow-400 text-sm font-bold">{save.name}</div>
                            <div className="text-[10px] text-gray-400">
                              📅 {save.date} • {save.config.preset} • {save.config.worldSizeX}x{save.config.worldSizeY}x{save.config.worldSizeZ}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => { SoundEngine.playClick(); onLoadSave(save); setGameStarted(true); }}
                              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 border border-green-950 text-xs font-bold text-white transition-colors flex items-center space-x-1"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>LOAD</span>
                            </button>
                            <button
                              onClick={() => { SoundEngine.playClick(); onDeleteSave(save.id); }}
                              className="p-1.5 bg-red-800 hover:bg-red-700 border border-red-950 text-xs font-bold text-white transition-colors"
                              title="Delete world"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: GITHUB EXPORT */}
              {activeMenu === 'export' && (
                <div className="space-y-4 font-mono text-gray-300 text-xs leading-relaxed">
                  <div className="flex items-center space-x-2 text-yellow-500 font-bold border-b border-[#444] pb-2 mb-2">
                    <Github className="w-5 h-5 text-white" />
                    <span className="uppercase tracking-wider text-sm text-yellow-400">How to Host on GitHub Pages</span>
                  </div>

                  <p>
                    Deploying your custom React Minecraft clone to **GitHub Pages** is fully automated and takes just 3 step operations. Because we configured **portable relative paths** (`base: "./"`), your build will render perfectly on custom URLs without any path breaking!
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="bg-[#1d1d1d] border border-neutral-700 p-3 rounded">
                      <div className="text-[#aaffaa] font-bold mb-1">📦 Step 1: Install Gh-Pages module</div>
                      <code className="text-yellow-400 bg-black/40 px-1 py-0.5 rounded text-[11px] block">
                        npm install gh-pages --save-dev
                      </code>
                    </div>

                    <div className="bg-[#1d1d1d] border border-neutral-700 p-3 rounded">
                      <div className="text-[#aaffaa] font-bold mb-1">📝 Step 2: Add scripts in package.json</div>
                      <p className="text-[10px] text-gray-400 mb-1">Insert these lines under "scripts":</p>
                      <pre className="text-yellow-400 bg-black/40 p-2 rounded text-[10px] overflow-x-auto">
{`"predeploy": "npm run build",
"deploy": "gh-pages -d dist"`}
                      </pre>
                    </div>

                    <div className="bg-[#1d1d1d] border border-neutral-700 p-3 rounded">
                      <div className="text-[#aaffaa] font-bold mb-1">🚀 Step 3: Publish with a Single Command</div>
                      <code className="text-yellow-400 bg-black/40 px-1 py-0.5 rounded text-[11px] block text-wrap">
                        npm run deploy
                      </code>
                    </div>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded flex items-start space-x-2">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-gray-400">
                      Our Vite system is bundled with a relative path asset plugin in <span className="text-yellow-500">vite.config.ts</span>. You do not need to customize base paths or hardcode repo names. Exports are clean, modular, and portable!
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => { SoundEngine.playClick(); setExportComplete(true); }}
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-xs font-bold text-white flex items-center space-x-1.5"
                    >
                      {exportComplete ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                      <span>{exportComplete ? 'TUTORIAL CHECKED!' : 'SET TO DEPLOY'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Title Menu Footer */}
            <div className="p-3 bg-[#1a1a1a] flex justify-between items-center text-[10px] text-gray-500 font-mono border-t border-[#4a4a4a]">
              <span>🎮 Playable in any web browser, completely offline template.</span>
              <span>Version 1.4.0 (Stable)</span>
            </div>

          </div>
        </div>
      )}

      {/* 3. ACTIVE GAMEPLAY: HUD OVERLAY & GAME ACTIONS */}
      {gameStarted && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-auto p-4 flex flex-col items-center justify-end z-20 space-y-4">
          
          {/* OPTIONS MENU DURING ACTIVE GAMEPLAY (POPUP OVERLAY AT BREAK / ESC) */}
          <div className="w-full flex justify-between items-end max-w-4xl px-2">
            
            {/* INSTRUCTIONS MINI HUD */}
            <div className="bg-black/60 border border-neutral-800 p-2 text-white font-mono text-[10px] space-y-0.5 rounded shadow max-w-[220px]">
              <div className="text-yellow-400 font-bold mb-1">🎮 Survival HUD Guide</div>
              <div>• ⌨️ <b className="text-emerald-400">ESC</b> : Release cursor pointer</div>
              <div>• ⌨️ <b className="text-emerald-400">Shift</b> : Sneak/Descend</div>
              <div>• ⌨️ <b className="text-emerald-400">Space</b> : Jump / Fly rise</div>
              <div>• ⌨️ <b className="text-emerald-400">F</b> : Toggle fly state: {isFlightMode ? 'On 🪽' : 'Off 🥾'}</div>
              <div>• ⌨️ <b className="text-emerald-400">E / Tab</b> : Open Full Inventory</div>
            </div>

            {/* EXIT & SAVE COMPACT ACTION BAR */}
            <div className="flex flex-col space-y-2 select-none font-mono">
              <div className="flex space-x-2">
                {/* Flight mode shortcut */}
                <button
                  id="flight-toggle-hud"
                  onClick={() => {
                    SoundEngine.playClick();
                    setIsFlightMode(!isFlightMode);
                  }}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold shadow border border-opacity-30 ${
                    isFlightMode 
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-300' 
                      : 'bg-neutral-800 hover:bg-neutral-700 text-gray-400 border-neutral-600'
                  }`}
                >
                  🪽 {isFlightMode ? 'FLYING MODE' : 'WALKING MODE'}
                </button>

                {/* Open Inventory Helper */}
                <button
                  id="inventory-toggle-hud"
                  onClick={() => {
                    SoundEngine.playClick();
                    onOpenInventory();
                  }}
                  className="px-3 py-1.5 rounded text-[10px] font-bold bg-[#c6c6c6] border-2 border-b-4 border-r-4 border-neutral-700 text-black hover:bg-white transition-all shadow"
                >
                  🧰 DIRECT INVENTORY (E)
                </button>
              </div>

              {/* SAVE WORLD FORM */}
              <div className="flex space-x-1.5 bg-black/75 p-2 rounded border border-neutral-800 shadow">
                <input
                  type="text"
                  placeholder="World save name..."
                  value={newSaveName}
                  onChange={(e) => setNewSaveName(e.target.value)}
                  className="bg-[#121212] border border-neutral-700 text-xs text-white p-1 rounded focus:outline-none focus:border-yellow-500 w-36 max-w-sm"
                />
                <button
                  onClick={triggerSaveWorld}
                  disabled={!newSaveName.trim()}
                  className="p-1 px-2 text-[10px] font-bold bg-[#4caf50] hover:bg-[#66bb6a] disabled:bg-neutral-800 disabled:text-gray-600 text-black rounded transition-colors flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE</span>
                </button>
              </div>

              {/* RETREAT TO LOBBY */}
              <button
                id="hud-exit-to-lobby"
                onClick={() => {
                  SoundEngine.playClick();
                  setGameStarted(false);
                }}
                className="w-full py-1.5 bg-red-900 border border-neutral-800 text-[10px] text-white hover:bg-red-800 rounded font-bold shadow text-center"
              >
                📕 EXIT SANBOX LOBBY
              </button>
            </div>

          </div>

          {/* MINECRAFT BLOCK HOTBAR (1-9 SLOTS) */}
          <div className="relative bg-[#2e2e2e]/95 border-4 border-[#1a1a1a] p-1.5 flex space-x-1.5 rounded-sm shadow-2xl max-w-md w-full my-2">
            {hotbar.map((blockType, idx) => {
              const def = BLOCK_DEFS[blockType];
              const isCurrentActive = activeHotbarIndex === idx;
              const topColor = def.sidesColors?.top || def.color;

              return (
                <div
                  key={idx}
                  id={`hotbar-slot-${idx}`}
                  onClick={() => {
                    SoundEngine.playClick();
                    setActiveHotbarIndex(idx);
                  }}
                  className={`relative aspect-square flex-1 flex flex-col items-center justify-center border-2 cursor-pointer transition-all duration-150 p-1 select-none ${
                    isCurrentActive
                      ? 'border-[#ffeb3b] scale-110 shadow-[0_0_12px_#ffeb3b] bg-white/20'
                      : 'border-transparent bg-black/40 hover:bg-black/25'
                  }`}
                  title={def.name}
                >
                  {/* Digital Index number */}
                  <span className="absolute top-0.5 left-1 text-[8px] font-mono text-gray-500">
                    {idx + 1}
                  </span>

                  {/* Render simulated flat square style with side hints */}
                  <div 
                    className="w-5 h-5 rounded-xs transition-transform duration-150 hover:scale-110 border border-black/35 shadow-inner"
                    style={{ backgroundColor: topColor }}
                  >
                    {def.sidesColors && (
                      <div className="w-full h-1/2 mt-2 bg-black/15" style={{ backgroundColor: def.sidesColors.side }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
