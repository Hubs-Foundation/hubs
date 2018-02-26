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
    rotationSpeed: { default: 5 },
    debug: { type: "boolean", default: true }
  },

  init() {
    this.flipY = new Matrix4().makeRotationY(Math.PI);

    this.cameraForward = new Matrix4();
    this.headTransform = new Matrix4();
    this.hipsPosition = new Vector3();

    this.iHipsToHeadVector = new Vector3();

    this.iMiddleEyeToHead = new Matrix4();
    this.iHeadToHip = new Matrix4();

    this.cameraYRotation = new Euler();
    this.cameraYQuaternion = new Quaternion();

    this.hipsQuaternion = new Quaternion();
    this.headQuaternion = new Quaternion();

    this.rootToChest = new Matrix4();
    this.iRootToChest = new Matrix4();

    this.headLastVisible = true;
    this.leftHandLastVisible = true;
    this.rightHandLastVisible = true;

    this.leftHandRotation = new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, Math.PI / 2, 0));
    this.rightHandRotation = new Matrix4().makeRotationFromEuler(new Euler(Math.PI / 2, Math.PI / 2, 0));
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
    this.iMiddleEyeToHead.getInverse(this.middleEye.object3D.matrix);

    this.iHipsToHeadVector
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
      iMiddleEyeToHead,
      iHipsToHeadVector,
      flipY,
      cameraYRotation,
      cameraYQuaternion,
      hipsQuaternion,
      headQuaternion,
      leftHand,
      rightHand,
      rootToChest,
      iRootToChest
    } = this;

    // Camera faces the -Z direction. Flip it along the Y axis so that it is +Z.
    camera.object3D.updateMatrix();
    cameraForward.multiplyMatrices(camera.object3D.matrix, flipY);

    headTransform.multiplyMatrices(cameraForward, iMiddleEyeToHead);
    hips.object3D.position.setFromMatrixPosition(headTransform).add(iHipsToHeadVector);

    cameraYRotation.setFromRotationMatrix(cameraForward, "YXZ");
    cameraYRotation.x = 0;
    cameraYRotation.z = 0;
    cameraYQuaternion.setFromEuler(cameraYRotation);
    Quaternion.slerp(hips.object3D.quaternion, cameraYQuaternion, hipsQuaternion, this.data.rotationSpeed * dt / 1000);
    hips.object3D.quaternion.copy(hipsQuaternion);

    headQuaternion.setFromRotationMatrix(headTransform).premultiply(hipsQuaternion.inverse());

    head.object3D.quaternion.copy(headQuaternion);
    hips.object3D.updateMatrix();
    rootToChest.multiplyMatrices(hips.object3D.matrix, chest.object3D.matrix);
    iRootToChest.getInverse(rootToChest);

    if (leftController.object3D.visible) {
      if (!this.leftHandLastVisible) {
        leftHand.object3D.scale.set(1, 1, 1);
        this.leftHandLastVisible = true;
      }

      leftHand.object3D.matrix
        .multiplyMatrices(iRootToChest, leftController.object3D.matrix)
        .multiply(leftController.components["hand-controls2"].getControllerOffset())
        .multiply(this.leftHandRotation);

      leftHand.object3D.position.setFromMatrixPosition(leftHand.object3D.matrix);
      leftHand.object3D.rotation.setFromRotationMatrix(leftHand.object3D.matrix);
    } else {
      if (this.leftHandLastVisible) {
        leftHand.object3D.scale.set(0.0000001, 0.0000001, 0.0000001);
        this.leftHandLastVisible = false;
      }
    }

    if (rightController.object3D.visible) {
      if (!this.rightHandLastVisible) {
        rightHand.object3D.scale.set(1, 1, 1);
        this.rightHandLastVisible = true;
      }
      rightHand.object3D.matrix
        .multiplyMatrices(iRootToChest, rightController.object3D.matrix)
        .multiply(rightController.components["hand-controls2"].getControllerOffset())
        .multiply(this.rightHandRotation);

      rightHand.object3D.position.setFromMatrixPosition(rightHand.object3D.matrix);
      rightHand.object3D.rotation.setFromRotationMatrix(rightHand.object3D.matrix);
    } else {
      if (this.rightHandLastVisible) {
        rightHand.object3D.scale.set(0.0000001, 0.0000001, 0.0000001);
        this.rightHandLastVisible = false;
      }
    }

    if (head.object3D.visible) {
      if (!this.headLastVisible) {
        head.object3D.scale.set(1, 1, 1);
      }
    } else if (this.headLastVisible) {
      head.object3D.scale.set(0.0000001, 0.0000001, 0.0000001);
    }
  }
});
