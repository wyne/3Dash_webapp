import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  PointLight,
  ShadowGenerator,
  type Mesh,
  type AbstractMesh,
} from '@babylonjs/core';
import type { LightConfig, LightPart, LightSize } from '../types';

export interface LightMeshEntry {
  bulb: Mesh;
  /** Additional part meshes (multi-part lights). All share the same material. */
  extraBulbs: Mesh[];
  mat: StandardMaterial;
  /** Primary point light (sphere) or first sub-light (strip). */
  light?: PointLight;
  /** Additional sub-lights spread along a strip. Empty for non-strip lights. */
  stripLights: PointLight[];
  shadowGen?: ShadowGenerator;
  /** Custom hitbox mesh for click detection. Invisible by default, shown when editing. */
  hitboxMesh?: Mesh;
  hitboxMat?: StandardMaterial;
}

export type MeshMap = Record<string, LightMeshEntry>;

export interface StripConfig {
  spacing: number;
  maxLights: number;
  range: number;
}

export const DEFAULT_STRIP_CONFIG: StripConfig = {
  spacing: 1,
  maxLights: 4,
  range: 6,
};

export interface CreateLightMeshOptions {
  withPointLight?: boolean;
  shadowCasters?: AbstractMesh[];
  stripConfig?: StripConfig;
  singleRange?: number;
  shadowResolution?: number;
}

/** Minimum ratio between longest and shortest cube dimension to be treated as a strip. */
const STRIP_RATIO = 3;

/**
 * Create a light mesh (sphere or cube) with optional PointLight(s) and shadow generator.
 * Long thin cubes are detected as LED strips and get multiple sub-lights.
 */
