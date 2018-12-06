const { Vector3, Quaternion, Matrix4, Euler } = THREE;
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

/**
 * Performs IK on a hip-rooted skeleton to align the hip, head and hands with camera and controller inputs.
 * @namespace avatar
 * @component ik-controller
 */
AFRAME.registerComponent("ik-controller", {
  schema: {
    leftEye: { type: "string", default: "LeftEye" },
    rightEye: { type: "string", default: "RightEye" },
    head: { type: "string", default: "Head" },
    neck: { type: "string", default: "Neck" },
    leftHand: { type: "string", default: "LeftHand" },
    rightHand: { type: "string", default: "RightHand" },
    chest: { type: "string", default: "Chest" },
    hips: { type: "string", default: "Hips" },
    rotationSpeed: { default: 5 }
  },

  init() {
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

    this.hands = {
      left: {
        rotation: new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, Math.PI / 2, 0))
      },
      right: {
        rotation: new Matrix4().makeRotationFromEuler(new Euler(Math.PI / 2, Math.PI / 2, 0))
      }
    };
  },

  update(oldData) {
    if (this.data.leftEye !== oldData.leftEye) {
      this.leftEye = this.el.object3D.getObjectByName(this.data.leftEye);
    }

    if (this.data.rightEye !== oldData.rightEye) {
      this.rightEye = this.el.object3D.getObjectByName(this.data.rightEye);
    }

    if (this.data.head !== oldData.head) {
      this.head = this.el.object3D.getObjectByName(this.data.head);
    }

    if (this.data.neck !== oldData.neck) {
      this.neck = this.el.object3D.getObjectByName(this.data.neck);
    }

    if (this.data.leftHand !== oldData.leftHand) {
      this.leftHand = this.el.object3D.getObjectByName(this.data.leftHand);
    }

    if (this.data.rightHand !== oldData.rightHand) {
      this.rightHand = this.el.object3D.getObjectByName(this.data.rightHand);
    }

    if (this.data.chest !== oldData.chest) {
      this.chest = this.el.object3D.getObjectByName(this.data.chest);
    }

    if (this.data.hips !== oldData.hips) {
      this.hips = this.el.object3D.getObjectByName(this.data.hips);
    }

    // Set middleEye's position to be right in the middle of the left and right eyes.
    this.middleEyePosition.addVectors(this.leftEye.position, this.rightEye.position);
    this.middleEyePosition.divideScalar(2);
    this.middleEyeMatrix.makeTranslation(this.middleEyePosition.x, this.middleEyePosition.y, this.middleEyePosition.z);
    this.invMiddleEyeToHead = this.middleEyeMatrix.getInverse(this.middleEyeMatrix);

    this.invHipsToHeadVector
      .addVectors(this.chest.position, this.neck.position)
      .add(this.head.position)
      .negate();
  },

  tick(time, dt) {
    if (!this.ikRoot) {
      return;
    }

    const root = this.ikRoot.el.object3D;
    const { camera, leftController, rightController } = this.ikRoot;
    const {
      hips,
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
      leftHand,
      rightHand,
      rootToChest,
      invRootToChest
    } = this;

    // Camera faces the -Z direction. Flip it along the Y axis so that it is +Z.
    camera.object3D.updateMatrix();
    cameraForward.multiplyMatrices(camera.object3D.matrix, flipY);

    // Compute the head position such that the hmd position would be in line with the middleEye
    headTransform.multiplyMatrices(cameraForward, invMiddleEyeToHead);

    // Then position the hips such that the head is aligned with headTransform
    // (which positions middleEye in line with the hmd)
    hips.position.setFromMatrixPosition(headTransform).add(invHipsToHeadVector);

    // Animate the hip rotation to follow the Y rotation of the camera with some damping.
    cameraYRotation.setFromRotationMatrix(cameraForward, "YXZ");
    cameraYRotation.x = 0;
    cameraYRotation.z = 0;
    cameraYQuaternion.setFromEuler(cameraYRotation);
    Quaternion.slerp(hips.quaternion, cameraYQuaternion, hips.quaternion, (this.data.rotationSpeed * dt) / 1000);

    // Take the head orientation computed from the hmd, remove the Y rotation already applied to it by the hips,
    // and apply it to the head
    invHipsQuaternion.copy(hips.quaternion).inverse();
    head.quaternion.setFromRotationMatrix(headTransform).premultiply(invHipsQuaternion);

    hips.updateMatrix();
    rootToChest.multiplyMatrices(hips.matrix, chest.matrix);
    invRootToChest.getInverse(rootToChest);

    root.matrixNeedsUpdate = true;
    neck.matrixNeedsUpdate = true;
    head.matrixNeedsUpdate = true;
    chest.matrixNeedsUpdate = true;

    this.updateHand(this.hands.left, leftHand, leftController, true);
    this.updateHand(this.hands.right, rightHand, rightController, false);
  },

  updateHand(handState, handObject3D, controller, isLeft) {
    const hand = handObject3D.el;
    const handMatrix = handObject3D.matrix;
    const controllerObject3D = controller.object3D;

    // TODO: This coupling with personal-space-invader is not ideal.
    // There should be some intermediate thing managing multiple opinions about object visibility
    const spaceInvader = hand.components["personal-space-invader"];
    const handHiddenByPersonalSpace = spaceInvader && spaceInvader.invading;

    handObject3D.visible = !handHiddenByPersonalSpace && controllerObject3D.visible;

    if (controllerObject3D.visible) {
      handMatrix.multiplyMatrices(this.invRootToChest, controllerObject3D.matrix);

      const handControls = controller.components["hand-controls2"];

      if (handControls) {
        handMatrix.multiply(isLeft ? handControls.getLeftControllerOffset() : handControls.getRightControllerOffset());
      }

      handMatrix.multiply(handState.rotation);

      handObject3D.position.setFromMatrixPosition(handMatrix);
      handObject3D.rotation.setFromRotationMatrix(handMatrix);
      handObject3D.matrixNeedsUpdate = true;
    }
  }
});
