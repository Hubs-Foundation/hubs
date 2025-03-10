const THREE = AFRAME.THREE;

function checkFloatTextureSupport() {
  const renderer = new THREE.WebGLRenderer({ forceWebVR: true });

  const scene = new THREE.Scene();
  const size = 2;
  const data = new Float32Array(size * size * 4);
  const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
  const box = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dataTexture }));
  box.material.map.needsUpdate = true;
  scene.add(box);

  renderer.render(scene, new THREE.Camera());
  const result = renderer.getContext().getError() === 0;
  renderer.dispose();
  return result;
}

export function patchWebGLRenderingContext() {
  if (/Android.+Firefox/.test(navigator.userAgent)) {
    // It appears that Galaxy S6 devices falsely report that they support
    // OES_texture_float in Firefox. This workaround disables float textures
    // for those devices.
    // See https://github.com/Hubs-Foundation/hubs/issues/32 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1338656
    const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
    const supportsFloatTextures = checkFloatTextureSupport();
    WebGLRenderingContext.prototype.getExtension = function patchedGetExtension(name) {
      if (name === "OES_texture_float" && !supportsFloatTextures) {
        return null;
      }
      return originalGetExtension.call(this, name);
    };
  }
}

export function getWebGLVersion(renderer) {
  const gl = renderer.getContext();
  return gl.getParameter(gl.VERSION).split(" ")[1];
}
