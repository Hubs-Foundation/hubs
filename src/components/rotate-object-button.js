import { paths } from "../systems/userinput/paths";

AFRAME.registerComponent("exist-if-threedof", {
  schema: {
    existIf3DOF: { default: true }
  },
  init() {
    window.setTimeout(() => {
      const userinput = AFRAME.scenes[0].systems.userinput;
      const threeDOF = !!(
        userinput.get(paths.device.gearVRController.pose) ||
        userinput.get(paths.device.oculusgo.pose) ||
        userinput.get(paths.actions.rayObjectRotation)
      );
      if (threeDOF !== this.data.existIf3DOF) {
        this.el.parentNode.removeChild(this.el);
      }
    }, 3000);
  }
});

AFRAME.registerComponent("rotate-object-like-a-puppet-button", {
  schema: {
    double: { default: false }
  },
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onGrabStart = e => {
      if (!this.targetEl) {
        return;
      }
      this.hand = e.detail.hand;
      this.hand.emit("haptic_pulse", { intensity: "high" });
      if (!NAF.utils.isMine(this.targetEl)) {
        if (!NAF.utils.takeOwnership(this.targetEl)) {
          return;
        }
      }
      if (this.targetEl.components.body) {
        this.targetEl.setAttribute("body", { type: "static" });
      }
      AFRAME.scenes[0].systems["rotate-selected-object"].startPuppeting(
        this.targetEl.object3D,
        this.hand,
        this.data.double
      );
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
  }
});

AFRAME.registerComponent("reset-object-orientation-button", {
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onGrabStart = e => {
      if (!this.targetEl) {
        return;
      }
      this.hand = e.detail.hand;
      this.hand.emit("haptic_pulse", { intensity: "high" });
      if (!NAF.utils.isMine(this.targetEl)) {
        if (!NAF.utils.takeOwnership(this.targetEl)) {
          return;
        }
      }
      if (this.targetEl.components.body) {
        this.targetEl.setAttribute("body", { type: "static" });
      }
      AFRAME.scenes[0].systems["rotate-selected-object"].reset(this.targetEl.object3D);
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
  }
});

AFRAME.registerComponent("rotate-object-on-axis-button", {
  schema: {
    axis: { type: "vec3" }
  },

  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });

    this.onGrabStart = e => {
      if (!this.targetEl) {
        return;
      }
      this.hand = e.detail.hand;
      this.hand.emit("haptic_pulse", { intensity: "high" });
      if (!NAF.utils.isMine(this.targetEl)) {
        if (!NAF.utils.takeOwnership(this.targetEl)) {
          return;
        }
      }
      if (this.targetEl.components.body) {
        this.targetEl.setAttribute("body", { type: "static" });
      }
      AFRAME.scenes[0].systems["rotate-selected-object"].startRotating(this.targetEl.object3D, this.data.axis);
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
  }
});

