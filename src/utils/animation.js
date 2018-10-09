export function addAnimationComponents(modelEl) {
  if (!modelEl.components["animation-mixer"]) {
    return;
  }

  if (!modelEl.querySelector("[loop-animation]")) {
    modelEl.setAttribute("loop-animation", "");
  }
}
