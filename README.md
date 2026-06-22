# React Minecraft Voxel Builder 🎮

A fully featured, visually stunning 3D Minecraft clone built entirely in **React 19**, **Three.js**, and **Tailwind CSS**. It is designed to be lightweight, performant, and completely self-contained. It incorporates:

- **Procedural World Generation**: Flatlands, Hilly Grasslands, rocky Mountains with mineral Cap deposits, and Islands (Archipelago grids) with custom tree nurseries.
- **Classic Sandbox Actions**: Left-click to break blocks (with particle physics debris!) and Right-click to place. 
- **Creative Inventory**: Full E-key overlay supporting hotbar reassignment and slot allocations.
- **Synthesis Audio Effects**: Custom sound synthesizer for step noises, blocks breakdown, and selection clicks using native Web Audio API (zero file asset dependencies!).
- **Day/Night Cycle**: Simulated moving sun directional light, gradient sky colors, and nightfall pale moon lighting.
- **Local Persistence**: Full multi-world saving/loading module using structured client-side `localStorage`.

---

## 🚀 Exporting and Hosting on GitHub Pages (Clean & Fast!)

Because of the built-in relative path assets configuration in `vite.config.ts` (`base: "./"`), this application is **100% portable**. It can be deployed to any subpath (such as `https://<your-username>.github.io/<your-repo-name>/`) out of the box with zero modifications!

Follow these 3 simple steps to host this on your own GitHub account:

### 📦 Step 1: Install Gh-Pages Developer Module
In your local command terminal inside the project directory, run:
```bash
npm install gh-pages --save-dev
```

### 📝 Step 2: Configure Scripts in `package.json`
Open your `package.json` file, and insert these duplicate scripts under `"scripts"`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### 🚀 Step 3: Run Deploy!
Commit your code to a GitHub repository, then run the deploy command:
```bash
npm run deploy
```
*Vite will compile the code inside `dist/`, create a local `gh-pages` branch, and seamlessly host it live. Easy as cake!*

---

## 🎮 Game Controls
- **WASD / Arrows**: Walk around.
- **Spacebar**: Jump (or rise upward in Fly Mode).
- **Shift Key**: Sneak (reduces walk speed) / sink downward in Fly Mode.
- **Key [ F ]**: Toggle Flight Mode (Fly freely through solid cliffs).
- **Key [ E ] or [ Tab ]**: Direct Access to Creative Inventory.
- **Left-Click**: Break Blocks.
- **Right-Click**: Place active Hotbar Block.
- **Numbers (1 - 9)**: Selected block selection.
