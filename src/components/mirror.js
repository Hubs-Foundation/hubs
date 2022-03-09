import { Reflector } from "three/examples/jsm/objects/Reflector";

/** In Reference, camera-tool.js line 605 and line 663 */
function prepareSetPlayerHeadVisible() {
  /** @return { THREE.Object3D? } */
  const getPlayerHead = () => document.getElementById("avatar-head")?.object3D;

  let playerHead = getPlayerHead();

  /**
   * @param { boolean } visible
   */
  return function(visible) {
    if (!playerHead) {
      playerHead = getPlayerHead();
      return;
    }

    const scale = visible ? 1 : 0.0001;

    playerHead.visible = visible;
    playerHead.scale.set(scale, scale, scale);
    playerHead.updateMatrices(true, true);
    playerHead.updateMatrixWorld(true, true);
  };
}

const setPlayerHeadVisible = prepareSetPlayerHeadVisible();

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
    const { mesh } = this.el.object3DMap;
    if (!mesh) {
      console.error('can not find "object3DMap.mesh"');
      return;
    }

    const { geometry } = mesh;
    if (!geometry) {
      console.error('can not find "object3DMap.mesh.geometry"');
      return;
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
