export function addAnimationComponents(modelEl) {
  if (!modelEl.components["gltf-model-plus"]) {
    return;
  }

  if (modelEl.object3DMap.mesh.animations.length > 0) {
    modelEl.setAttribute("animation-mixer", "");

    if (!modelEl.querySelector("[loop-animation]")) {
      modelEl.setAttribute("loop-animation", "");
    }
  }
}
