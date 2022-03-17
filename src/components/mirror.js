import { THREE } from "aframe";
import { Reflector } from "three/examples/jsm/objects/Reflector";

const DEFAULT_MIRROR_GEOMETRY = new THREE.PlaneBufferGeometry();
const DEFAULT_TEXTURE_WIDTH = window.innerWidth * window.devicePixelRatio;
const DEFAULT_TEXTURE_HEIGHT = window.innerHeight * window.devicePixelRatio;

/**
 * Should need to entity that has geometry primitive
 *
 * @example
 * ```html
 * <a-plane mirror scale="5 5 5" position="0 3 0"></a-plane>
 * <a-circle mirror="color: #7f7f7f" scale="5 5 5" position="0 3 0"></a-circle>
 * ```
 */
AFRAME.registerComponent("mirror", {
  schema: {
    color: { type: "color", default: "#7f7f7f" }
  },

  init() {
    const geometry = this.el.object3DMap?.mesh?.geometry || DEFAULT_MIRROR_GEOMETRY;
    const reflector = new Reflector(geometry, {
      color: this.data.color,
      textureWidth: DEFAULT_TEXTURE_WIDTH,
      textureHeight: DEFAULT_TEXTURE_HEIGHT
    });
    this.el.setObject3D("mesh", reflector);
  }
});
