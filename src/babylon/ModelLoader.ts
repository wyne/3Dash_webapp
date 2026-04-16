import {
  Scene,
  SceneLoader,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
  type Mesh,
  type ISceneLoaderProgressEvent,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';


export interface ModelLoadResult {
  meshes: AbstractMesh[];
  shadowCasters: AbstractMesh[];
  center: Vector3;
  diagonal: number;
  /** Model bounding-box size (max − min) in world units. */
  size: Vector3;
}

export async function loadModel(
  scene: Scene,
  source: string | Blob,
  onProgress?: (percent: number) => void,
): Promise<ModelLoadResult> {
  let dir: string;
  let file: string;
  let blobUrl: string | null = null;

  if (source instanceof Blob) {
    blobUrl = URL.createObjectURL(source);
    dir = '';
    file = blobUrl;
    // Revoke on scene dispose (not earlier — Babylon may reference the URL async for textures)
    scene.onDisposeObservable.addOnce(() => { if (blobUrl) URL.revokeObjectURL(blobUrl); });
  } else {
    dir = source.substring(0, source.lastIndexOf('/') + 1) || './';
    file = source.substring(source.lastIndexOf('/') + 1);
  }

  const t0 = performance.now();
  const result = await SceneLoader.ImportMeshAsync(
    '',
    dir,
    file,
    scene,
    (evt: ISceneLoaderProgressEvent) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
    blobUrl ? '.glb' : undefined, // hint Babylon to use the glTF loader for blob URLs
  );
  console.log(`[ModelLoader] loaded in ${(performance.now() - t0).toFixed(0)}ms`);

  // Calculate bounding box and collect solid meshes
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  const solidMeshes: AbstractMesh[] = [];

  result.meshes.forEach((m) => {
    if (!(m instanceof AbstractMesh)) return;
    if (!m.getTotalVertices || m.getTotalVertices() === 0) return;
    try {
      const b = m.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, b.minimumWorld);
      max = Vector3.Maximize(max, b.maximumWorld);
    } catch {
      return;
    }
    m.receiveShadows = true;
    solidMeshes.push(m);
  });

  let center = Vector3.Lerp(min, max, 0.5);
  let diagonal = Vector3.Distance(min, max);

  // Auto-scale: if model is in millimeters (diagonal > 100), convert to meters
  if (diagonal > 100) {
    const scaleFactor = 0.001;

    const rootMesh = result.meshes[0];
    rootMesh.scaling.scaleInPlace(scaleFactor);

    // Force world matrix recalculation on all meshes
    scene.meshes.forEach((m) => m.computeWorldMatrix(true));

    // Recompute bounding box with new world positions
    min = new Vector3(Infinity, Infinity, Infinity);
    max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const m of solidMeshes) {
      m.refreshBoundingInfo({});
      const b = m.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, b.minimumWorld);
      max = Vector3.Maximize(max, b.maximumWorld);
    }
    center = Vector3.Lerp(min, max, 0.5);
    diagonal = Vector3.Distance(min, max);

  }

  // Disable lights imported from the model (e.g. UE lights)
  scene.lights
    .filter((l) => l.name !== 'sun' && l.name !== 'hemi')
    .forEach((l) => l.setEnabled(false));

  // Apply white cartoon style: pure white material + black edge wireframe
  applyCartoonStyle(scene, solidMeshes);

  const shadowCasters: AbstractMesh[] = [...solidMeshes];

  const size = max.subtract(min);
  return { meshes: result.meshes, shadowCasters, center, diagonal, size };
}

/**
 * Apply a white cartoon style: pure white diffuse material on all meshes
 * with black edge wireframe overlay for an architectural sketch look.
 */
function applyCartoonStyle(scene: Scene, meshes: AbstractMesh[]): void {
  // Shared white StandardMaterial (more robust than PBR for CAD exports lacking normals/UVs)
  const whiteMat = new StandardMaterial('cartoon_white', scene);
  whiteMat.diffuseColor = new Color3(1, 1, 1);
  whiteMat.specularColor = new Color3(0.1, 0.1, 0.1);
  whiteMat.backFaceCulling = false;
  whiteMat.twoSidedLighting = true;
  whiteMat.maxSimultaneousLights = 48;

  for (const mesh of meshes) {
    mesh.material = whiteMat;
    mesh.applyFog = false; // fog is only for the ground grid fade

    // Per-mesh edges for outer corners (inner corners handled by EdgeOutline post-process)
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 3;
    mesh.edgesColor = new Color4(0, 0, 0, 1);
  }
}

