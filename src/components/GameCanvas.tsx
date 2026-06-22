import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BLOCK_DEFS, BlockType, PresetType } from '../types';
import { SimpleNoise } from '../utils/noise';
import { SoundEngine } from '../utils/sounds';

interface GameCanvasProps {
  seed: string;
  preset: PresetType;
  worldX: number;
  worldY: number;
  worldZ: number;
  hotbar: BlockType[];
  activeHotbarIndex: number;
  voxels: Record<string, BlockType>;
  setVoxels: React.Dispatch<React.SetStateAction<Record<string, BlockType>>>;
  isFlightMode: boolean;
  setIsFlightMode: (flight: boolean) => void;
  playerPos: [number, number, number];
  setPlayerPos: (pos: [number, number, number]) => void;
  movementSpeedMultiplier: number;
  gravityMultiplier: number;
  isMusicOn: boolean;
  isSoundOn: boolean;
  currentSaveName: string;
  gameTime: number; // 0 to 24000
  setGameTime: React.Dispatch<React.SetStateAction<number>>;
  setStats: (stats: { blocksCount: number; currentCoords: string; blockUnderAim: string }) => void;
}

export default function GameCanvas({
  seed,
  preset,
  worldX,
  worldY,
  worldZ,
  hotbar,
  activeHotbarIndex,
  voxels,
  setVoxels,
  isFlightMode,
  setIsFlightMode,
  playerPos,
  setPlayerPos,
  movementSpeedMultiplier,
  gravityMultiplier,
  isMusicOn,
  isSoundOn,
  currentSaveName,
  gameTime,
  setGameTime,
  setStats,
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Create refs to access values in the animation loop without restarting effect
  const isFlightModeRef = useRef(isFlightMode);
  const activeHotbarIndexRef = useRef(activeHotbarIndex);
  const hotbarRef = useRef(hotbar);
  const voxelStateRef = useRef(voxels);
  const movementSpeedRef = useRef(movementSpeedMultiplier);
  const gravityRef = useRef(gravityMultiplier);

  useEffect(() => { isFlightModeRef.current = isFlightMode; }, [isFlightMode]);
  useEffect(() => { activeHotbarIndexRef.current = activeHotbarIndex; }, [activeHotbarIndex]);
  useEffect(() => { hotbarRef.current = hotbar; }, [hotbar]);
  useEffect(() => { voxelStateRef.current = voxels; }, [voxels]);
  useEffect(() => { movementSpeedRef.current = movementSpeedMultiplier; }, [movementSpeedMultiplier]);
  useEffect(() => { gravityRef.current = gravityMultiplier; }, [gravityMultiplier]);

  const [isPointerLocked, setIsPointerLocked] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SOUND ENGINE PREFERENCE PASSTHROUGH ---
    SoundEngine.toggleSound(isSoundOn);
    SoundEngine.toggleMusic(isMusicOn);

    // --- SETUP THREE.JS SCENE ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Set clear color
    renderer.setClearColor(0xc0e0ff, 1);
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const shadowSize = 40;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    scene.add(sunLight);

    // --- PLAYER INITIAL STATE ---
    // Start slightly above terrain
    const initialPlayerY = playerPos[1];
    camera.position.set(playerPos[0], initialPlayerY, playerPos[2]);
    const playerRadius = 0.35;
    const playerHeight = 1.8;
    const velocity = new THREE.Vector3();
    const keysPressed: Record<string, boolean> = {};

    // --- TEXTURES (Procedural pixelated colors for authenticity) ---
    // Generate simple tiny pixel designs for true retro feel without image urls!
    const canvasCache: Record<string, THREE.CanvasTexture> = {};
    const getBlockTexture = (key: string, baseColor: string, accentColor?: string, noiseScale: number = 0.15) => {
      const cacheKey = `${key}_${baseColor}_${accentColor || ''}`;
      if (canvasCache[cacheKey]) return canvasCache[cacheKey];

      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 16, 16);

        // Add modular grid-like grain
        for (let x = 0; x < 16; x++) {
          for (let y = 0; y < 16; y++) {
            if (Math.random() < noiseScale) {
              ctx.fillStyle = accentColor || 'rgba(0, 0, 0, 0.15)';
              ctx.fillRect(x, y, 1, 1);
            } else if (Math.random() < noiseScale * 0.5) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        // Draw pixel border
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 16, 16);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      canvasCache[cacheKey] = tex;
      return tex;
    };

    // --- CUBE GEOMETRY CONFIG ---
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Cache materials by BlockType to avoid recreating them thousands of times
    const materialsCache: Record<number, THREE.Material | THREE.Material[]> = {};

    const getMaterialForBlock = (type: BlockType): THREE.Material | THREE.Material[] => {
      if (materialsCache[type]) return materialsCache[type];

      const def = BLOCK_DEFS[type];
      const isTrans = !!def.isTransparent;

      // Special case: blocks with distinct sides (like Grass, Melons, Wood)
      if (def.sidesColors) {
        const topTex = getBlockTexture(def.name + '_top', def.sidesColors.top, 'rgba(0,0,0,0.1)');
        const bottomTex = getBlockTexture(def.name + '_bottom', def.sidesColors.bottom, 'rgba(0,0,0,0.15)');
        const sideTex = getBlockTexture(def.name + '_side', def.sidesColors.side, 'rgba(0,0,0,0.12)');

        const mats = [
          new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, transparent: isTrans, alphaTest: isTrans ? 0.1 : 0 }), // Right
          new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, transparent: isTrans, alphaTest: isTrans ? 0.1 : 0 }), // Left
          new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.9, transparent: isTrans, alphaTest: isTrans ? 0.1 : 0 }), // Top
          new THREE.MeshStandardMaterial({ map: bottomTex, roughness: 0.9, transparent: isTrans, alphaTest: isTrans ? 0.1 : 0 }), // Bottom
          new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, transparent: isTrans, alphaTest: isTrans ? 0.1 : 0 }), // Front
          new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, transparent: isTrans, alphaTest: isTrans ? 0.1 : 0 }), // Back
        ];
        materialsCache[type] = mats;
        return mats;
      }

      // Standard single texture block
      // Adjust textures by type
      let accent = 'rgba(0,0,0,0.12)';
      if (type === BlockType.GLASS) accent = 'rgba(255,255,255,0.4)';
      if (type === BlockType.WATER) accent = 'rgba(0,0,100,0.15)';
      if (type === BlockType.LAVA) accent = 'rgba(100,0,0,0.2)';

      const tex = getBlockTexture(def.name, def.color, accent, type === BlockType.GLASS ? 0.05 : 0.15);
      
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: type === BlockType.GLASS ? 0.1 : 0.8,
        metalness: type === BlockType.IRON_BLOCK ? 0.4 : 0.0,
        transparent: isTrans || type === BlockType.WATER || type === BlockType.LAVA,
        opacity: type === BlockType.WATER ? 0.75 : type === BlockType.LAVA ? 0.92 : 1.0,
        alphaTest: type === BlockType.GLASS || type === BlockType.LEAVES ? 0.15 : 0,
      });

      materialsCache[type] = mat;
      return mat;
    };

    // --- RENDER VOXELS IN THREE.JS SCENE ---
    const voxelMeshes: Record<string, THREE.Mesh> = {};
    const gameBlocksGroup = new THREE.Group();
    scene.add(gameBlocksGroup);

    // Speed up rendering by adding/removing meshes dynamically
    const drawBlock = (x: number, y: number, z: number, type: BlockType) => {
      const key = `${x},${y},${z}`;
      if (type === BlockType.AIR) {
        if (voxelMeshes[key]) {
          gameBlocksGroup.remove(voxelMeshes[key]);
          voxelMeshes[key].geometry.dispose();
          delete voxelMeshes[key];
        }
        return;
      }

      // Remove existing mesh if any
      if (voxelMeshes[key]) {
        gameBlocksGroup.remove(voxelMeshes[key]);
        voxelMeshes[key].geometry.dispose();
      }

      const mat = getMaterialForBlock(type);
      const mesh = new THREE.Mesh(boxGeometry, mat);
      mesh.position.set(x, y, z);
      
      // Let solid blocks cast shadows
      const isSolid = BLOCK_DEFS[type].isSolid;
      mesh.castShadow = isSolid ?? true;
      mesh.receiveShadow = isSolid ?? true;

      mesh.userData = { coords: [x, y, z], type };
      
      gameBlocksGroup.add(mesh);
      voxelMeshes[key] = mesh;
    };

    // Initial draw from the reactive state
    const blockPositions = Object.entries(voxelStateRef.current);
    blockPositions.forEach(([key, type]) => {
      const [x, y, z] = key.split(',').map(Number);
      drawBlock(x, y, z, type);
    });

    // Helper to verify block content
    const getBlockAt = (bx: number, by: number, bz: number): BlockType => {
      // Boundaries check
      if (bx < 0 || bx >= worldX || by < 0 || by >= worldY || bz < 0 || bz >= worldZ) {
        return BlockType.AIR;
      }
      return voxelStateRef.current[`${bx},${by},${bz}`] || BlockType.AIR;
    };

    // --- ACTION OUTLINE: WIREFRAME OVERLAY ---
    const wireframeGeo = new THREE.EdgesGeometry(boxGeometry);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const outlineMesh = new THREE.LineSegments(wireframeGeo, wireframeMat);
    outlineMesh.visible = false;
    scene.add(outlineMesh);

    // --- PARTICLES GENERATOR (FOR BLOCK DESTRUCTION) ---
    const breakParticles: {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      age: number;
      maxAge: number;
    }[] = [];

    const spawnBreakParticles = (x: number, y: number, z: number, blockType: BlockType) => {
      const blockDef = BLOCK_DEFS[blockType];
      const partColor = blockDef.sidesColors?.side || blockDef.color;
      
      // Spawn 10 tiny debris fragments
      const particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const particleMat = new THREE.MeshBasicMaterial({ color: partColor });

      for (let i = 0; i < 12; i++) {
        const pMesh = new THREE.Mesh(particleGeo, particleMat);
        // Slightly random spawn around the center
        pMesh.position.set(
          x + (Math.random() - 0.5) * 0.6,
          y + (Math.random() - 0.5) * 0.6,
          z + (Math.random() - 0.5) * 0.6
        );
        scene.add(pMesh);

        breakParticles.push({
          mesh: pMesh,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 2.5 + 2, // initial upward burst
            (Math.random() - 0.5) * 3
          ),
          age: 0,
          maxAge: 30 + Math.random() * 20, //frames
        });
      }
    };

    // --- UPDATE SYSTEM FOR PARTICLES ---
    const updateParticles = () => {
      for (let i = breakParticles.length - 1; i >= 0; i--) {
        const p = breakParticles[i];
        p.age++;

        // Apply gravity to debris
        p.velocity.y -= 0.14; 
        p.mesh.position.addScaledVector(p.velocity, 0.016); // delta frame-rate approximation

        // Fade size near end
        if (p.age > p.maxAge * 0.7) {
          const ratio = (p.maxAge - p.age) / (p.maxAge * 0.3);
          p.mesh.scale.set(ratio, ratio, ratio);
        }

        if (p.age >= p.maxAge) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          // Dispose material as well if it's unique, but here we share simple materials.
          breakParticles.splice(i, 1);
        }
      }
    };

    // --- FIRST-PERSON CONTROLS (MOUSE MOUSEMOTION) ---
    let yaw = 0;
    let pitch = 0;
    const minPitch = -Math.PI / 2 + 0.01;
    const maxPitch = Math.PI / 2 - 0.01;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== mountRef.current) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      yaw -= movementX * 0.0022;
      pitch -= movementY * 0.0022;

      // Clamp pitch to avoid looking backwards upside down
      pitch = Math.max(minPitch, Math.min(maxPitch, pitch));

      // Euler rotations
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.x = pitch;
      euler.y = yaw;
      camera.quaternion.setFromEuler(euler);
    };

    // --- POINTER LOCK TRIGGERS ---
    const lockPointer = () => {
      mountRef.current?.requestPointerLock();
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === mountRef.current;
      setIsPointerLocked(locked);
    };

    mountRef.current.addEventListener('click', lockPointer);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);

    // --- KEY LISTENERS ---
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed[key] = true;

      // Handle Flight Mode toggle on 'f' key
      if (key === 'f') {
        setIsFlightMode(!isFlightModeRef.current);
        SoundEngine.playClick();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed[key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // --- MOUSE ACTION: RAYCAST TO PLACE/BREAK ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0); // center of screen

    const handleMouseInteraction = (isLeftClick: boolean) => {
      if (document.pointerLockElement !== mountRef.current) return;

      // Raycast straight forward from camera center
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(gameBlocksGroup.children);

      // Check range limit like 6 blocks
      const reachLimit = 6.0;
      const validIntersect = intersects.find(item => item.distance <= reachLimit);

      if (validIntersect) {
        const mesh = validIntersect.object as THREE.Mesh;
        const [bx, by, bz] = mesh.userData.coords;
        const blockType = mesh.userData.type as BlockType;

        if (isLeftClick) {
          // --- BREAK BLOCK ---
          // Play sounds
          const materialType = BLOCK_DEFS[blockType].soundType;
          SoundEngine.playBreak(materialType);

          // Particles
          spawnBreakParticles(bx, by, bz, blockType);

          // Update game state asynchronously to avoid interrupting engine
          setVoxels((prev) => {
            const next = { ...prev };
            delete next[`${bx},${by},${bz}`];
            return next;
          });

          // Erase block immediately in 3D canvas
          drawBlock(bx, by, bz, BlockType.AIR);

        } else {
          // --- PLACE BLOCK ---
          // Determine place position based on face normal
          const normal = validIntersect.face?.normal;
          if (!normal) return;

          const px = bx + Math.round(normal.x);
          const py = by + Math.round(normal.y);
          const pz = bz + Math.round(normal.z);

          // Bounds limitation
          if (px < 0 || px >= worldX || py < 0 || py >= worldY || pz < 0 || pz >= worldZ) {
            return;
          }

          // Check block placing collision against player bounding box
          const tempCamBox = new THREE.Box3(
            new THREE.Vector3(camera.position.x - playerRadius, camera.position.y - playerHeight + 0.1, camera.position.z - playerRadius),
            new THREE.Vector3(camera.position.x + playerRadius, camera.position.y + 0.1, camera.position.z + playerRadius)
          );
          const blockBox = new THREE.Box3(
            new THREE.Vector3(px - 0.5, py - 0.5, pz - 0.5),
            new THREE.Vector3(px + 0.5, py + 0.5, pz + 0.5)
          );

          const blockDef = BLOCK_DEFS[hotbarRef.current[activeHotbarIndexRef.current]];
          // Place block if there is no intersecting player (or if it is non-solid like water!)
          if (!blockDef.isSolid || !tempCamBox.intersectsBox(blockBox)) {
            const newType = hotbarRef.current[activeHotbarIndexRef.current];

            SoundEngine.playPlace(blockDef.soundType);

            setVoxels((prev) => ({
              ...prev,
              [`${px},${py},${pz}`]: newType,
            }));

            drawBlock(px, py, pz, newType);
          }
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        handleMouseInteraction(true); // Left click -> break
      } else if (e.button === 2) {
        handleMouseInteraction(false); // Right click -> place
      }
    };

    window.addEventListener('mousedown', onMouseDown);

    // --- PHYSICS BOX COLLISION RESOLUTION ---
    const checkPlayerOnGround = () => {
      const px = Math.floor(camera.position.x + 0.5);
      const py = Math.floor(camera.position.y - playerHeight + 0.4); // slightly lower
      const pz = Math.floor(camera.position.z + 0.5);

      // Check blocks immediately under the bounding circle
      const feetY = camera.position.y - playerHeight;
      const blockUnderY = Math.floor(feetY - 0.01);

      // Simple radial boundary check under player feet
      const footCheckOffsets = [
        [0, 0],
        [-playerRadius, -playerRadius],
        [playerRadius, -playerRadius],
        [-playerRadius, playerRadius],
        [playerRadius, playerRadius],
      ];

      for (const [ox, oz] of footCheckOffsets) {
        const fbx = Math.floor(camera.position.x + ox + 0.5);
        const fbz = Math.floor(camera.position.z + oz + 0.5);
        const blockType = getBlockAt(fbx, blockUnderY, fbz);
        if (blockType !== BlockType.AIR && BLOCK_DEFS[blockType].isSolid) {
          // If feet Y overlaps the top of the block, we are on ground!
          if (feetY <= blockUnderY + 0.51) {
            return { onGround: true, groundY: blockUnderY + 0.5 };
          }
        }
      }
      return { onGround: false, groundY: 0 };
    };

    // Check collisions for player bounding box and push back
    const resolveCollisions = (oldPos: THREE.Vector3) => {
      const px = camera.position.x;
      const py = camera.position.y;
      const pz = camera.position.z;

      const feetY = py - playerHeight;
      const topY = py;

      // Check all solid blocks the player might overlap in X, Y, Z
      // Player bounding boxes: [px - pr, px + pr], [feetY, topY], [pz - pr, pz + pr]
      const minBlockX = Math.floor(px - playerRadius + 0.5);
      const maxBlockX = Math.floor(px + playerRadius + 0.5);
      const minBlockY = Math.floor(feetY - 0.1 + 0.5);
      const maxBlockY = Math.floor(topY + 0.1 + 0.5);
      const minBlockZ = Math.floor(pz - playerRadius + 0.5);
      const maxBlockZ = Math.floor(pz + playerRadius + 0.5);

      let stepTriggered = false;

      for (let y = minBlockY; y <= maxBlockY; y++) {
        for (let x = minBlockX; x <= maxBlockX; x++) {
          for (let z = minBlockZ; z <= maxBlockZ; z++) {
            const blockType = getBlockAt(x, y, z);
            if (blockType !== BlockType.AIR && BLOCK_DEFS[blockType].isSolid) {
              // Creating Box for voxel
              const blockBox = new THREE.Box3(
                new THREE.Vector3(x - 0.5, y - 0.5, z - 0.5),
                new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5)
              );

              // Creating box for player
              const pBox = new THREE.Box3(
                new THREE.Vector3(camera.position.x - playerRadius, feetY, camera.position.z - playerRadius),
                new THREE.Vector3(camera.position.x + playerRadius, topY, camera.position.z + playerRadius)
              );

              if (pBox.intersectsBox(blockBox)) {
                // If the block is close to our feet (lower than step-height like 0.6 blocks), auto-step over it!
                const blockTop = y + 0.5;
                const stepHeightDiff = blockTop - feetY;

                if (stepHeightDiff > 0 && stepHeightDiff <= 0.61 && !stepTriggered && !isFlightModeRef.current) {
                  // Only step up if there's space for the player head above the block!
                  const spaceAboveBlock1 = getBlockAt(x, y + 1, z);
                  const spaceAboveBlock2 = getBlockAt(x, y + 2, z);
                  const isSpaceSolid = BLOCK_DEFS[spaceAboveBlock1].isSolid || BLOCK_DEFS[spaceAboveBlock2].isSolid;

                  if (!isSpaceSolid) {
                    camera.position.y = blockTop + playerHeight;
                    stepTriggered = true;
                    continue; // step up resolved this collision!
                  }
                }

                // Standard collision resolution: push out along the axis of minimum penetration
                const dxOld = oldPos.x - px;
                const dzOld = oldPos.z - pz;

                // Test push along X
                camera.position.x = oldPos.x;
                const pBoxXOnly = new THREE.Box3(
                  new THREE.Vector3(camera.position.x - playerRadius, feetY, camera.position.z - playerRadius),
                  new THREE.Vector3(camera.position.x + playerRadius, topY, camera.position.z + playerRadius)
                );
                if (!pBoxXOnly.intersectsBox(blockBox)) {
                  // Collision was purely on X, keep old X
                  continue;
                }

                // Test push along Z
                camera.position.x = px;
                camera.position.z = oldPos.z;
                const pBoxZOnly = new THREE.Box3(
                  new THREE.Vector3(camera.position.x - playerRadius, feetY, camera.position.z - playerRadius),
                  new THREE.Vector3(camera.position.x + playerRadius, topY, camera.position.z + playerRadius)
                );
                if (!pBoxZOnly.intersectsBox(blockBox)) {
                  // Collision was purely on Z, keep old Z
                  continue;
                }

                // Fallback: reset both
                camera.position.x = oldPos.x;
                camera.position.z = oldPos.z;
              }
            }
          }
        }
      }
    };

    // --- SOUND HELPER FOR WALKING ---
    let footstepCooldown = 0;
    const playWalkSound = (onGround: boolean, isWater: boolean) => {
      footstepCooldown -= 1;
      if (footstepCooldown <= 0) {
        if (isWater) {
          SoundEngine.playStep('water');
          footstepCooldown = 22; // frame cooldown
        } else if (onGround) {
          // Detect material of ground block
          const feetY = camera.position.y - playerHeight;
          const blockUnderY = Math.floor(feetY - 0.05);
          const fbx = Math.floor(camera.position.x + 0.5);
          const fbz = Math.floor(camera.position.z + 0.5);
          const blockType = getBlockAt(fbx, blockUnderY, fbz);
          
          const materialType = BLOCK_DEFS[blockType].soundType || 'dirt';
          SoundEngine.playStep(materialType);
          footstepCooldown = keysPressed['shift'] ? 28 : 17; // Sneak is slower tick step, run is faster
        }
      }
    };

    // --- ENGINE TICK: RUN EVERY FRAME (60 FPS) ---
    let frameId: number;
    let localGameTime = gameTime;
    let statsTimer = 0;

    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Increment game time dial (Day-Night cycle: 24000 ticks in a full cycle)
      localGameTime = (localGameTime + 8) % 24000;
      setGameTime(localGameTime);

      // Set environment light & background depending on time of day
      let skyColor = new THREE.Color(0xc0e0ff); // Day
      let shadowColor = new THREE.Color(0xffffff);
      let sunIntensity = 1.0;
      let ambientIntensity = 0.52;

      // Simple dial math
      if (localGameTime > 12000 && localGameTime <= 13500) {
        // Sunset
        const ratio = (localGameTime - 12000) / 1500;
        skyColor.lerpColors(new THREE.Color(0xc0e0ff), new THREE.Color(0xfd5e53), ratio);
        sunIntensity = 1.0 - ratio * 0.7;
        ambientIntensity = 0.52 - ratio * 0.3;
      } else if (localGameTime > 13500 && localGameTime <= 14500) {
        // Twilight
        const ratio = (localGameTime - 13500) / 1000;
        skyColor.lerpColors(new THREE.Color(0xfd5e53), new THREE.Color(0x0a0a20), ratio);
        sunIntensity = 0.3 - ratio * 0.3;
        ambientIntensity = 0.22 - ratio * 0.12;
      } else if (localGameTime > 14500 && localGameTime <= 22000) {
        // Night
        skyColor.setHex(0x0a0a20);
        sunIntensity = 0.05;
        ambientIntensity = 0.10;
        sunLight.color.setHex(0x9999ff); // pale moonlight
      } else if (localGameTime > 22000 && localGameTime <= 23500) {
        // Sunrise
        const ratio = (localGameTime - 22000) / 1500;
        skyColor.lerpColors(new THREE.Color(0x0a0a20), new THREE.Color(0xffd700), ratio);
        sunIntensity = ratio * 0.9;
        ambientIntensity = 0.10 + ratio * 0.38;
        sunLight.color.setHex(0xffaa66);
      } else if (localGameTime > 23500 || localGameTime <= 12000) {
        // Full Day
        skyColor.setHex(0xc0e0ff);
        sunIntensity = 1.0;
        ambientIntensity = 0.52;
        sunLight.color.setHex(0xffffff);
      }

      renderer.setClearColor(skyColor);
      ambientLight.intensity = ambientIntensity;
      sunLight.intensity = sunIntensity;

      // Slowly rotate Sun around world
      const angle = (localGameTime / 24000) * Math.PI * 2 + Math.PI;
      sunLight.position.set(
        worldX / 2 + Math.cos(angle) * 35,
        Math.sin(angle) * 35 + 15,
        worldZ / 2 + Math.sin(angle) * 35
      );

      // --- PLAYER MOVEMENT CONTROLS ---
      const speedParam = movementSpeedRef.current;
      const baseSpeed = isFlightModeRef.current ? 0.32 * speedParam : 0.098 * speedParam;
      const moveForward = keysPressed['w'] || keysPressed['arrowup'];
      const moveBackward = keysPressed['s'] || keysPressed['arrowdown'];
      const moveLeft = keysPressed['a'] || keysPressed['arrowleft'];
      const moveRight = keysPressed['d'] || keysPressed['arrowright'];

      const moveDir = new THREE.Vector3();
      const camDirForward = new THREE.Vector3();
      camera.getWorldDirection(camDirForward);
      
      const camDirRight = new THREE.Vector3();
      camDirRight.crossVectors(camDirForward, camera.up).normalize();

      if (isFlightModeRef.current) {
        // Flight calculations (moves freely along all axes based on camera view)
        if (moveForward) moveDir.add(camDirForward);
        if (moveBackward) moveDir.addScaledVector(camDirForward, -1);
        if (moveLeft) moveDir.addScaledVector(camDirRight, 1); // yaw camera inverted compensation
        if (moveRight) moveDir.addScaledVector(camDirRight, -1);

        if (keysPressed[' '] || keysPressed['spacebar']) {
          camera.position.y += baseSpeed; // Rise up
        }
        if (keysPressed['shift']) {
          camera.position.y -= baseSpeed; // Lower down
        }

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          camera.position.addScaledVector(moveDir, baseSpeed);
          
          // water sound if lower under sea level
          const isPlayerInWater = getBlockAt(Math.floor(camera.position.x + 0.5), Math.floor(camera.position.y - 0.2), Math.floor(camera.position.z + 0.5)) === BlockType.WATER;
          playWalkSound(false, isPlayerInWater);
        }

      } else {
        // Normal Walk & Gravity Calculations
        const oldPos = camera.position.clone();

        // Project camera directions on X-Z plane to avoid vertical flight skew
        const walkForward = camDirForward.clone();
        walkForward.y = 0;
        walkForward.normalize();

        const walkRight = camDirRight.clone();
        walkRight.y = 0;
        walkRight.normalize();

        if (moveForward) moveDir.add(walkForward);
        if (moveBackward) moveDir.addScaledVector(walkForward, -1);
        if (moveLeft) moveDir.addScaledVector(walkRight, 1);
        if (moveRight) moveDir.addScaledVector(walkRight, -1);

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          // Sneak modifier (shift) reduces speed by 50%
          const speedFactor = keysPressed['shift'] ? 0.38 : 1.0;
          camera.position.addScaledVector(moveDir, baseSpeed * speedFactor);
        }

        // --- SWIMPING IN WATER CHECKS ---
        const playerEyeBlock = getBlockAt(Math.floor(camera.position.x + 0.5), Math.floor(camera.position.y - 0.2), Math.floor(camera.position.z + 0.5));
        const isInWater = playerEyeBlock === BlockType.WATER || playerEyeBlock === BlockType.LAVA;

        // Apply environment physics: Gravity or water drag
        if (isInWater) {
          // float slightly or jump swims
          velocity.y *= 0.72; // friction drag
          if (keysPressed[' '] || keysPressed['spacebar']) {
            velocity.y = 1.6; // swim up speed
          } else {
            velocity.y -= 0.08 * gravityRef.current; // slow fall in liquid
          }
        } else {
          // Normal airborne / gravity simulation
          // Apply gravity relative to gravity multiplier slider
          velocity.y -= 0.42 * gravityRef.current;
        }

        // Apply velocity Y position shift
        camera.position.y += velocity.y * 0.016;

        // Check feet collision with ground
        const { onGround, groundY } = checkPlayerOnGround();

        if (onGround && velocity.y < 0) {
          camera.position.y = groundY + playerHeight;
          velocity.y = 0;

          // Space to standard Jump
          if (keysPressed[' '] || keysPressed['spacebar']) {
            velocity.y = 6.4; 
          }
        }

        // Resolve walls & block stepping bounds pushing
        resolveCollisions(oldPos);

        // Track reactive footstep audio ticks
        const isMoving = moveForward || moveBackward || moveLeft || moveRight;
        if (isMoving) {
          playWalkSound(onGround, isInWater);
        }

        // Bounds safety fallback: don't fall off the endless sky grid!
        if (camera.position.y < -5) {
          camera.position.set(worldX / 2, worldY + 3, worldZ / 2);
          velocity.set(0, 0, 0);
        }
      }

      // --- OUTLINE RAYCAST BOX HIGHLIGHT CURRENT BLOCK AIM ---
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(gameBlocksGroup.children);
      const targetReach = 6.0;
      const validTarget = intersects.find(item => item.distance <= targetReach);

      if (validTarget) {
        const mesh = validTarget.object as THREE.Mesh;
        const [bx, by, bz] = mesh.userData.coords;
        outlineMesh.position.set(bx, by, bz);
        outlineMesh.visible = true;

        // update overlay statistics
        statsTimer += 1;
        if (statsTimer % 18 === 0) {
          const type = mesh.userData.type as BlockType;
          setStats({
            blocksCount: Object.keys(voxelStateRef.current).length,
            currentCoords: `X: ${camera.position.x.toFixed(1)}, Y: ${(camera.position.y - playerHeight).toFixed(1)}, Z: ${camera.position.z.toFixed(1)}`,
            blockUnderAim: `${BLOCK_DEFS[type].name} [${bx},${by},${bz}]`,
          });
          // Also update player position hook so it records for save games
          setPlayerPos([camera.position.x, camera.position.y, camera.position.z]);
        }
      } else {
        outlineMesh.visible = false;
        statsTimer += 1;
        if (statsTimer % 18 === 0) {
          setStats({
            blocksCount: Object.keys(voxelStateRef.current).length,
            currentCoords: `X: ${camera.position.x.toFixed(1)}, Y: ${(camera.position.y - playerHeight).toFixed(1)}, Z: ${camera.position.z.toFixed(1)}`,
            blockUnderAim: 'None',
          });
          setPlayerPos([camera.position.x, camera.position.y, camera.position.z]);
        }
      }

      // Update particle physics
      updateParticles();

      // Render frame
      renderer.render(scene, camera);
    };

    // Begin Animation ticks
    frameId = requestAnimationFrame(animate);

    // Handle Window Resizing smoothly
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // --- CLEANUP SCENE ON DISPOSE ---
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeEventListener('click', lockPointer);
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose geometries & textures
      boxGeometry.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();

      Object.values(canvasCache).forEach(t => t.dispose());
      Object.values(materialsCache).forEach(m => {
        if (Array.isArray(m)) {
          m.forEach(singleMat => singleMat.dispose());
        } else {
          m.dispose();
        }
      });

      breakParticles.forEach(p => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
      });

      renderer.dispose();
    };
  }, [seed, preset, worldX, worldY, worldZ, currentSaveName]); 
  // Re-run effect ONLY when seed/preset/dimensions change or a different save load happens!
  // Doing this avoids restarting ThreeJS on hotbar triggers or sliders, which is incredibly efficient!

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D Canvas Mount point */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-crosshair relative"
        style={{ touchAction: 'none' }}
      >
        {/* Simple cursor crosshair overlay */}
        <div id="crosshair-center" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          <div className="w-4 h-0.5 bg-white/75 relative"></div>
          <div className="h-4 w-0.5 bg-white/75 -top-[7px] left-[7px] absolute"></div>
        </div>

        {/* Dynamic Pointer Lock Instructions Overlay */}
        {!isPointerLocked && (
          <div 
            id="pointer-lock-instructions-overlay" 
            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center p-6 z-10 cursor-pointer pointer-events-none"
          >
            <div className="bg-[#2a2a2a] border-4 border-yellow-500 font-mono p-6 max-w-sm rounded-lg shadow-xl text-center flex flex-col items-center select-none pointer-events-auto">
              <span className="text-xl text-yellow-400 font-bold tracking-wider mb-2 animate-bounce">
                CLICK TO ENTER PLAY MODE
              </span>
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                Locks mouse cursor to allow first-person camera movement. Press <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-yellow-300 text-[10px]">ESC</kbd> anytime to open cursor options.
              </p>
              <div className="grid grid-cols-2 gap-2 text-left text-[11px] text-gray-400 border-t border-neutral-700 pt-3 w-full">
                <div>🏁 WASD / Arrows : Walk</div>
                <div>💥 Space : Jump / Fly Rise</div>
                <div>💨 Shift : Sneak / Descend</div>
                <div>⛏️ Left-Click: Break Block</div>
                <div>🧱 Right-Click: Place Block</div>
                <div>🧰 Tab or E : Open Inventory</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
