import { createPlaneBufferGeometry } from "../utils/three-utils";
import { errorTexture } from "../utils/error-texture";
import { Layers } from "../camera-layers";
import { Texture } from "three";

export const enum AlphaMode {
  OPAQUE = 0,
  BLEND = 1,
  MASK = 2
}

export const enum AlphaModeName {
  OPAQUE = "opaque",
  BLEND = "blend",
  MASK = "mask"
}

export function getAlphaModeFromAlphaModeName(alphaMode: AlphaModeName) {
  if (alphaMode === AlphaModeName.OPAQUE) {
    return AlphaMode.OPAQUE;
  } else if (alphaMode === AlphaModeName.BLEND) {
    return AlphaMode.BLEND;
  } else if (alphaMode === AlphaModeName.MASK) {
    return AlphaMode.MASK;
  }
  return AlphaMode.OPAQUE;
}

export function create360ImageMesh(texture: Texture, alphaMode: AlphaMode = AlphaMode.OPAQUE, alphaCutoff = 0.5) {
  const geometry = new THREE.SphereBufferGeometry(1, 64, 32);
  // invert the geometry on the x-axis so that all of the faces point inward
  geometry.scale(-1, 1, 1);
  // Flip uvs on the geometry
  if (!texture.flipY) {
    const uvs = geometry.attributes.uv.array as Array<number>;
    for (let i = 1; i < uvs.length; i += 2) {
      uvs[i] = 1 - uvs[i];
    }
  }

  const material = new THREE.MeshBasicMaterial();
  material.toneMapped == false;
  if (texture === errorTexture) {
    material.transparent = true;
  } else {
    switch (alphaMode) {
      case AlphaMode.OPAQUE:
        material.transparent = false;
        break;
      case AlphaMode.MASK:
        material.transparent = false;
        material.alphaTest = alphaCutoff;
        break;
      case AlphaMode.BLEND:
        material.transparent = true;
        material.alphaTest = 0;
        break;

      default:
        throw new Error("Invalid alpha mode.");
    }
  }
  material.map = texture;
  material.needsUpdate = true;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.layers.set(Layers.CAMERA_LAYER_FX_MASK);
  return mesh;
}

export function createImageMesh(
  texture: Texture,
  ratio: number,
  alphaMode: AlphaMode = AlphaMode.OPAQUE,
  alphaCutoff = 0.5
) {
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  const geometry = createPlaneBufferGeometry(width, height, 1, 1, texture.flipY);

  const material = new THREE.MeshBasicMaterial();
  material.toneMapped == false;
  material.side = THREE.DoubleSide;
  switch (alphaMode) {
    case AlphaMode.MASK:
      material.transparent = false;
      material.alphaTest = alphaCutoff;
      break;
    case AlphaMode.BLEND:
      material.transparent = true;
      material.alphaTest = 0;
      break;
    case AlphaMode.OPAQUE:
    default:
      material.transparent = false;
  }
  material.map = texture;
  material.needsUpdate = true;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.layers.set(Layers.CAMERA_LAYER_FX_MASK);
  return mesh;
}
