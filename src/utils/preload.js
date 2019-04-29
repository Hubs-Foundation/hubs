import { GLTFCache, loadGLTF } from "../components/gltf-model-plus";

export async function load(src) {
  if (!GLTFCache[src]) {
    GLTFCache[src] = await loadGLTF(
      src,
      "model/gltf",
      window.APP && window.APP.quality === "low" ? "KHR_materials_unlit" : "pbrMetallicRoughness"
    );
  }

  return GLTFCache[src].scene || GLTFCache[src].scenes[0];
}

export async function prepareForRender(sceneEl, objects) {
  const lights = [];
  const shadows = [];
  sceneEl.object3D.traverse(o => {
    if (o.isLight) {
      lights.push(o);
    }
    if (o.castShadow) {
      shadows.push(o);
    }
  });
  sceneEl.renderer.prepareMaterialsAndPrograms(sceneEl.object3D, sceneEl.camera, lights, shadows, objects);
}
