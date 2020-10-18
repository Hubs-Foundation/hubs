export function removeNetworkedObject(scene, targetEl) {
  if (!NAF.utils.isMine(targetEl) && !NAF.utils.takeOwnership(targetEl)) return;

  targetEl.setAttribute("animation__remove", {
    property: "scale",
    dur: 200,
    to: { x: 0.01, y: 0.01, z: 0.01 },
    easing: "easeInQuad"
  });

  targetEl.addEventListener("animationcomplete", () => {
    scene.systems["hubs-systems"].cameraSystem.uninspect();
    NAF.utils.takeOwnership(targetEl);
    targetEl.parentNode.removeChild(targetEl);
  });
}
