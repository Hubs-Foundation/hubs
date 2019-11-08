export const getCurrentPlayerHeight = (function() {
  let avatarPOV;
  let avatarRig;
  return function getCurrentPlayerHeight() {
    avatarPOV = avatarPOV || document.getElementById("avatar-pov-node");
    avatarRig = avatarRig || document.getElementById("avatar-rig");
    avatarPOV.object3D.updateMatrices();
    avatarRig.object3D.updateMatrices();
    return avatarPOV.object3D.matrixWorld.elements[13] - avatarRig.object3D.matrixWorld.elements[13];
  };
})();
