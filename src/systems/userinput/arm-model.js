// Vector from eyes to elbow (divided by user height).
const EYES_TO_ELBOW = { x: 0.175, y: -0.3, z: -0.03 };
// Vector from eyes to elbow (divided by user height).
const FOREARM = { x: 0, y: 0, z: -0.175 };

export const applyArmModel = (function() {
  const controllerEuler = new THREE.Euler();
  const deltaControllerPosition = new THREE.Vector3();
  const controllerQuaternion = new THREE.Quaternion();
  const controllerPosition = new THREE.Vector3();
  return function applyArmModel(gamepadPose, hand, headObject3D, userHeight) {
    headObject3D.updateMatrices();
    controllerPosition.copy(headObject3D.position);
    controllerPosition.y = controllerPosition.y - userHeight;
    deltaControllerPosition.set(
      EYES_TO_ELBOW.x * (hand === "left" ? -1 : hand === "right" ? 1 : 0),
      EYES_TO_ELBOW.y,
      EYES_TO_ELBOW.z
    );
    deltaControllerPosition.multiplyScalar(userHeight);
    deltaControllerPosition.applyAxisAngle(headObject3D.up, headObject3D.rotation.y);
    controllerPosition.add(deltaControllerPosition);
    deltaControllerPosition.set(FOREARM.x, FOREARM.y, FOREARM.z);
    deltaControllerPosition.multiplyScalar(userHeight);
    controllerQuaternion.fromArray(gamepadPose.orientation);
    controllerEuler.setFromQuaternion(controllerQuaternion);
    controllerEuler.set(controllerEuler.x, controllerEuler.y, 0);
    deltaControllerPosition.applyEuler(controllerEuler);
    controllerPosition.add(deltaControllerPosition);
    return controllerPosition;
  };
})();