export function createLightMesh(
  scene: Scene,
  cfg: LightConfig,
  id: string,
  options: CreateLightMeshOptions = {},
): LightMeshEntry {
  const { withPointLight = false, shadowCasters, stripConfig, singleRange, shadowResolution } = options;
  const sc = stripConfig ?? DEFAULT_STRIP_CONFIG;
  const pos = new Vector3(cfg.position.x, cfg.position.y, cfg.position.z);

  const mat = new StandardMaterial(`bulbmat_${id}`, scene);
  mat.disableLighting = true;

  if (withPointLight) {
    mat.emissiveColor = new Color3(0, 0, 0);
  } else {
    mat.emissiveColor = new Color3(0.9, 0.75, 0.2);
    mat.alpha = 0.85;
  }

  const hasParts = cfg.parts && cfg.parts.length > 0;
  const extraBulbs: Mesh[] = [];

  let bulb: Mesh;
  if (hasParts) {
    // Multi-part: create one mesh per part, all sharing the same material
    const parts = cfg.parts!;
    bulb = createPartMesh(scene, parts[0], `bulb_${id}_0`, mat, cfg.entityId);
    for (let i = 1; i < parts.length; i++) {
      extraBulbs.push(createPartMesh(scene, parts[i], `bulb_${id}_${i}`, mat, cfg.entityId));
    }
    // Each part is independently pickable — no bounding-box proxy needed
    bulb.enablePointerMoveEvents = true;
    for (const eb of extraBulbs) eb.enablePointerMoveEvents = true;
  } else {
    const shape = cfg.shape || 'sphere';
    const sz = cfg.size || {};
    if (shape === 'cube') {
      bulb = MeshBuilder.CreateBox(`bulb_${id}`, {
        width: sz.width ?? 0.3,
        height: sz.height ?? 0.3,
        depth: sz.depth ?? 0.3,
      }, scene);
    } else {
      bulb = MeshBuilder.CreateSphere(`bulb_${id}`, {
        diameter: sz.diameter ?? 0.25,
      }, scene);
    }
    bulb.position = pos.clone();
    bulb.metadata = { entityId: cfg.entityId };
    bulb.enablePointerMoveEvents = true;
    bulb.material = mat;
    bulb.applyFog = false;
  }

  let pointLight: PointLight | undefined;
  let shadowGen: ShadowGenerator | undefined;
  const stripLights: PointLight[] = [];

  if (withPointLight) {
    const singleShape = cfg.shape || 'sphere';
    const singleSz = cfg.size || {};
    // Detect strip shape: cube with one dimension >= STRIP_RATIO × the smallest
    const isStrip = !hasParts && singleShape === 'cube' && detectStrip(singleSz);

    if (isStrip) {
      // Create multiple sub-lights along the strip
      const stripInfo = getStripAxis(singleSz);
      const count = Math.max(2, Math.min(sc.maxLights, Math.ceil(stripInfo.length / sc.spacing)));
      const halfLen = stripInfo.length / 2;

      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1 to +1
        const offset = t * halfLen;
        const lightPos = pos.clone();

        if (stripInfo.axis === 'x') lightPos.x += offset;
        else if (stripInfo.axis === 'y') lightPos.y += offset;
        else lightPos.z += offset;

        const pl = new PointLight(`pl_${id}_${i}`, lightPos, scene);
        pl.intensity = 0;
        pl.setEnabled(false);
        pl.range = sc.range;
        pl.diffuse = new Color3(1, 0.9, 0.7);
        stripLights.push(pl);
      }

      // Use first sub-light as the "primary" light
      pointLight = stripLights[0];

      // Shadow generator on the center sub-light only (best coverage, cheaper)
      const centerIdx = Math.floor(count / 2);
      const shadowLight = stripLights[centerIdx];
      if (shadowCasters && shadowCasters.length > 0) {
        shadowGen = createPointShadowGen(shadowLight, shadowCasters, shadowResolution);
      }
    } else {
      // Single point light at entity position
      pointLight = new PointLight(`pl_${id}`, pos, scene);
      pointLight.intensity = 0;
      pointLight.setEnabled(false);
      pointLight.range = singleRange ?? 7;
      pointLight.diffuse = new Color3(1, 0.9, 0.7);

      if (shadowCasters && shadowCasters.length > 0) {
        shadowGen = createPointShadowGen(pointLight, shadowCasters, shadowResolution);
      }
    }
  }

  // Create custom hitbox mesh if configured (or auto-create for multi-part)
  let hitboxMesh: Mesh | undefined;
  let hitboxMat: StandardMaterial | undefined;
  const hbCfg = cfg.hitbox;
  if (hbCfg) {
    const hbShape = hbCfg.shape;
    const hbSz = hbCfg.size || {};
    if (hbShape === 'cube') {
      hitboxMesh = MeshBuilder.CreateBox(`hitbox_${id}`, {
        width: hbSz.width ?? 0.5,
        height: hbSz.height ?? 0.5,
        depth: hbSz.depth ?? 0.5,
      }, scene);
    } else {
      hitboxMesh = MeshBuilder.CreateSphere(`hitbox_${id}`, {
        diameter: hbSz.diameter ?? 0.5,
      }, scene);
    }
    const hbPos = hbCfg.position
      ? new Vector3(hbCfg.position.x, hbCfg.position.y, hbCfg.position.z)
      : pos.clone();
    hitboxMesh.position = hbPos;
    hitboxMesh.metadata = { entityId: cfg.entityId };
    hitboxMesh.isPickable = true;
    hitboxMesh.enablePointerMoveEvents = true;

    hitboxMat = new StandardMaterial(`hitboxmat_${id}`, scene);
    hitboxMat.disableLighting = true;
    hitboxMat.emissiveColor = new Color3(1, 0.2, 0.8); // magenta
    hitboxMat.alpha = 0.3;
    hitboxMat.wireframe = true;
    hitboxMesh.material = hitboxMat;
    hitboxMesh.visibility = 0; // invisible by default

    // For single-part lights the explicit hitbox is the click target; bulb defers to it
    if (!hasParts) bulb.isPickable = false;
  }

  return { bulb, extraBulbs, mat, light: pointLight, stripLights, shadowGen, hitboxMesh, hitboxMat };
}

