import { paths } from "./userinput/paths";
import { setMatrixWorld } from "../utils/three-utils";
import { SOUND_SYNC_IRL_START, SOUND_SYNC_IRL_COUNTDOWN, SOUND_SYNC_IRL_END } from "./sound-effects-system";
import qsTruthy from "../utils/qs_truthy";
const ENABLE_SYNC_IRL_FEATURE = qsTruthy("irl");
const TARGET_RIGHT_CONTROLLER_POSITION = new THREE.Vector3(0, 0, 0);
const SYNC_DELAY_MS = 3000; // Time between pressing the button and doing the sync
const COUNTDOWN_DELAY_MS = 1000; // Time between "beeps" leading up to doing the sync
const UP = new THREE.Vector3(0, 1, 0);

export class SyncIRLSystem {
  constructor() {
    this.syncInProgress = false;
    this.syncStartTime = 0;
    this.countdownSoundTime = 0;
  }
  tick(scene, userinput, sfx, time) {
    if (!ENABLE_SYNC_IRL_FEATURE) return;
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.syncIRL)) {
      this.syncInProgress = true;
      this.syncStartTime = time;
      this.countdownSoundTime = time;
      sfx.playSoundOneShot(SOUND_SYNC_IRL_START);
    }
    if (this.syncInProgress) {
      if (time - this.syncStartTime > SYNC_DELAY_MS) {
        this.syncInProgress = false;
        sfx.playSoundOneShot(SOUND_SYNC_IRL_END);
        this.syncIRL();
      } else if (time - this.countdownSoundTime > COUNTDOWN_DELAY_MS) {
        sfx.playSoundOneShot(SOUND_SYNC_IRL_COUNTDOWN);
        this.countdownSoundTime = time;
      }
    }
  }
  syncIRL = (function() {
    let leftController, rightController, avatarRig;
    const positionLeft = new THREE.Vector3(),
      positionRight = new THREE.Vector3(),
      basisXAxis = new THREE.Vector3(),
      basisYAxis = new THREE.Vector3(),
      basisZAxis = new THREE.Vector3(),
      sampledOrientation = new THREE.Matrix4(),
      sampledOrientationInverse = new THREE.Matrix4(),
      approxRigOrientationMat = new THREE.Matrix4(),
      rigOrientationInControllerSpace = new THREE.Matrix4(),
      desiredControllerOrientationMat = new THREE.Matrix4(),
      desiredRigOrientationMat = new THREE.Matrix4(),
      desiredRigOrientationQuat = new THREE.Quaternion(),
      desiredRigTransform = new THREE.Matrix4(),
      desiredRigPosition = new THREE.Vector3(),
      ONES = new THREE.Vector3(1, 1, 1),
      rigPosition = new THREE.Vector3();

    return function syncIRL() {
      avatarRig = avatarRig || document.getElementById("avatar-rig");
      leftController = leftController || document.getElementById("player-left-controller");
      rightController = rightController || document.getElementById("player-right-controller");
      avatarRig.object3D.updateMatrices();
      leftController.object3D.updateMatrices();
      rightController.object3D.updateMatrices();

      basisZAxis
        .subVectors(
          positionLeft.setFromMatrixPosition(leftController.object3D.matrixWorld),
          positionRight.setFromMatrixPosition(rightController.object3D.matrixWorld)
        )
        .projectOnPlane(UP)
        .normalize();
      basisYAxis.copy(UP);
      basisXAxis.crossVectors(basisYAxis, basisZAxis);
      sampledOrientation.makeBasis(basisXAxis, basisYAxis, basisZAxis);
      sampledOrientationInverse.getInverse(sampledOrientation);

      basisZAxis
        .setFromMatrixColumn(avatarRig.object3D.matrixWorld, 2)
        .projectOnPlane(UP)
        .normalize();
      basisYAxis.copy(UP);
      basisXAxis.crossVectors(basisYAxis, basisZAxis);
      approxRigOrientationMat.makeBasis(basisXAxis, basisYAxis, basisZAxis);

      rigOrientationInControllerSpace.multiplyMatrices(sampledOrientationInverse, approxRigOrientationMat);
      desiredControllerOrientationMat.identity();
      desiredRigOrientationMat.multiplyMatrices(desiredControllerOrientationMat, rigOrientationInControllerSpace);
      desiredRigTransform.compose(
        desiredRigPosition,
        desiredRigOrientationQuat.setFromRotationMatrix(desiredRigOrientationMat),
        ONES
      );
      setMatrixWorld(avatarRig.object3D, desiredRigTransform);

      // Orientation is correct, so now we translate the rig such that
      // the controller ends up in the position that we want
      rightController.object3D.updateMatrices();
      positionRight.setFromMatrixPosition(rightController.object3D.matrixWorld);
      rigPosition.setFromMatrixPosition(avatarRig.object3D.matrixWorld);
      desiredRigPosition.subVectors(rigPosition, positionRight).add(TARGET_RIGHT_CONTROLLER_POSITION);
      desiredRigTransform.compose(desiredRigPosition,
                                  desiredRigOrientationQuat,
                                  ONES);
      setMatrixWorld(avatarRig.object3D, desiredRigTransform);
    };
  })();
}
