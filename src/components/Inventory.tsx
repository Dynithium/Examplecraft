import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOCK_DEFS, BlockType } from '../types';
import { SoundEngine } from '../utils/sounds';
import { X, Check } from 'lucide-react';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
  hotbar: BlockType[];
  setHotbar: (hotbar: BlockType[]) => void;
  activeHotbarIndex: number;
  setActiveHotbarIndex: (index: number) => void;
}

export default function Inventory({
  isOpen,
  onClose,
  hotbar,
  setHotbar,
  activeHotbarIndex,
  setActiveHotbarIndex,
}: InventoryProps) {
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);

  // Get all placeable blocks (excluding AIR)
  const availableBlocks = Object.values(BLOCK_DEFS).filter((def) => def.id !== BlockType.AIR);

  const handleSelectFromGrid = (type: BlockType) => {
    SoundEngine.playClick();
    setSelectedBlockType(type);
  };

  const handleAssignToHotbarSlot = (slotIndex: number) => {
    if (!selectedBlockType) return;
    SoundEngine.playClick();
    const newHotbar = [...hotbar];
    newHotbar[slotIndex] = selectedBlockType;
    setHotbar(newHotbar);
    setSelectedBlockType(null); // Clear selection
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none font-sans"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-full max-w-xl mx-4 bg-[#2e2e2e] border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] rounded-md overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()} // Prevent close on inner click
          >
            {/* Header */}
            <div className="bg-[#1a1a1a] p-3 flex justify-between items-center border-b-2 border-dashed border-[#4a4a4a]">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-mono tracking-wider font-bold text-[#ffcd00] select-none">
                  CREATIVE INVENTORY
                </span>
              </div>
              <button
                id="inventory-close-button"
                onClick={onClose}
                className="p-1 px-3 bg-[#c6c6c6] border-2 border-b-4 border-r-4 border-[#8b8b8b] active:border-[#c6c6c6] text-black hover:bg-[#dedede] rounded-none font-bold"
              >
                X
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="bg-[#444] px-4 py-2 text-xs text-[#bcbcbc] font-mono border-b border-[#1a1a1a]">
              {!selectedBlockType ? (
                <span>💡 Click an item below to select it, then click a slot in your hotbar to equip it.</span>
              ) : (
                <span className="text-[#aaffaa] font-bold animate-pulse">
                  👉 Click any Hotbar slot (1-9) at the bottom to assign: {BLOCK_DEFS[selectedBlockType].name}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-4 bg-[#8b8b8b] flex flex-col space-y-4">
              
              {/* Items Grid */}
              <div className="bg-[#3e3e3e] border-2 border-[#1a1a1a] p-3 rounded-none">
                <h3 className="text-xs font-bold text-[#c6c6c6] uppercase tracking-wider mb-2 font-mono">
                  All Sandbox Blocks
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-52 overflow-y-auto pr-1 customize-scrollbar">
                  {availableBlocks.map((block) => {
                    const isSelected = selectedBlockType === block.id;
                    const topColor = block.sidesColors?.top || block.color;
                    const labelColor = block.textColor || '#ffffff';

                    return (
                      <div
                        key={block.id}
                        id={`block-item-${block.id}`}
                        onClick={() => handleSelectFromGrid(block.id)}
                        className={`relative aspect-square cursor-pointer border-2 group select-none flex flex-col justify-between p-1 rounded-sm transition-all duration-100 ${
                          isSelected
                            ? 'border-[#ffeb3b] bg-white/20 scale-105 shadow-[0_0_10px_#ffeb3b]'
                            : 'border-[#1a1a1a] bg-[#1d1d1d] hover:bg-[#343434] active:scale-95'
                        }`}
                        title={block.name}
                      >
                        {/* Fake Pixel Cube render in 2D */}
                        <div className="flex-1 flex items-center justify-center relative">
                          <div 
                            className="w-7 h-7 relative shadow-inner overflow-hidden rounded-sm transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110"
                            style={{ backgroundColor: topColor }}
                          >
                            {/* Simple cross block style pattern representation */}
                            {block.sidesColors && (
                              <>
                                <div 
                                  className="absolute right-0 bottom-0 top-1/2 left-0" 
                                  style={{ backgroundColor: block.sidesColors.side }} 
                                />
                                <div 
                                  className="absolute right-1/2 bottom-0 top-1/2 left-0 bg-black/10"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Abbreviated Name or overlay */}
                        <div className="text-[9px] font-mono leading-tight text-center truncate text-gray-300 pointer-events-none">
                          {block.name.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Player Hotbar Mapping */}
              <div className="bg-[#2e2e2e] border-2 border-[#1a1a1a] p-3 rounded-none">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-[#ffeb3b] uppercase tracking-wider font-mono">
                    Your Active Hotbar Slots
                  </h3>
                  {selectedBlockType && (
                    <button 
                      onClick={() => setSelectedBlockType(null)}
                      className="text-[10px] text-red-300 hover:underline font-mono bg-black/30 px-2 py-0.5 rounded-sm"
                    >
                      Cancel Assignment
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-9 gap-1.5 bg-[#4c4c4c] p-2 border-2 border-[#1a1a1a]">
                  {hotbar.map((blockType, idx) => {
                    const blockDef = BLOCK_DEFS[blockType];
                    const isCurrentActive = activeHotbarIndex === idx;
                    const topColor = blockDef.sidesColors?.top || blockDef.color;

                    return (
                      <div
                        key={idx}
                        id={`hotbar-assign-slot-${idx}`}
                        className={`relative aspect-square flex flex-col items-center justify-center border-2 cursor-pointer select-none rounded-none transition-all duration-150 ${
                          selectedBlockType
                            ? 'border-green-400 hover:bg-green-500/20 hover:scale-105'
                            : isCurrentActive
                            ? 'border-[#ffeb3b] bg-white/10 scale-105'
                            : 'border-[#1a1a1a] bg-[#1d1d1d] hover:bg-black/30'
                        }`}
                        onClick={() => {
                          if (selectedBlockType) {
                            handleAssignToHotbarSlot(idx);
                          } else {
                            SoundEngine.playClick();
                            setActiveHotbarIndex(idx);
                          }
                        }}
                      >
                        {/* Slot label (1-9) */}
                        <span className="absolute top-0.5 left-1 text-[8px] font-mono text-gray-400 pointer-events-none">
                          {idx + 1}
                        </span>

                        {/* Cube Preview */}
                        <div 
                          className="w-6 h-6 rounded-sm border border-black/30 transition-transform duration-100 scale-95"
                          style={{ backgroundColor: topColor }}
                        >
                          {blockDef.sidesColors && (
                            <div className="w-full h-1/2 mt-3 bg-black/15 flex items-center" style={{ backgroundColor: blockDef.sidesColors.side }} />
                          )}
                        </div>

                        {/* Highlight Circle if actively selected */}
                        {isCurrentActive && (
                          <div className="absolute inset-0 border-2 border-yellow-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-3 bg-[#1a1a1a] flex justify-end space-x-2 border-t-2 border-[#4a4a4a]">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 border-2 border-b-4 border-green-950 font-mono text-xs font-bold uppercase transition-colors"
              >
                Back To Game
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
