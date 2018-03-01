const { Vector3, Quaternion, Matrix4, Euler } = THREE;

AFRAME.registerComponent("ik-root", {
  schema: {
    camera: { type: "string", default: ".camera" },
    leftController: { type: "string", default: ".left-controller" },
    rightController: { type: "string", default: ".right-controller" }
  },
  update(oldData) {
    let updated = false;

    if (this.data.camera !== oldData.camera) {
      this.camera = this.el.querySelector(this.data.camera);
      updated = true;
    }

    if (this.data.leftController !== oldData.leftController) {
      this.leftController = this.el.querySelector(this.data.leftController);
      updated = true;
    }

    if (this.data.rightController !== oldData.rightController) {
      this.rightController = this.el.querySelector(this.data.rightController);
      updated = true;
    }

    if (updated) {
      this.el.querySelector("[ik-controller]").components["ik-controller"].updateIkRoot(this);
    }
  }
});

AFRAME.registerComponent("ik-controller", {
  schema: {
    leftEye: { type: "string", default: ".LeftEye" },
    rightEye: { type: "string", default: ".RightEye" },
    middleEye: { type: "string", default: ".middle-eye" },
    head: { type: "string", default: ".Head" },
    neck: { type: "string", default: ".Neck" },
    leftHand: { type: "string", default: ".LeftHand" },
    rightHand: { type: "string", default: ".RightHand" },
    chest: { type: "string", default: ".Chest" },
    hips: { type: "string", default: ".Hips" },
    rotationSpeed: { default: 5 }
  },

  init() {
    this.flipY = new Matrix4().makeRotationY(Math.PI);

    this.cameraForward = new Matrix4();
    this.headTransform = new Matrix4();
    this.hipsPosition = new Vector3();

    this.invHipsToHeadVector = new Vector3();

    this.invMiddleEyeToHead = new Matrix4();

    this.cameraYRotation = new Euler();
    this.cameraYQuaternion = new Quaternion();

    this.invHipsQuaternion = new Quaternion();
    this.headQuaternion = new Quaternion();

    this.rootToChest = new Matrix4();
    this.invRootToChest = new Matrix4();

    this.hands = {
      left: {
        lastVisible: true,
        rotation: new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, Math.PI / 2, 0))
      },
      right: {
        lastVisible: true,
        rotation: new Matrix4().makeRotationFromEuler(new Euler(Math.PI / 2, Math.PI / 2, 0))
      }
    };

    this.headLastVisible = true;
  },

  update(oldData) {
    if (this.data.leftEye !== oldData.leftEye) {
      this.leftEye = this.el.querySelector(this.data.leftEye);
    }

    if (this.data.rightEye !== oldData.rightEye) {
      this.rightEye = this.el.querySelector(this.data.rightEye);
    }

    if (this.data.middleEye !== oldData.middleEye) {
      this.middleEye = this.el.querySelector(this.data.middleEye);
    }

    if (this.data.head !== oldData.head) {
      this.head = this.el.querySelector(this.data.head);
    }

    if (this.data.neck !== oldData.neck) {
      this.neck = this.el.querySelector(this.data.neck);
    }

    if (this.data.leftHand !== oldData.leftHand) {
      this.leftHand = this.el.querySelector(this.data.leftHand);
    }

    if (this.data.rightHand !== oldData.rightHand) {
      this.rightHand = this.el.querySelector(this.data.rightHand);
    }

    if (this.data.chest !== oldData.chest) {
      this.chest = this.el.querySelector(this.data.chest);
    }

    if (this.data.hips !== oldData.hips) {
      this.hips = this.el.querySelector(this.data.hips);
    }

    // Set middleEye's position to be right in the middle of the left and right eyes.
    const middleEyePosition = this.middleEye.object3D.position;
    middleEyePosition.addVectors(this.leftEye.object3D.position, this.rightEye.object3D.position);
    middleEyePosition.divideScalar(2);
    this.middleEye.object3D.updateMatrix();
    this.invMiddleEyeToHead.getInverse(this.middleEye.object3D.matrix);

    this.invHipsToHeadVector
      .addVectors(this.chest.object3D.position, this.neck.object3D.position)
      .add(this.head.object3D.position)
      .negate();
  },

  updateIkRoot(ikRoot) {
    this.ikRoot = ikRoot;
  },

  tick(time, dt) {
    if (!this.ikRoot) {
      return;
    }

    const { camera, leftController, rightController } = this.ikRoot;
    const {
      hips,
      head,
      chest,
      cameraForward,
      headTransform,
      invMiddleEyeToHead,
      invHipsToHeadVector,
      flipY,
      cameraYRotation,
      cameraYQuaternion,
      invHipsQuaternion,
      headQuaternion,
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

    // Then position the hips such that the head is aligned with headTransform (which positions middleEye in line with the hmd)
    hips.object3D.position.setFromMatrixPosition(headTransform).add(invHipsToHeadVector);

    // Animate the hip rotation to follow the Y rotation of the camera with some damping.
    cameraYRotation.setFromRotationMatrix(cameraForward, "YXZ");
    cameraYRotation.x = 0;
    cameraYRotation.z = 0;
    cameraYQuaternion.setFromEuler(cameraYRotation);
    Quaternion.slerp(
      hips.object3D.quaternion,
      cameraYQuaternion,
      hips.object3D.quaternion,
      this.data.rotationSpeed * dt / 1000
    );

    // Take the head orientation computed from the hmd, remove the Y rotation already applied to it by the hips, and apply it to the head
    invHipsQuaternion.copy(hips.object3D.quaternion).inverse();
    head.object3D.quaternion.setFromRotationMatrix(headTransform).premultiply(invHipsQuaternion);

    hips.object3D.updateMatrix();
    rootToChest.multiplyMatrices(hips.object3D.matrix, chest.object3D.matrix);
    invRootToChest.getInverse(rootToChest);

    this.updateHand("left", leftHand, leftController);
    this.updateHand("right", rightHand, rightController);

    if (head.object3D.visible) {
      if (!this.headLastVisible) {
        head.object3D.scale.set(1, 1, 1);
      }
    } else if (this.headLastVisible) {
      head.object3D.scale.set(0.0000001, 0.0000001, 0.0000001);
    }
  },

  updateHand(id, hand, controller) {
    const handObject3D = hand.object3D;
    const handMatrix = handObject3D.matrix;
    const controllerObject3D = controller.object3D;
    const handState = this.hands[id];

    if (controllerObject3D.visible) {
      if (!handState.lastVisible) {
        handObject3D.scale.set(1, 1, 1);
        handState.lastVisible = true;
      }
      handMatrix.multiplyMatrices(invRootToChest, controllerObject3D.matrix);

      const handControls = controller.components["hand-controls2"];

      if (handControls) {
        handMatrix.multiply(handControls.getControllerOffset());
      }

      handMatrix.multiply(handState.rotation);

      handObject3D.position.setFromMatrixPosition(handMatrix);
      handObject3D.rotation.setFromRotationMatrix(handMatrix);
    } else {
      if (handState.lastVisible) {
        handObject3D.scale.set(0.0000001, 0.0000001, 0.0000001);
        handState.lastVisible = false;
      }
    }
  }
});
