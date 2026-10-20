// @ts-nocheck — Three.js runtime is bundled by the application; this file uses its JS API directly.
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type RoomLayout = { id: number; name: string; x: number; y: number; w: number; h: number; color?: string };
type OpeningLayout = { id: number; kind: 'Porte' | 'Fenêtre'; roomId: number; wall: 'nord' | 'sud' | 'est' | 'ouest'; offset: number; width: number };
type House3DViewerProps = {
  levels: number;
  facadeColor: string;
  roofColor: string;
  showFurniture: boolean;
  rooms: Array<string | RoomLayout>;
  openings?: OpeningLayout[];
  parcelWidth?: number;
  parcelDepth?: number;
  parking: number;
};

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export default function House3DViewer({ levels, facadeColor, roofColor, showFurniture, rooms, openings = [], parcelWidth, parcelDepth, parking }: House3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const layoutRooms = rooms.filter((room): room is RoomLayout => typeof room !== 'string');
  const roomNames = rooms.map((room) => typeof room === 'string' ? room : room.name);
  const layoutWidth = parcelWidth ?? Math.max(9, ...layoutRooms.map((room) => room.x + room.w));
  const layoutDepth = parcelDepth ?? Math.max(6.5, ...layoutRooms.map((room) => room.y + room.h));
  const [webglError, setWebglError] = useState('');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls | undefined;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef2f7');
    scene.fog = new THREE.Fog('#eef2f7', 24, 55);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(13, 10, 14);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setSize(Math.max(mount.clientWidth, 320), 390);
      renderer.domElement.setAttribute('aria-label', 'Maquette tridimensionnelle interactive de la maison. Faites glisser pour tourner, utilisez la molette pour zoomer.');
      renderer.domElement.setAttribute('role', 'img');
      mount.replaceChildren(renderer.domElement);
      setWebglError('');
    } catch {
      setWebglError('La visualisation 3D nécessite un navigateur compatible WebGL. Vous pouvez toujours consulter les plans schématiques ci-dessous.');
      return;
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8994a5, 2.1));
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunlight.position.set(8, 16, 10);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -15;
    sunlight.shadow.camera.right = 15;
    sunlight.shadow.camera.top = 15;
    sunlight.shadow.camera.bottom = -15;
    scene.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({ color: '#dce5d8', roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(30, 30, 0x9ca3af, 0xcbd5e1);
    grid.position.y = -0.105;
    scene.add(grid);

    const house = new THREE.Group();
    scene.add(house);
    const width = layoutRooms.length ? Math.max(1, ...layoutRooms.map((room) => room.x + room.w)) : 9;
    const depth = layoutRooms.length ? Math.max(1, ...layoutRooms.map((room) => room.y + room.h)) : 6.5;
    const originX = width / 2;
    const originZ = depth / 2;
    const floorHeight = 2.7;
    const wall = 0.2;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: facadeColor, roughness: 0.82 });
    const sideMaterial = new THREE.MeshStandardMaterial({ color: '#d4d0c8', roughness: 0.88 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.9 });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: '#8fc9e8', metalness: 0.12, roughness: 0.2 });
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: '#8b5e3c', roughness: 0.78 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: '#d5c7ad', roughness: 0.9 });
    const furnitureMaterial = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.88 });

    const addBox = (parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    if (layoutRooms.length) {
      for (let floor = 0; floor < levels; floor++) {
        const baseY = floor * floorHeight;
        for (const room of layoutRooms) {
          const centerX = room.x + room.w / 2 - originX;
          const centerZ = room.y + room.h / 2 - originZ;
          const roomFloor = new THREE.MeshStandardMaterial({ color: room.color || '#e5e7eb', roughness: 0.92 });
          addBox(house, room.w, 0.12, room.h, roomFloor, centerX, baseY + 0.02, centerZ);
          const wallY = baseY + floorHeight / 2;
          const wallMaterialForRoom = new THREE.MeshStandardMaterial({ color: facadeColor, roughness: 0.86 });
          const roomOpenings = openings.filter((opening) => opening.roomId === room.id);
          const drawWall = (wallSide: OpeningLayout['wall'], run: number, cx: number, cz: number, horizontal: boolean) => {
            const relevant = roomOpenings.filter((opening) => opening.wall === wallSide && opening.kind === 'Porte').map((opening) => ({ start: Math.max(0, opening.offset - opening.width / 2), end: Math.min(run, opening.offset + opening.width / 2) })).filter((opening) => opening.end > opening.start).sort((a, b) => a.start - b.start);
            let cursor = 0;
            for (const opening of relevant) {
              if (opening.start > cursor) {
                const length = opening.start - cursor;
                addBox(house, horizontal ? length : wall, floorHeight, horizontal ? wall : length, wallMaterialForRoom, horizontal ? room.x + cursor + length / 2 - originX : cx, wallY, horizontal ? cz : room.y + cursor + length / 2 - originZ);
              }
              cursor = Math.max(cursor, opening.end);
            }
            if (cursor < run) {
              const length = run - cursor;
              addBox(house, horizontal ? length : wall, floorHeight, horizontal ? wall : length, wallMaterialForRoom, horizontal ? room.x + cursor + length / 2 - originX : cx, wallY, horizontal ? cz : room.y + cursor + length / 2 - originZ);
            }
          };
          drawWall('nord', room.w, centerX, room.y - originZ, true);
          drawWall('sud', room.w, centerX, room.y + room.h - originZ, true);
          drawWall('ouest', room.h, room.x - originX, centerZ, false);
          drawWall('est', room.h, room.x + room.w - originX, centerZ, false);
          for (const opening of roomOpenings.filter((item) => item.kind === 'Fenêtre')) {
            const position = opening.wall === 'nord' ? { x: room.x + opening.offset - originX, y: room.y - originZ - wall / 2 - 0.015, z: -1 } : opening.wall === 'sud' ? { x: room.x + opening.offset - originX, y: room.y + room.h - originZ + wall / 2 + 0.015, z: 1 } : opening.wall === 'ouest' ? { x: room.x - originX - wall / 2 - 0.015, y: room.y + opening.offset - originZ, z: -1 } : { x: room.x + room.w - originX + wall / 2 + 0.015, y: room.y + opening.offset - originZ, z: 1 };
            if (opening.wall === 'nord' || opening.wall === 'sud') {
              addBox(house, Math.min(opening.width, room.w), 1.05, 0.055, frameMaterial, position.x, baseY + 1.55, position.y);
              addBox(house, Math.min(opening.width * 0.86, room.w), 0.88, 0.03, glassMaterial, position.x, baseY + 1.55, position.y + (opening.wall === 'nord' ? -0.035 : 0.035));
            } else {
              addBox(house, 0.055, 1.05, Math.min(opening.width, room.h), frameMaterial, position.x, baseY + 1.55, position.y);
              addBox(house, 0.03, 0.88, Math.min(opening.width * 0.86, room.h), glassMaterial, position.x + (opening.wall === 'ouest' ? -0.035 : 0.035), baseY + 1.55, position.y);
            }
          }
          for (const opening of roomOpenings.filter((item) => item.kind === 'Porte')) {
            const doorMaterialForRoom = new THREE.MeshStandardMaterial({ color: '#8b5e3c', roughness: 0.78 });
            if (opening.wall === 'nord' || opening.wall === 'sud') {
              addBox(house, Math.min(opening.width, room.w) * 0.92, 2.05, 0.055, doorMaterialForRoom, room.x + opening.offset - originX, baseY + 1.025, (opening.wall === 'nord' ? room.y - originZ : room.y + room.h - originZ) + (opening.wall === 'nord' ? -0.04 : 0.04));
            } else {
              addBox(house, 0.055, 2.05, Math.min(opening.width, room.h) * 0.92, doorMaterialForRoom, (opening.wall === 'ouest' ? room.x - originX : room.x + room.w - originX) + (opening.wall === 'ouest' ? -0.04 : 0.04), baseY + 1.025, room.y + opening.offset - originZ);
            }
          }
          if (showFurniture) {
            const furniture = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.88 });
            const furnitureW = Math.min(1.4, room.w * 0.42);
            const furnitureD = Math.min(0.75, room.h * 0.28);
            addBox(house, furnitureW, 0.42, furnitureD, furniture, centerX, baseY + 0.3, centerZ);
          }
        }
      }
    } else {
      for (let floor = 0; floor < levels; floor++) {
      const baseY = floor * floorHeight;
      addBox(house, width, 0.18, depth, floorMaterial, 0, baseY + 0.02, 0);
      // Back and side walls are continuous; the front is split to leave a visible entrance.
      addBox(house, width, floorHeight, wall, sideMaterial, 0, baseY + floorHeight / 2, -depth / 2 + wall / 2);
      addBox(house, wall, floorHeight, depth, sideMaterial, -width / 2 + wall / 2, baseY + floorHeight / 2, 0);
      addBox(house, wall, floorHeight, depth, sideMaterial, width / 2 - wall / 2, baseY + floorHeight / 2, 0);
      if (floor === 0) {
        addBox(house, width * 0.36, floorHeight, wall, wallMaterial, -width * 0.32, baseY + floorHeight / 2, depth / 2 - wall / 2);
        addBox(house, width * 0.36, floorHeight, wall, wallMaterial, width * 0.32, baseY + floorHeight / 2, depth / 2 - wall / 2);
        addBox(house, width * 0.28, floorHeight - 2.1, wall, wallMaterial, 0, baseY + floorHeight - (floorHeight - 2.1) / 2, depth / 2 - wall / 2);
        addBox(house, 1.15, 2.05, 0.08, doorMaterial, 0, baseY + 1.025, depth / 2 + 0.06);
      } else {
        addBox(house, width, floorHeight, wall, wallMaterial, 0, baseY + floorHeight / 2, depth / 2 - wall / 2);
      }

      // Window frames and glazing on the front and both side elevations.
      const frontWindowXs = [-3.05, -1.45, 1.45, 3.05];
      frontWindowXs.forEach((x) => {
        const y = baseY + 1.55;
        addBox(house, 0.92, 1.05, 0.07, frameMaterial, x, y, depth / 2 + 0.015);
        addBox(house, 0.76, 0.88, 0.045, glassMaterial, x, y, depth / 2 + 0.06);
        addBox(house, 0.025, 0.88, 0.02, frameMaterial, x, y, depth / 2 + 0.09, false);
      });
      [-1.6, 1.6].forEach((z) => {
        addBox(house, 0.06, 1.05, 1.15, frameMaterial, width / 2 + 0.01, baseY + 1.55, z);
        addBox(house, 0.04, 0.88, 0.98, glassMaterial, width / 2 + 0.04, baseY + 1.55, z);
      });

      // Simplified internal partitions and illustrative furniture.
      const partitionX = -0.4 + (floor % 2) * 0.8;
      addBox(house, 0.12, 2.15, depth * 0.78, wallMaterial, partitionX, baseY + 1.17, 0);
      addBox(house, width * 0.42, 2.15, 0.12, wallMaterial, width * 0.22, baseY + 1.17, 0.25);
      if (showFurniture) {
        addBox(house, 1.7, 0.48, 0.9, furnitureMaterial, -2.35, baseY + 0.36, -1.5);
        addBox(house, 1.1, 0.8, 0.65, furnitureMaterial, 2.35, baseY + 0.5, -1.6);
        addBox(house, 1.15, 0.08, 0.7, furnitureMaterial, 2.35, baseY + 0.88, -1.6);
      }
    }

      }
    }

    // Flat roof follows the current room layout when the architectural editor supplies room geometry.
    addBox(house, width + 0.35, 0.22, depth + 0.35, roofMaterial, 0, levels * floorHeight + 0.08, 0);
    if (!layoutRooms.length) addBox(house, width + 0.3, 0.18, 0.38, roofMaterial, 0, levels * floorHeight + 0.27, 0);

    // Site access and a parking bay if one was requested.
    addBox(scene, 3.1, 0.035, 4.4, new THREE.MeshStandardMaterial({ color: '#b9c0c7', roughness: 1 }), 0, -0.07, 6, false);
    if (parking > 0) {
      addBox(scene, 2.7, 0.04, 5, new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 1 }), -5.5, -0.065, 1.5, false);
      addBox(scene, 0.06, 0.045, 4.5, new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 1 }), -5.5, -0.035, 1.5, false);
    }

    const labelCanvas = document.createElement('canvas');
    const labelContext = labelCanvas.getContext('2d');
    if (labelContext) {
      labelCanvas.width = 512;
      labelCanvas.height = 96;
      labelContext.fillStyle = '#334155';
      labelContext.font = 'bold 34px sans-serif';
      labelContext.textAlign = 'center';
      labelContext.fillText(`JDV IMMO · ${levels} niveau(x) · ${roomNames.length} pièces · ${layoutRooms.length ? 'plan synchronisé' : 'volume indicatif'}`, 256, 56);
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true }));
      label.scale.set(5, 0.95, 1);
      label.position.set(0, levels * floorHeight + 2.15, 0);
      scene.add(label);
    }

    camera.aspect = Math.max(mount.clientWidth, 320) / 390;
    camera.updateProjectionMatrix();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 7;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.target.set(0, levels * floorHeight / 2, 0);
    camera.position.set(Math.max(width, depth) * 1.25, Math.max(8, levels * floorHeight), Math.max(width, depth) * 1.35);
    controls.update();
    controls.update();

    const render = () => {
      frame = window.requestAnimationFrame(render);
      controls?.update();
      renderer.render(scene, camera);
    };
    render();

    resizeObserver = new ResizeObserver(() => {
      if (!mount || !renderer) return;
      const w = Math.max(mount.clientWidth, 320);
      const h = 390;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      controls?.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [levels, facadeColor, roofColor, showFurniture, rooms, openings, parcelWidth, parcelDepth, parking]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-100 text-slate-700">
      <div ref={mountRef} className="min-h-[390px] w-full" />
      {webglError && <div role="status" className="p-4 text-sm text-amber-800">{webglError}</div>}
      {!webglError && <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-sm">Glisser : tourner · Molette : zoomer · Déplacement : clic droit ou deux doigts</div>}
      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm">3D interactive</div>
    </div>
  );
}
