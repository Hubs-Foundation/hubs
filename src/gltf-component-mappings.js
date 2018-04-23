import "./components/gltf-model-plus";
import { resolveURL } from "./utils/resolveURL";

AFRAME.GLTFModelPlus.registerComponent("scale-audio-feedback", "scale-audio-feedback");
AFRAME.GLTFModelPlus.registerComponent("loop-animation", "loop-animation");
AFRAME.GLTFModelPlus.registerComponent("shape", "shape");
AFRAME.GLTFModelPlus.registerComponent("visible", "visible");
AFRAME.GLTFModelPlus.registerComponent("nav-mesh", "nav-mesh", (el, componentName, componentData, gltfPath) => {
  if (componentData.src) {
    componentData.src = resolveURL(componentData.src, gltfPath);
  }

  el.setAttribute(componentName, componentData);
});
