import AFRAME from "aframe";
const THREE = AFRAME.THREE;

function checkFloatTextureSupport() {
  const renderer = new THREE.WebGLRenderer();

  const scene = new THREE.Scene();
  const dataTexture = new THREE.DataTexture(new Float32Array(2 * 2 * 4), 2, 2, THREE.RGBAFormat, THREE.FloatType);
  const box = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dataTexture }));
  box.material.map.needsUpdate = true;
  scene.add(box);

  renderer.render(scene, new THREE.Camera());
  return renderer.context.getError() === 0;
}
let supportsFloatTextures = checkFloatTextureSupport();

export function patchWebGLRenderingContext() {
  const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
  WebGLRenderingContext.prototype.getExtension = function patchedGetExtension(name) {
    // It appears that Galaxy S6 devices falsely report that they support OES_texture_float in Firefox.
    // This workaround disables float textures for those devices.
    // See https://github.com/mozilla/mr-social-client/issues/32 and https://bugzilla.mozilla.org/show_bug.cgi?id=1338656
    if (name === "OES_texture_float" && /Android.+Firefox/.test(navigator.userAgent)) {
      if (supportsFloatTextures === undefined) {
        supportsFloatTextures = checkFloatTextureSupport();
      }
      if (!supportsFloatTextures) {
        return null;
      }
    }
    return originalGetExtension.call(this, name);
  };
}
