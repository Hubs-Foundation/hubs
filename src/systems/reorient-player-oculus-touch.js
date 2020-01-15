import { v3String } from "../utils/pretty-print";
import { extractAxisAngle, setMatrixWorld } from "../utils/three-utils";
import qsTruthy from "../utils/qs_truthy";
import { paths } from "./userinput/paths";
const ENABLE_REORIENTATION_FEATURE = qsTruthy("reo");

// This axis is computed as follows:
// I put the oculus touch controller down on my desk, resting it on the ring.
// I extracted the rotation (matrix) from the player-right-controller's matrix.
// I converted this rotation matrix to a quaternion and put it into a collection.
// I rotated the oculus touch controller and resampled the controller, adding new quaternions to my collection.
// Now I had a collection of quaternions represented the orientation of the player-right-controller
// when it was resting on its ring.
// I took two quaternions from the collection and computed their difference: (qA_inverse * qB).
// I extracted the axis of the difference using extractAxisAngle.
// I did this a few more times choosing random pairs of quaternions from the collection, making sure
// that I got either the same axis or the reverse axis.
const EXPECTED_AXIS = new THREE.Vector3().set(0.004065492310506375, -0.6425824931271795, 0.766205724174066).normalize();
// With this axis I can figure out how to re-orient the player.
// I saved one of the quaternions from the initial collection: CONTROLLER_RESTING_ON_RING_QUATERNION
const CONTROLLER_RESTING_ON_RING_QUATERNION = new THREE.Quaternion().set(
  0.26699080915051965,
  0.39745257336123907,
  0.8684911690815028,
  -0.12833724706855257
);
const TARGET_CONTROLLER_POSITION = new THREE.Vector3().set(0, 0, 0);
function reorientPlayer() {
  const playerRightController = document.getElementById("player-right-controller");
  playerRightController.object3D.updateMatrices();
  // Now if the player presses the "reorient" I can compute the difference quaternion:
  const currentControllerQuaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().extractRotation(playerRightController.object3D.matrix)
  );
  const differenceQuaternion = new THREE.Quaternion().multiplyQuaternions(
    new THREE.Quaternion().copy(currentControllerQuaternion).inverse(),
    CONTROLLER_RESTING_ON_RING_QUATERNION
  );
  const diffAxis = new THREE.Vector3();
  const angle = extractAxisAngle(differenceQuaternion, diffAxis);
  // The diffAxis should be almost the same as the EXPECTED_AXIS
  function almostEqualVec3(u, v) {
    const epsilon = 0.05;
    return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
  }
  const same = almostEqualVec3(EXPECTED_AXIS, diffAxis);
  let reverse = false;
  if (!same) {
    const reverseDiffAxis = new THREE.Vector3().copy(diffAxis).multiplyScalar(-1);
    reverse = almostEqualVec3(EXPECTED_AXIS, reverseDiffAxis);
  }
  if (!same && !reverse) {
    console.error(
      "Can only re-orient the player if the controller is resting with its ring on a flat surface!",
      `Expected: ${v3String(EXPECTED_AXIS)}, got: ${v3String(diffAxis)}`,
      "This may happen when the current controller orientation is too similar to the rest orientation, causing the accuracy of the diffAxis to degrade significantly. This may be corrected by rotating the oculus touch controller 90 degrees or so (while keeping its ring on a flat surface)."
    );
    // TODO: We can fix the degraded accuracy issue by repeating this process again using an alternative rest quaternion, which is rotated about the expected axis by 90 degrees. We then have to make sure to correct for the 90 degree turn when calculating the final player rig orientation.
    return;
  }
  const angleToUse = reverse ? -1 * angle : angle;
  const avatarRig = document.getElementById("avatar-rig");
  avatarRig.object3D.updateMatrices();
  const avatarRigScale = new THREE.Vector3().setFromMatrixScale(avatarRig.object3D.matrixWorld);
  const avatarRigPosition = new THREE.Vector3().setFromMatrixPosition(avatarRig.object3D.matrixWorld);
  const quaternionToUse = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleToUse);
  const desiredAvatarRigQuaternion = new THREE.Quaternion()
    .setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))
    )
    .premultiply(quaternionToUse);
  const avatarRigTransform = new THREE.Matrix4().compose(
    avatarRigPosition,
    desiredAvatarRigQuaternion,
    avatarRigScale
  );
  setMatrixWorld(avatarRig.object3D, avatarRigTransform);

  // Orientation is set. Now find the offset that will put the controller at the world origin.
  const rigPos = new THREE.Vector3().setFromMatrixPosition(avatarRig.object3D.matrixWorld);
  playerRightController.object3D.updateMatrices();
  const controllerPos = new THREE.Vector3().setFromMatrixPosition(playerRightController.object3D.matrixWorld);
  const controllerToRig = new THREE.Vector3().subVectors(rigPos, controllerPos);
  const desiredRigPosition = new THREE.Vector3().addVectors(TARGET_CONTROLLER_POSITION, controllerToRig);
  avatarRigTransform.compose(
    desiredRigPosition,
    desiredAvatarRigQuaternion,
    avatarRigScale
  );
  setMatrixWorld(avatarRig.object3D, avatarRigTransform);
}

export class ReorientPlayerOculusTouchSystem {
  constructor() {}
  tick(userinput, scene) {
    if (!ENABLE_REORIENTATION_FEATURE) return;
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.reorientPlayerOculusTouch)) {
      reorientPlayer(false);
    }
  }
}
