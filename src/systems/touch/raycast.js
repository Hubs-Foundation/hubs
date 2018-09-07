const raycaster = new THREE.Raycaster();

export const raycast = function raycast(coords) {
  const cameraEl = document.querySelector("#player-camera.camera[camera]");
  if (!cameraEl) return;
  const camera = cameraEl.components.camera.camera; // The THREE.js camera
  raycaster.setFromCamera(coords, camera);
  const intersects = raycaster.intersectObjects([cameraEl.sceneEl.object3D], true);
  for (let i = 0; i < intersects.length; i++) {
    const intersect = intersects[i].object;
    if (!intersect.el) continue;
    if (intersect.el.matches(".interactable, .interactable *, .ui, .ui *")) {
      return intersect.el;
    }
  }
  return;
};

window.raycast = raycast;
