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