/* ── Face-hide (wall removal) ── */

/** Snapshots of original index buffers, keyed by mesh name. */
const _originalIndices = new Map<string, number[]>();
/** Currently hidden face IDs per mesh, keyed by mesh name. */
const _hiddenFaces: Record<string, number[]> = {};

/**
 * Snapshot original index buffers for all meshes immediately after model load.
 * Must be called before any face-hide operations.
 */
export function captureOriginalIndices(meshes: AbstractMesh[]): void {
  _originalIndices.clear();
  for (const k of Object.keys(_hiddenFaces)) delete _hiddenFaces[k];
  for (const m of meshes) {
    const idx = m.getIndices();
    if (idx) _originalIndices.set(m.name, Array.from(idx));
  }
}

/**
 * Replay persisted hidden faces onto freshly loaded geometry.
 * Call after captureOriginalIndices() with data from config.
 */
export function applyHiddenFaces(scene: Scene, stored: Record<string, number[]>): void {
  for (const [meshName, faceIds] of Object.entries(stored)) {
    const mesh = scene.getMeshByName(meshName);
    if (!mesh) continue;
    const origIdx = _originalIndices.get(meshName);
    if (!origIdx) continue;
    const indices = Array.from(origIdx);
    for (const faceId of faceIds) {
      indices[faceId * 3] = indices[faceId * 3 + 1] = indices[faceId * 3 + 2] = 0;
    }
    mesh.updateIndices(indices);
    _hiddenFaces[meshName] = [...faceIds];
  }
}

/**
 * Hide a single triangle face by degenerating it in the index buffer.
 * Returns the updated hiddenFaces map (for persisting to config).
 */
export function hideFace(mesh: AbstractMesh, faceId: number): Record<string, number[]> {
  const current = mesh.getIndices();
  if (!current) return _hiddenFaces;
  const indices = Array.from(current);
  indices[faceId * 3] = indices[faceId * 3 + 1] = indices[faceId * 3 + 2] = 0;
  mesh.updateIndices(indices);
  if (!_hiddenFaces[mesh.name]) _hiddenFaces[mesh.name] = [];
  _hiddenFaces[mesh.name].push(faceId);
  return _hiddenFaces;
}

/** Restore all original index buffers, making all hidden faces visible again. */
export function resetHiddenFaces(scene: Scene): void {
  for (const [meshName, origIdx] of _originalIndices.entries()) {
    const mesh = scene.getMeshByName(meshName);
    if (mesh) mesh.updateIndices(origIdx);
  }
  for (const k of Object.keys(_hiddenFaces)) delete _hiddenFaces[k];
}

/** Return the current hidden-face state (for persisting to config). */
export function getHiddenFaces(): Record<string, number[]> {
  return _hiddenFaces;
}

/** Clear module-level state — call on scene/model dispose. */
export function clearHiddenFacesState(): void {
  _originalIndices.clear();
  for (const k of Object.keys(_hiddenFaces)) delete _hiddenFaces[k];
}

/**
 * Create invisible shadow wall meshes from config.
 * Hidden from the camera via layerMask but included in the shadow generator.
 */
export function createShadowWalls(
  scene: Scene,
  walls: Array<{ position: { x: number; y: number; z: number }; size: { width: number; height: number; depth: number } }>,
): Mesh[] {
  const mat = new StandardMaterial('shadow_wall_mat', scene);
  mat.disableLighting = true;

  return walls.map((w, i) => {
    const mesh = MeshBuilder.CreateBox(`shadow_wall_${i}`, {
      width: w.size.width,
      height: w.size.height,
      depth: w.size.depth,
    }, scene);
    mesh.position = new Vector3(w.position.x, w.position.y, w.position.z);
    mesh.isPickable = false;
    mesh.receiveShadows = false;
    // Hidden from camera but visible to shadow generator
    mesh.layerMask = 0x10000000;
    mesh.material = mat;
    return mesh;
  });
}