AFRAME.registerSystem("rotate-selected-object", {
  init() {
    this.target = null;
    this.axis = new THREE.Vector3();

    this.initialIntersection = null;
    this.initialOrientation = new THREE.Quaternion();
    this.deltaQuaternion = new THREE.Quaternion();
    this.newOrientation = new THREE.Quaternion();

    this.deltaRotationEuler = new THREE.Euler(0, 0, 0, "XYZ");
    this.deltaRotationQuaternion = new THREE.Quaternion();
    this.intersections = [];

    this.u = new THREE.Vector3();
    this.v = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.identityQuaternion = new THREE.Quaternion();
    this.eye = new THREE.Vector3();
    this.obj = new THREE.Vector3();
    this.eyeToObject = new THREE.Vector3();
    this.objectToEye = new THREE.Vector3();
    this.resetTarget = new THREE.Vector3();
    this.planeNormal = new THREE.Vector3();
    this.planarDifference = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.right = new THREE.Vector3(1, 0, 0);

    this.initialPuppetHandQuaternion = new THREE.Quaternion();
    this.inverseInitialPuppetHandQuaternion = new THREE.Quaternion();
    this.initialPuppetObjQuaternion = new THREE.Quaternion();
    this.puppetHandQuaternion = new THREE.Quaternion();
    this.puppetObjQuaternion = new THREE.Quaternion();
    this.puppetDeltaQuaternion = new THREE.Quaternion();

    this.plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
      new THREE.MeshBasicMaterial({
        visible: true,
        wireframe: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      })
    );
    this.el.object3D.add(this.plane);
  },

  startPuppeting(target, hand, double) {
    this.double = double;
    this.hand = hand;
    if (this.hand.id === "cursor" || this.hand.id === "player-right-controller") {
      this.posePath = paths.actions.rightHand.pose;
    } else if (this.hand.id === "player-left-controller") {
      this.posePath = paths.actions.leftHand.pose;
    }

    this.target = target;
    const userinput = this.el.systems.userinput;
    this.initialPuppetHandQuaternion.copy(userinput.get(paths.actions.rayObjectRotation));
    target.matrixWorld.decompose(this.v, this.initialPuppetObjQuaternion, this.v);
    this.puppetHandQuaternion.copy(userinput.get(paths.actions.rayObjectRotation));
    target.matrixWorld.decompose(this.v, this.puppetObjQuaternion, this.v);
    this.puppetingInProgress = true;
  },

  startRotating(target, axis) {
    this.target = target;
    this.axis = axis;

    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v);
    this.target.matrixWorld.decompose(this.plane.position, this.q, this.v);
    this.plane.matrixNeedsUpdate = true;
    this.plane.updateMatrixWorld(true);

    this.raycaster =
      this.raycaster || document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
    this.intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    this.plane.raycast(this.raycaster, this.intersections);
    this.raycaster.far = far;
    this.initialIntersection = this.intersections[0]; // point
    this.initialOrientation.copy(this.target.quaternion);
    this.prevIntersection = this.initialIntersection;

    this.rotationInProgress = true;
  },

  stopRotating() {
    this.rotationInProgress = false;
    this.puppetingInProgress = false;
  },

  reset(object3D) {
    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    this.camera.getWorldPosition(this.eye);
    object3D.getWorldPosition(this.obj);
    this.eyeToObject.copy(this.obj).sub(this.eye);
    this.v
      .copy(this.eyeToObject)
      .projectOnPlane(this.up)
      .normalize();
    this.resetTarget.copy(this.obj).add(this.v);

    object3D.lookAt(this.resetTarget);
    object3D.position.y = this.eye.y;
    object3D.matrixNeedsUpdate = true;
  },

  tick() {
    this.plane.material.visible = this.rotationInProgress;
    if (!this.rotationInProgress && !this.puppetingInProgress) {
      return;
    }
    if (this.el.systems.userinput.get(paths.actions.cursor.drop)) {
      this.stopRotating();
    }

    if (this.rotationInProgress) {
      this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v);
      this.target.getWorldPosition(this.plane.position);
      this.plane.matrixNeedsUpdate = true;
      this.plane.updateMatrixWorld(true);

      this.intersections.length = 0;
      const far = this.raycaster.far;
      this.raycaster.far = 1000;
      this.plane.raycast(this.raycaster, this.intersections);
      this.raycaster.far = far;
      const intersection = this.intersections[0]; // point
      if (!intersection) return;

      this.camera.getWorldPosition(this.eye);
      this.target.getWorldPosition(this.obj);
      this.objectToEye.copy(this.eye).sub(this.obj);
      this.planeNormal.copy(this.objectToEye).normalize();

      const useFreeRotate = this.axis.x === 0 && this.axis.y === 0 && this.axis.z === 0;
      if (useFreeRotate) {
        this.planarDifference.copy(intersection.point).sub(this.prevIntersection.point);
        const differenceInPlane = this.planarDifference.projectOnPlane(this.planeNormal);
        if (differenceInPlane.lengthSq() < 0.0001) {
          return;
        }
        this.right.set(1, 0, 0);
        this.up.set(0, 1, 0);
        this.cameraWorldQuaternion = new THREE.Quaternion();
        this.objectWorldQuaternion = new THREE.Quaternion();
        this.camera.matrixWorld.decompose(this.v, this.cameraWorldQuaternion, this.v);
        this.target.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);
        const sensitivity = 3;
        this.q.setFromAxisAngle(
          this.right.applyQuaternion(this.cameraWorldQuaternion),
          -differenceInPlane.y * sensitivity
        );
        this.target.quaternion.multiplyQuaternions(this.q, this.target.quaternion);
        this.target.updateMatrixWorld(true);
        const sign =
          this.objectToEye.dot(new THREE.Vector3(0, 0, 1).applyQuaternion(this.objectWorldQuaternion)) > 0 ? 1 : -1;
        this.q.setFromAxisAngle(
          this.up.applyQuaternion(this.cameraWorldQuaternion),
          sign * differenceInPlane.x * sensitivity
        );
        this.target.quaternion.multiplyQuaternions(this.q, this.target.quaternion);
      } else {
        this.planarDifference.copy(intersection.point).sub(this.initialIntersection.point);
        const differenceInPlane = this.planarDifference.projectOnPlane(this.planeNormal);
        if (differenceInPlane.lengthSq() < 0.01) {
          return;
        }
        const rotationAngle = (10 * differenceInPlane.x) / this.obj.distanceTo(this.eye);
        const rotationSnap = Math.PI / 8;
        const snappedRotation = Math.round(rotationAngle / rotationSnap) * rotationSnap;

        this.target.quaternion.copy(
          this.newOrientation
            .copy(this.initialOrientation)
            .multiply(this.deltaQuaternion.setFromAxisAngle(this.axis, snappedRotation))
        );
      }

      this.target.matrixNeedsUpdate = true;
      this.prevIntersection = intersection;
    } else if (this.puppetingInProgress) {
      const userinput = this.el.systems.userinput;
      this.puppetHandQuaternion.copy(userinput.get(paths.actions.rayObjectRotation));
      this.inverseInitialPuppetHandQuaternion.copy(this.initialPuppetHandQuaternion).inverse();
      this.puppetDeltaQuaternion.copy(this.puppetHandQuaternion).premultiply(this.inverseInitialPuppetHandQuaternion);
      this.target.quaternion.multiplyQuaternions(this.initialPuppetObjQuaternion, this.puppetDeltaQuaternion);
      this.target.updateMatrixWorld(true);
      if (this.double) {
        this.target.quaternion.multiply(this.puppetDeltaQuaternion);
        this.target.updateMatrixWorld(true);
      }
      this.target.matrixNeedsUpdate = true;
    }
  }
});