/** Create a shadow generator for a PointLight. */
function createPointShadowGen(
  light: PointLight,
  shadowCasters: AbstractMesh[],
  resolution = 512,
): ShadowGenerator {
  const sg = new ShadowGenerator(resolution, light);
  sg.usePercentageCloserFiltering = true;
  sg.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  sg.bias = 0;
  sg.normalBias = 0.05;

  for (const mesh of shadowCasters) {
    sg.addShadowCaster(mesh, false);
  }
  return sg;
}

/** Create a single part mesh with shared material. */
function createPartMesh(
  scene: Scene,
  part: LightPart,
  name: string,
  mat: StandardMaterial,
  entityId: string,
): Mesh {
  const sz = part.size || {};
  let mesh: Mesh;
  if (part.shape === 'cube') {
    mesh = MeshBuilder.CreateBox(name, {
      width: sz.width ?? 0.3,
      height: sz.height ?? 0.3,
      depth: sz.depth ?? 0.3,
    }, scene);
  } else {
    mesh = MeshBuilder.CreateSphere(name, {
      diameter: sz.diameter ?? 0.25,
    }, scene);
  }
  mesh.position = new Vector3(part.position.x, part.position.y, part.position.z);
  mesh.metadata = { entityId };
  mesh.material = mat;
  mesh.applyFog = false;
  return mesh;
}


/** Check if cube dimensions qualify as a strip (one axis ≥ STRIP_RATIO × smallest). */
function detectStrip(sz: LightSize): boolean {
  const w = sz.width ?? 0.3;
  const h = sz.height ?? 0.3;
  const d = sz.depth ?? 0.3;
  const maxDim = Math.max(w, h, d);
  const minDim = Math.min(w, h, d);
  return maxDim >= minDim * STRIP_RATIO;
}

/** Determine the longest axis and length for a strip. */
function getStripAxis(sz: LightSize): { axis: 'x' | 'y' | 'z'; length: number } {
  const w = sz.width ?? 0.3;
  const h = sz.height ?? 0.3;
  const d = sz.depth ?? 0.3;
  if (w >= h && w >= d) return { axis: 'x', length: w };
  if (h >= w && h >= d) return { axis: 'y', length: h };
  return { axis: 'z', length: d };
}

export function removeLightMesh(meshMap: MeshMap, entityId: string): void {
  const entry = meshMap[entityId];
  if (!entry) return;
  entry.shadowGen?.dispose();
  // Dispose strip sub-lights (skip index 0 if it's also entry.light — disposed below)
  for (let i = 0; i < entry.stripLights.length; i++) {
    const sl = entry.stripLights[i];
    if (sl !== entry.light) sl.dispose();
  }
  for (const eb of entry.extraBulbs) eb.dispose();
  entry.hitboxMesh?.dispose();
  entry.bulb.dispose();
  entry.light?.dispose();
  delete meshMap[entityId];
}

export function rebuildAllMeshes(
  scene: Scene,
  meshMap: MeshMap,
  lights: LightConfig[],
  options: CreateLightMeshOptions = {},
): void {
  Object.keys(meshMap).forEach((id) => removeLightMesh(meshMap, id));

  lights.forEach((cfg, i) => {
    const entry = createLightMesh(
      scene,
      cfg,
      options.withPointLight ? cfg.entityId : String(i),
      options,
    );
    meshMap[cfg.entityId] = entry;
  });
}

/**
 * Freeze all PointLight shadow maps after the first render.
 * Call once all lights are created and at least one frame has rendered.
 */
export function freezePointLightShadows(meshMap: MeshMap): void {
  for (const key of Object.keys(meshMap)) {
    const entry = meshMap[key];
    if (entry.shadowGen) {
      const sm = entry.shadowGen.getShadowMap();
      if (sm) sm.refreshRate = 0;
    }
  }
}
