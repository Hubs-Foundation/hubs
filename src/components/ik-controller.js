import { defineQuery } from "bitecs";
import { CameraTool } from "../bit-components";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { FullBodyIKSolver } from "./tools/fullbody-ik-solver";
const { Vector3, Quaternion, Matrix4, Euler } = THREE;

function quaternionAlmostEquals(epsilon, u, v) {
  // Note: q and -q represent same rotation
  return (
    (Math.abs(u.x - v.x) < epsilon &&
      Math.abs(u.y - v.y) < epsilon &&
      Math.abs(u.z - v.z) < epsilon &&
      Math.abs(u.w - v.w) < epsilon) ||
    (Math.abs(-u.x - v.x) < epsilon &&
      Math.abs(-u.y - v.y) < epsilon &&
      Math.abs(-u.z - v.z) < epsilon &&
      Math.abs(-u.w - v.w) < epsilon)
  );
}

const cameraToolsQuery = defineQuery([CameraTool]);

/**
 * Provides access to the end effectors for IK.
 * @namespace avatar
 * @component ik-root
 */
AFRAME.registerComponent("ik-root", {
  schema: {
    camera: { type: "string", default: ".camera" },
    leftController: { type: "string", default: ".left-controller" },
    rightController: { type: "string", default: ".right-controller" }
  },
  update(oldData) {
    if (this.data.camera !== oldData.camera) {
      this.camera = this.el.querySelector(this.data.camera);
    }

    if (this.data.leftController !== oldData.leftController) {
      this.leftController = this.el.querySelector(this.data.leftController);
    }

    if (this.data.rightController !== oldData.rightController) {
      this.rightController = this.el.querySelector(this.data.rightController);
    }
  }
});

function findIKRoot(entity) {
  while (entity && !(entity.components && entity.components["ik-root"])) {
    entity = entity.parentNode;
  }
  return entity && entity.components["ik-root"];
}

const HAND_ROTATIONS = {
  left: new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, Math.PI / 2, 0)),
  right: new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, -Math.PI / 2, 0))
};

const angleOnXZPlaneBetweenMatrixRotations = (function () {
  const XZ_PLANE_NORMAL = new THREE.Vector3(0, -1, 0);
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  return function angleOnXZPlaneBetweenMatrixRotations(matrixA, matrixB) {
    v1.setFromMatrixColumn(matrixA, 2).projectOnPlane(XZ_PLANE_NORMAL);
    v2.setFromMatrixColumn(matrixB, 2).projectOnPlane(XZ_PLANE_NORMAL);
    return v1.angleTo(v2);
  };
})();

/**
 * Performs IK on a hip-rooted skeleton to align the hip, head and hands with camera and controller inputs.
 * @namespace avatar
 * @component ik-controller
 */
