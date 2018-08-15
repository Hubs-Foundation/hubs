import "./components/gltf-model-plus";
import { resolveURL } from "./utils/resolveURL";

AFRAME.GLTFModelPlus.registerComponent("quack", "quack");
AFRAME.GLTFModelPlus.registerComponent("sound", "sound");
AFRAME.GLTFModelPlus.registerComponent("collision-filter", "collision-filter");
AFRAME.GLTFModelPlus.registerComponent("css-class", "css-class");
AFRAME.GLTFModelPlus.registerComponent("scene-shadow", "scene-shadow");
AFRAME.GLTFModelPlus.registerComponent("super-spawner", "super-spawner");
AFRAME.GLTFModelPlus.registerComponent("gltf-model-plus", "gltf-model-plus");
AFRAME.GLTFModelPlus.registerComponent("body", "body");
AFRAME.GLTFModelPlus.registerComponent("hide-when-quality", "hide-when-quality");
AFRAME.GLTFModelPlus.registerComponent("light", "light");
AFRAME.GLTFModelPlus.registerComponent("ambient-light", "ambient-light");
AFRAME.GLTFModelPlus.registerComponent("directional-light", "directional-light");
AFRAME.GLTFModelPlus.registerComponent("hemisphere-light", "hemisphere-light");
AFRAME.GLTFModelPlus.registerComponent("point-light", "point-light");
AFRAME.GLTFModelPlus.registerComponent("spot-light", "spot-light");
AFRAME.GLTFModelPlus.registerComponent("skybox", "skybox");
AFRAME.GLTFModelPlus.registerComponent("layers", "layers");
AFRAME.GLTFModelPlus.registerComponent("shadow", "shadow");
AFRAME.GLTFModelPlus.registerComponent("water", "water");
AFRAME.GLTFModelPlus.registerComponent("scale-audio-feedback", "scale-audio-feedback");
AFRAME.GLTFModelPlus.registerComponent("animation-mixer", "animation-mixer");
AFRAME.GLTFModelPlus.registerComponent("loop-animation", "loop-animation");
AFRAME.GLTFModelPlus.registerComponent("shape", "shape");
AFRAME.GLTFModelPlus.registerComponent("visible", "visible");
AFRAME.GLTFModelPlus.registerComponent("spawn-point", "spawn-point");
AFRAME.GLTFModelPlus.registerComponent("hoverable", "hoverable");
AFRAME.GLTFModelPlus.registerComponent("sticky-zone", "sticky-zone");
AFRAME.GLTFModelPlus.registerComponent("nav-mesh", "nav-mesh", (el, componentName, componentData, gltfPath) => {
  if (componentData.src) {
    componentData.src = resolveURL(componentData.src, gltfPath);
  }

  el.setAttribute(componentName, componentData);
});
