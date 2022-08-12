import { createPlaneBufferGeometry } from "../utils/three-utils";
import { errorTexture } from "../utils/error-texture";

export function create360ImageMesh({ texture }) {
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
      default:
        material.transparent = true;
        material.alphaTest = 0;
    }
  }
  material.map = texture;
  material.needsUpdate = true;

  return new THREE.Mesh(geometry, material);
}

export function createImageMesh({ texture, ratio }) {
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  const geometry = createPlaneBufferGeometry(width, height, 1, 1, texture.flipY);

  const material = new THREE.MeshBasicMaterial();
  material.toneMapped == false;
  material.side = THREE.DoubleSide;
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
      default:
        material.transparent = true;
        material.alphaTest = 0;
    }
  }
  material.map = texture;
  material.needsUpdate = true;

  return new THREE.Mesh(geometry, material);
}
