import { Reflector } from "three/examples/jsm/objects/Reflector";

/** @return { THREE.Object3D? } */
const getPlayerHead = () => document.getElementById("avatar-head")?.object3D;

/**
 * In Reference, camera-tool.js line 605 and line 663
 *
 * @param { boolean } visible
 */
function setPlayerHeadVisible(visible) {
  const playerHead = getPlayerHead();
  if (!playerHead) {
    return;
  }

  const scale = visible ? 1 : 0.0001;

  playerHead.visible = visible;
  playerHead.scale.set(scale, scale, scale);
  playerHead.updateMatrices(true, true);
  playerHead.updateMatrixWorld(true, true);
}

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
    const geometry = this.el.object3DMap?.mesh?.geometry;
    if (!geometry) {
      throw new Error('can not find "object3DMap.mesh.geometry"');
    }

    const reflector = new Reflector(geometry, {
      color: this.data.color,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio
    });
    const { onBeforeRender } = reflector;

    reflector.onBeforeRender = function(renderer, scene, camera) {
      setPlayerHeadVisible(true);
      onBeforeRender(renderer, scene, camera);
    };
    // If not playerHead hide, camera is not following avatar.
    reflector.onAfterRender = () => setPlayerHeadVisible(false);

    this.el.setObject3D("mesh", reflector);
  }
});
