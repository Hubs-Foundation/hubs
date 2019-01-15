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
        this,
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
    axis: { type: "vec3" },
    dualAxis: { default: false },
    gary: { default: false }
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
      AFRAME.scenes[0].systems["rotate-selected-object"].startRotating(
        this,
        this.targetEl.object3D,
        this.data.axis,
        this.data.dualAxis,
        this.data.gary
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

AFRAME.registerSystem("rotate-selected-object", {
  init() {
    this.ii = 0;
    this.target = null;
    this.targetButton = null;
    this.axis = new THREE.Vector3();

    this.initialOrientation = new THREE.Quaternion();
    this.deltaQuaternion = new THREE.Quaternion();
    this.newOrientation = new THREE.Quaternion();

    // O = object, C = controller, i = initial, c = current
    this.Oi = new THREE.Quaternion();
    this.Oc = new THREE.Quaternion();
    this.Ci = new THREE.Quaternion();
    this.Cc = new THREE.Quaternion();
    this.Cd = new THREE.Quaternion();
    this.snappedQ = new THREE.Quaternion();

    this.deltaRotationEuler = new THREE.Euler(0, 0, 0, "XYZ");
    this.deltaRotationQuaternion = new THREE.Quaternion();
    this.intersections = [];
    this.prevIntersectionPoint = new THREE.Vector3();
    this.initialIntersection = null;
    this.initialIntersectionPoint = new THREE.Vector3();

    this.u = new THREE.Vector3();
    this.v = new THREE.Vector3();
    this.v2 = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.q2 = new THREE.Quaternion();
    this.identityQuaternion = new THREE.Quaternion();
    this.eye = new THREE.Vector3();
    this.obj = new THREE.Vector3();
    this.eyeToObject = new THREE.Vector3();
    this.objectToEye = new THREE.Vector3();
    this.resetTarget = new THREE.Vector3();
    this.planeNormal = new THREE.Vector3();
    this.planarDifference = new THREE.Vector3();
    this.dPlanarDifference = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.right = new THREE.Vector3(1, 0, 0);

    this.dzAll = 0;
    this.dzStore = 0;
    this.dzApplied = 0;
    this.dyAll = 0;
    this.dyStore = 0;
    this.dyApplied = 0;

    this.initialPuppetHandQuaternion = new THREE.Quaternion();
    this.inverseInitialPuppetHandQuaternion = new THREE.Quaternion();
    this.initialPuppetObjQuaternion = new THREE.Quaternion();
    this.puppetHandQuaternion = new THREE.Quaternion();
    this.puppetObjQuaternion = new THREE.Quaternion();
    this.puppetDeltaQuaternion = new THREE.Quaternion();

    this.cameraWorldQuaternion = new THREE.Quaternion();
    this.objectWorldQuaternion = new THREE.Quaternion();

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
    //this.box = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.08), new THREE.MeshBasicMaterial());
    this.el.object3D.add(this.plane);
    //this.el.object3D.add(this.box);
  },

  startPuppeting(targetButton, target, hand, double) {
    this.targetButton = targetButton;
    this.target = target;
    if (hand.id === "cursor") {
      this.hand = document.querySelector("#player-right-controller");
    } else {
      this.hand = hand;
    }
    this.double = double;

    this.target.getWorldQuaternion(this.Oi);
    this.hand.object3D.getWorldQuaternion(this.Ci);
    //this.target.matrixWorld.decompose(this.box.position, this.q, this.v);
    this.puppetingInProgress = true;
  },

  startRotating(targetButton, target, axis, dualAxis, gary) {
    this.target = target;
    this.targetButton = targetButton;
    this.dualAxis = dualAxis;
    this.gary = gary;
    this.axis = axis;

    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v);
    this.target.matrixWorld.decompose(this.plane.position, this.q, this.v);
    //this.target.matrixWorld.decompose(this.box.position, this.q, this.v);
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
    this.initialIntersectionPoint = !!this.initialIntersection && this.initialIntersection.point; // point
    this.initialOrientation.copy(this.target.quaternion);
    this.prevIntersectionPoint.copy(this.initialIntersectionPoint);

    this.rotationInProgress = true;

    this.camera.matrixWorld.decompose(this.v, this.cameraWorldQuaternion, this.v);
    this.target.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);
    this.v.set(0, 0, -1).applyQuaternion(this.cameraWorldQuaternion);
    this.v2.set(0, 0, -1).applyQuaternion(this.objectWorldQuaternion);
    this.sign = this.v.dot(this.v2) > 0 ? 1 : -1;

    this.v.set(0, 1, 0); //.applyQuaternion(this.cameraWorldQuaternion);
    this.v2.set(0, 1, 0).applyQuaternion(this.objectWorldQuaternion);
    this.sign2 = this.v.dot(this.v2) > 0 ? 1 : -1;

    this.v.set(1, 0, 0).applyQuaternion(this.cameraWorldQuaternion);
    this.v2.set(1, 0, 0);
    this.sign3 = this.v.dot(this.v2) > 0 ? 1 : -1;

    this.v.set(1, 0, 0).applyQuaternion(this.cameraWorldQuaternion);
    this.v2.set(1, 0, 0);
    this.sign4 = this.v.dot(this.v2) > 0 ? 1 : -1;

    this.dyAll = 0;
    this.dyStore = 0;
    this.dyApplied = 0;
    this.dzAll = 0;
    this.dzStore = 0;
    this.dzApplied = 0;
  },

  stopRotating() {
    this.rotationInProgress = false;
    this.puppetingInProgress = false;
  },

  reset(object3D) {
    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    this.camera.getWorldPosition(this.eye);
    object3D.getWorldPosition(this.obj);
    this.up.set(0, 1, 0);
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
      this.camera.matrixNeedsUpdate = true;
      this.camera.updateMatrixWorld(true);
      this.target.matrixNeedsUpdate = true;
      this.target.updateMatrixWorld(true);

      this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v2);
      this.target.getWorldPosition(this.plane.position);
      const distance = this.v.sub(this.plane.position).length();

      //this.targetButton.el.object3D.getWorldPosition(this.plane.position);
      this.plane.matrixNeedsUpdate = true;
      this.plane.updateMatrixWorld(true);

      this.intersections.length = 0;
      const far = this.raycaster.far;
      this.raycaster.far = 1000;
      this.plane.raycast(this.raycaster, this.intersections);
      this.raycaster.far = far;
      const intersection = this.intersections[0]; // point
      if (!intersection) return;

      this.planeNormal.set(0, 0, -1).applyQuaternion(this.plane.quaternion);

      const useFreeRotate = this.gary || this.dualAxis;
      if (useFreeRotate) {
        const boost = AFRAME.scenes[0].systems.userinput.get(paths.actions.boost);
        this.dualAxis = !boost;
        this.gary = boost;
        this.planarDifference.copy(intersection.point).sub(this.initialIntersectionPoint);
        this.dPlanarDifference.copy(intersection.point).sub(this.prevIntersectionPoint);
        const differenceInPlane = this.planarDifference.clone().projectOnPlane(this.planeNormal);
        const dDifferenceInPlane = this.dPlanarDifference
          .clone()
          .projectOnPlane(this.planeNormal)
          .multiplyScalar(5 / distance)
          .applyQuaternion(this.plane.quaternion.clone().inverse());
        if (dDifferenceInPlane.lengthSq() < 0.00001) {
          return;
        }

        const stepLength = Math.PI / 6;
        this.dyAll = this.dyStore + dDifferenceInPlane.y;
        this.dyApplied = this.dualAxis ? Math.round(this.dyAll / stepLength) * stepLength : this.dyAll;
        this.dyStore = this.dyAll - this.dyApplied;

        this.dzAll = this.dzStore + dDifferenceInPlane.x;
        this.dzApplied = this.dualAxis ? Math.round(this.dzAll / stepLength) * stepLength : this.dzAll;
        this.dzStore = this.dzAll - this.dzApplied;

        this.target.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);
        this.right
          .set(1, 0, 0)
          .applyQuaternion(this.dualAxis ? this.objectWorldQuaternion : this.cameraWorldQuaternion);
        this.q.setFromAxisAngle(this.right, this.dualAxis ? this.sign2 * this.sign * -this.dyApplied : -this.dyApplied);

        if (this.dualAxis) {
          this.up.set(0, 1, 0);
        } else {
          this.up.set(0, 1, 0).applyQuaternion(this.cameraWorldQuaternion);
        }
        this.q2.setFromAxisAngle(this.up, this.dzApplied);

        this.target.quaternion.premultiply(this.q).premultiply(this.q2);
      } else {
        this.dPlanarDifference.copy(intersection.point).sub(this.prevIntersectionPoint);
        const dDifferenceInPlane = this.dPlanarDifference
          .clone()
          .projectOnPlane(this.planeNormal)
          .multiplyScalar(5 / distance)
          .applyQuaternion(this.plane.quaternion.clone().inverse());
        if (dDifferenceInPlane.lengthSq() < 0.00001) {
          return;
        }

        const rotationSnap = Math.PI / 8;
        this.dzAll = this.dzStore + dDifferenceInPlane.x;
        this.dzApplied = Math.round(this.dzAll / rotationSnap) * rotationSnap;
        this.dzStore = this.dzAll - this.dzApplied;

        this.target.quaternion.copy(
          this.newOrientation
            .copy(this.target.quaternion)
            .multiply(this.deltaQuaternion.setFromAxisAngle(this.axis, -this.sign * this.dzApplied))
        );
      }

      this.target.matrixNeedsUpdate = true;
      this.prevIntersectionPoint.copy(intersection.point);
    } else if (this.puppetingInProgress) {
      this.hand.object3D.updateMatrixWorld(true);
      this.hand.object3D.getWorldQuaternion(this.Cc);
      this.Cd.multiplyQuaternions(this.Cc, this.Ci.clone().inverse());
      this.Oc.copy(this.Oi).premultiply(this.Cd);
      this.target.quaternion.copy(this.Oc);
      this.target.matrixNeedsUpdate = true;
    }
  }
});
