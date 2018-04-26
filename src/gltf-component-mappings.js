import "./components/gltf-model-plus";
import { resolveGLTFComponentUrl } from "./utils/resolveURL";

const registerComponent = AFRAME.GLTFModelPlus.registerComponent;

function srcInflator(srcProperty = "src") {
  return (el, componentName, componentData, gltfPath) => {
    if (componentData[srcProperty]) {
      componentData[srcProperty] = resolveGLTFComponentUrl(componentData[srcProperty], gltfPath);
    }

    el.setAttribute(componentName, componentData);
  };
}

registerComponent("animation-mixer", "animation-mixer");
registerComponent("billboard", "billboard");
registerComponent("body", "body");
registerComponent("collision-filter", "collision-filter");
registerComponent("css-class", "css-class");
registerComponent("dynamic-body", "dynamic-body");
registerComponent("fog", "fog");
registerComponent("geometry", "geometry");
registerComponent("gltf-model-plus", "gltf-model-plus", srcInflator);
registerComponent("hide-when-quality", "hide-when-quality");
registerComponent("layers", "layers");
registerComponent("light", "light");
registerComponent("line", "line");
registerComponent("link", "link");
registerComponent("loop-animation", "loop-animation");
registerComponent("material", "material", srcInflator);
registerComponent("nav-mesh", "nav-mesh", srcInflator);
registerComponent("position", "position");
registerComponent("quack", "quack");
registerComponent("raycaster", "raycaster");
registerComponent("rotation", "rotation");
registerComponent("scale-audio-feedback", "scale-audio-feedback");
registerComponent("scale", "scale");
registerComponent("scene-shadow", "scene-shadow");
registerComponent("shadow", "shadow");
registerComponent("shape", "shape");
registerComponent("skybox", "skybox");
registerComponent("sound", "sound", srcInflator);
registerComponent("spawn-point", "spawn-point");
registerComponent("static-body", "static-body");
registerComponent("super-spawner", "super-spawner");
registerComponent("text", "text");
registerComponent("visible", "visible");
registerComponent("water", "water");
registerComponent("xr", "xr");
