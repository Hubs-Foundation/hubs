import { createPlaneBufferGeometry } from "../utils/three-utils";
import { errorTexture } from "../utils/error-texture";
import { Layers } from "../camera-layers";

export const AlphaMode = Object.freeze({
  Blend: "blend",
  Mask: "mask",
  Opaque: "opaque"
});

export function create360ImageMesh(texture) {
  const geometry = new THREE.SphereBufferGeometry(1, 64, 32);
  // invert the geometry on the x-axis so that all of the faces point inward
  geometry.scale(-1, 1, 1);
  // Flip uvs on the geometry
  if (!texture.flipY) {
    const uvs = geometry.attributes.uv.array;
    for (let i = 1; i < uvs.length; i += 2) {
      uvs[i] = 1 - uvs[i];
    }
  }

  const material = new THREE.MeshBasicMaterial();
  material.toneMapped == false;
  if (texture === errorTexture) {
    material.transparent = true;
  } else {
    const alphaMode = "opaque"; //TODO
    switch (alphaMode) {
      case "opaque":
        material.transparent = false;
        break;
      case "mask":
        material.transparent = false;
        material.alphaTest = this.data.alphaCutoff;
        break;
      case "blend":
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

export function createImageMesh(texture, ratio, alphaMode = AlphaMode.Opaque, alphaCutoff = 0.5) {
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  const geometry = createPlaneBufferGeometry(width, height, 1, 1, texture.flipY);

  const material = new THREE.MeshBasicMaterial();
  material.toneMapped == false;
  material.side = THREE.DoubleSide;
  switch (alphaMode) {
    case AlphaMode.Mask:
      material.transparent = false;
      material.alphaTest = alphaCutoff;
      break;
    case AlphaMode.Blend:
      material.transparent = true;
      material.alphaTest = 0;
      break;
    case AlphaMode.Opaque:
    default:
      material.transparent = false;
  }
  material.map = texture;
  material.needsUpdate = true;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.layers.set(Layers.CAMERA_LAYER_FX_MASK);
  return mesh;
}