AFRAME.registerComponent("ik-controller", {
  schema: {
    rotationSpeed: { default: 8 },
    maxLerpAngle: { default: 90 * THREE.MathUtils.DEG2RAD },
    alwaysUpdate: { type: "boolean", default: false }
  },

  init() {
    this._runScheduledWork = this._runScheduledWork.bind(this);
    this._updateIsInView = this._updateIsInView.bind(this);

    this.flipY = new Matrix4().makeRotationY(Math.PI);

    this.cameraForward = new Matrix4();
    this.headTransform = new Matrix4();
    this.hipsPosition = new Vector3();

    this.invHipsToHeadVector = new Vector3();

    this.middleEyeMatrix = new Matrix4();
    this.middleEyePosition = new Vector3();
    this.invMiddleEyeToHead = new Matrix4();

    this.cameraYRotation = new Euler();
    this.cameraYQuaternion = new Quaternion();

    this.invHipsQuaternion = new Quaternion();
    this.headQuaternion = new Quaternion();

    this.rootToChest = new Matrix4();
    this.invRootToChest = new Matrix4();

    this.ikRoot = findIKRoot(this.el);

    this.isInView = true;
    this.hasConvergedHips = false;
    this.lastCameraTransform = new THREE.Matrix4();
    waitForDOMContentLoaded().then(() => {
      this.playerCamera = document.getElementById("viewing-camera").getObject3D("camera");
    });

    this.el.sceneEl.systems["frame-scheduler"].schedule(this._runScheduledWork, "ik");
    this.forceIkUpdate = true;
  },

  remove() {
    this.el.sceneEl.systems["frame-scheduler"].unschedule(this._runScheduledWork, "ik");
  },

  update(oldData) {
    this.avatar = this.el.object3D;

    this.head = this.avatar.getObjectByName('Head');
    this.neck = this.avatar.getObjectByName('Neck');
    this.chest = this.avatar.getObjectByName('Spine');

    const left = {
      eye: this.avatar.getObjectByName('LeftEye'),
      upperArm: this.avatar.getObjectByName('LeftUpperArm'),
      lowerArm: this.avatar.getObjectByName('LeftLowerArm'),
      hand: this.avatar.getObjectByName('LeftHand'),
      foot: this.avatar.getObjectByName('LeftFoot'),
    }

    const right = {
      eye: this.avatar.getObjectByName('RightEye'),
      upperArm: this.avatar.getObjectByName('RightUpperArm'),
      lowerArm: this.avatar.getObjectByName('RightLowerArm'),
      hand: this.avatar.getObjectByName('RightHand'),
      foot: this.avatar.getObjectByName('RightFoot'),
    }

    const hasArms = left.upperArm && right.upperArm

    if (hasArms) {
      var sphereGeometry = new THREE.SphereGeometry(0.00);

      left.handTarget = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      this.avatar.add(left.handTarget);

      right.handTarget = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
      this.avatar.add(right.handTarget);

      this.IKSolver = new FullBodyIKSolver({ left, right });
    }

    this.left = left
    this.right = right

    // Set middleEye's position to be right in the middle of the left and right eyes.
    this.middleEyePosition.addVectors(this.left.eye.position, this.right.eye.position);
    this.middleEyePosition.divideScalar(2);
    this.middleEyeMatrix.makeTranslation(this.middleEyePosition.x, this.middleEyePosition.y, this.middleEyePosition.z);
    this.invMiddleEyeToHead = this.middleEyeMatrix.copy(this.middleEyeMatrix).invert();

    this.invHipsToHeadVector.addVectors(this.chest.position, this.neck.position).add(this.head.position).negate();
  },

  tick(time, dt) {
    if (!this.ikRoot) {
      return;
    }

    const root = this.ikRoot.el.object3D;
    root.updateMatrices();
    const { camera, leftController, rightController } = this.ikRoot;

    camera.object3D.updateMatrix();

    const hasNewCameraTransform = !this.lastCameraTransform.equals(camera.object3D.matrix);

    // Optimization: if the camera hasn't moved and the hips converged to the target orientation on a previous frame,
    // then the avatar does not need any IK this frame.
    //
    // Update in-view avatars every frame, and update out-of-view avatars via frame scheduler.
    if (
      this.data.alwaysUpdate ||
      this.forceIkUpdate ||
      (this.isInView && (hasNewCameraTransform || !this.hasConvergedHips))
    ) {
      if (hasNewCameraTransform) {
        this.lastCameraTransform.copy(camera.object3D.matrix);
      }

      const {
        avatar,
        head,
        neck,
        chest,
        cameraForward,
        headTransform,
        invMiddleEyeToHead,
        invHipsToHeadVector,
        flipY,
        cameraYRotation,
        cameraYQuaternion,
        invHipsQuaternion,
        rootToChest,
        invRootToChest,
        left,
        right
      } = this;

      // Camera faces the -Z direction. Flip it along the Y axis so that it is +Z.
      cameraForward.multiplyMatrices(camera.object3D.matrix, flipY);

      // Compute the head position such that the hmd position would be in line with the middleEye
      headTransform.multiplyMatrices(cameraForward, invMiddleEyeToHead);

      if (left.foot && right.foot) {
        const leftEyePosition = new THREE.Vector3();
        left.eye.getWorldPosition(leftEyePosition);

        const rightEyePosition = new THREE.Vector3();
        right.eye.getWorldPosition(rightEyePosition);

        const averageEyePosition = new THREE.Vector3(
          (leftEyePosition.x + rightEyePosition.x) / 2,
          (leftEyePosition.y + rightEyePosition.y) / 2,
          (leftEyePosition.z + rightEyePosition.z) / 2
        );

        const avatarPosition = new THREE.Vector3();
        avatar.getWorldPosition(avatarPosition);

        const cameraHeight = averageEyePosition.y - avatarPosition.y;

        camera.object3D.position.y = cameraHeight;
        camera.matrixNeedsUpdate = true
      } else {
        // Then position the avatar such that the head is aligned with headTransform
        // (which positions middleEye in line with the hmd)
        //
        // Note that we position the avatar itself, *not* the hips, since positioning the
        // hips will use vertex skinning to do the root displacement, which results in
        // frustum culling errors since three.js does not take into account skinning when
        // computing frustum culling sphere bounds.
        avatar.position.setFromMatrixPosition(headTransform).add(invHipsToHeadVector);
        avatar.matrixNeedsUpdate = true;
      }

      // Animate the hip rotation to follow the Y rotation of the camera with some damping.
      cameraYRotation.setFromRotationMatrix(cameraForward, "YXZ");
      cameraYRotation.x = 0;
      cameraYRotation.z = 0;
      cameraYQuaternion.setFromEuler(cameraYRotation);

      if (this._hadFirstTick) {
        camera.object3D.updateMatrices();
        avatar.updateMatrices();
        // Note: Camera faces down -Z, avatar faces down +Z
        const yDelta = Math.PI - angleOnXZPlaneBetweenMatrixRotations(camera.object3D.matrixWorld, avatar.matrixWorld);

        if (yDelta > this.data.maxLerpAngle) {
          avatar.quaternion.copy(cameraYQuaternion);
        } else {
          avatar.quaternion.slerpQuaternions(
            avatar.quaternion,
            cameraYQuaternion,
            (this.data.rotationSpeed * dt) / 1000
          );
        }
      } else {
        avatar.quaternion.copy(cameraYQuaternion);
      }

      this.hasConvergedHips = quaternionAlmostEquals(0.0001, cameraYQuaternion, avatar.quaternion);

      // Take the head orientation computed from the hmd, remove the Y rotation already applied to it by the hips,
      // and apply it to the head
      invHipsQuaternion.copy(avatar.quaternion).invert();
      head.quaternion.setFromRotationMatrix(headTransform).premultiply(invHipsQuaternion);

      avatar.updateMatrix();
      rootToChest.multiplyMatrices(avatar.matrix, chest.matrix);
      invRootToChest.copy(rootToChest).invert();

      root.matrixNeedsUpdate = true;
      neck.matrixNeedsUpdate = true;
      head.matrixNeedsUpdate = true;
      chest.matrixNeedsUpdate = true;
    }

    const { left, right } = this;
    const hasArms = left.upperArm || right.upperArm

    if (hasArms) {
      this.updateHandForFullbody(leftController, rightController, left, right);
    }
    else {
      if (left.hand) this.updateHand(HAND_ROTATIONS.left, left.hand, leftController.object3D, true, this.isInView);
      if (right.hand) this.updateHand(HAND_ROTATIONS.right, right.hand, rightController.object3D, false, this.isInView);
    }

    this.forceIkUpdate = false;

    if (!this._hadFirstTick) {
      // Ensure the avatar is not shown until we've done our first IK step, to prevent seeing mis-oriented/t-pose pose or our own avatar at the wrong place.
      this.ikRoot.el.object3D.visible = true;
      this._hadFirstTick = true;
      this.el.emit("ik-first-tick");
    }
  },

  updateHand(handRotation, handObject3D, controllerObject3D, isLeft, isInView) {
    const handMatrix = handObject3D.matrix;

    // TODO: This coupling with personal-space-invader is not ideal.
    // There should be some intermediate thing managing multiple opinions about object visibility
    const spaceInvader = handObject3D.el.components["personal-space-invader"];

    if (spaceInvader) {
      // If this hand has an invader, defer to it to manage visibility overall but tell it to hide based upon controller state
      spaceInvader.setAlwaysHidden(!controllerObject3D.visible);
    } else {
      handObject3D.visible = controllerObject3D.visible;
    }

    // Optimization: skip IK update if not in view and not forced by frame scheduler
    if (controllerObject3D.visible && (isInView || this.forceIkUpdate || this.data.alwaysUpdate)) {
      handMatrix.multiplyMatrices(this.invRootToChest, controllerObject3D.matrix);

      handMatrix.multiply(handRotation);

      handObject3D.position.setFromMatrixPosition(handMatrix);
      handObject3D.rotation.setFromRotationMatrix(handMatrix);
      handObject3D.matrixNeedsUpdate = true;
    }
  },

  updateHandForFullbody(leftController, rightController, left, right) {
    const hasLeftController = leftController && leftController.object3D.visible

    if (hasLeftController) {
      const worldPosition = new THREE.Vector3();
      leftController.object3D.matrixWorld.decompose(worldPosition, new THREE.Quaternion(), new THREE.Vector3());

      left.handTarget.position.copy(this.avatar.worldToLocal(worldPosition.clone()))
      left.handTarget.matrixNeedsUpdate = true;
    }

    const hasRightController = rightController && rightController.object3D.visible

    if (hasRightController) {
      const worldPosition = new THREE.Vector3();
      rightController.object3D.matrixWorld.decompose(worldPosition, new THREE.Quaternion(), new THREE.Vector3());

      right.handTarget.position.copy(this.avatar.worldToLocal(worldPosition.clone()))
      right.handTarget.matrixNeedsUpdate = true;
    }

    if (this.IKSolver && (hasRightController || hasLeftController)) {
      this.IKSolver.update();

      left.upperArm.matrixNeedsUpdate = true;
      left.lowerArm.matrixNeedsUpdate = true;
      left.hand.matrixNeedsUpdate = true;

      right.upperArm.matrixNeedsUpdate = true;
      right.lowerArm.matrixNeedsUpdate = true;
      right.hand.matrixNeedsUpdate = true;
    }
  },
  _runScheduledWork() {
    // Every scheduled run, we force an IK update on the next frame (so at most one avatar with forced IK per frame)
    // and also update the this.isInView bit on the avatar which is used to determine if an IK update should be run
    // every frame.
    this.forceIkUpdate = true;

    this._updateIsInView();
  },

  _updateIsInView: (function () {
    const frustum = new THREE.Frustum();
    const frustumMatrix = new THREE.Matrix4();
    const tmpPos = new THREE.Vector3();
    const isInViewOfCamera = (screenCamera, pos) => {
      frustumMatrix.multiplyMatrices(screenCamera.projectionMatrix, screenCamera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(frustumMatrix);
      return frustum.containsPoint(pos);
    };

    return function () {
      if (!this.playerCamera || this.data.alwaysUpdate) return;

      const camera = this.ikRoot.camera.object3D;
      camera.getWorldPosition(tmpPos);

      // Check player camera
      this.isInView = isInViewOfCamera(this.playerCamera, tmpPos);

      if (!this.isInView) {
        const world = APP.world;
        // Check camera tools if they are rendering to viewfinder
        const cameraTools = cameraToolsQuery(world);
        for (const eid of cameraTools) {
          const screenObj = world.eid2obj.get(CameraTool.screenRef[eid]);
          const cameraObj = world.eid2obj.get(CameraTool.cameraRef[eid]);
          this.isInView = screenObj.visible && isInViewOfCamera(cameraObj, tmpPos);
          if (this.isInView) break;
        }
      }
    };
  })()
});
