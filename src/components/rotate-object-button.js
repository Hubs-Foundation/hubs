import { paths } from "../systems/userinput/paths";

const ROTATE_MODE = {
  AXIS: "axis",
  PUPPET: "puppet",
  GARY: "gary",
  FREE: "free",
  RESET: "reset"
};

AFRAME.registerComponent("rotate-button", {
  schema: {
    mode: {
      type: "string",
      oneof: [ROTATE_MODE.AXIS, ROTATE_MODE.PUPPET, ROTATE_MODE.GARY, ROTATE_MODE.FREE, ROTATE_MODE.RESET]
    },
    axis: { type: "vec3", default: null },
    doublePuppet: { type: "bool", default: false }
  },
  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
    this.onGrabStart = e => {
      if (!this.targetEl) {
        return;
      }
      const hand = e.detail.hand;
      hand.emit("haptic_pulse", { intensity: "high" });
      if (!NAF.utils.isMine(this.targetEl)) {
        if (!NAF.utils.takeOwnership(this.targetEl)) {
          return;
        }
      }
      if (this.targetEl.components.body) {
        this.targetEl.setAttribute("body", { type: "static" });
      }
      this.system = this.system || AFRAME.scenes[0].systems["rotate-selected-object"];
      this.system.rotate(this.targetEl.object3D, hand, this.data);
    };
  },
  update() {},
  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
  },
  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
  }
});

AFRAME.registerSystem("rotate-selected-object", {
  init() {
    this.o = null;
    this.mode = null;
    this.active = false;

    this.Oi = new THREE.Quaternion();
    this.Oc = new THREE.Quaternion();
    this.Ci = new THREE.Quaternion();
    this.Cc = new THREE.Quaternion();
    this.Cd = new THREE.Quaternion();
    this.snappedQ = new THREE.Quaternion();

    this.intersections = [];
    this.prevIntersectionPoint = new THREE.Vector3();
    this.initialIntersectionPoint = new THREE.Vector3();

    this.v = new THREE.Vector3();
    this.v2 = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.q2 = new THREE.Quaternion();
    this.eye = new THREE.Vector3();
    this.obj = new THREE.Vector3();
    this.eyeToObject = new THREE.Vector3();
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
    this.el.object3D.add(this.plane);
  },

  rotate(o, hand, data) {
    this.o = o;
    this.hand = hand.id === "cursor" ? document.querySelector("#player-right-controller").object3D : hand.object3D;
    this.mode = data.mode;
    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    switch (this.mode) {
      case ROTATE_MODE.AXIS:
        this.axis = data.axis;
      case ROTATE_MODE.GARY:
      case ROTATE_MODE.FREE:
        this.active = true;
        this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v);
        this.o.matrixWorld.decompose(this.plane.position, this.q, this.v);
        this.plane.matrixNeedsUpdate = true;
        this.plane.updateMatrixWorld(true);

        this.raycaster =
          this.raycaster || document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
        this.intersections.length = 0;
        const far = this.raycaster.far;
        this.raycaster.far = 1000;
        this.plane.raycast(this.raycaster, this.intersections);
        this.raycaster.far = far;
        this.initialIntersectionPoint = !!this.intersections[0] && this.intersections[0].point; // point
        this.prevIntersectionPoint.copy(this.initialIntersectionPoint);

        this.camera.matrixWorld.decompose(this.v, this.cameraWorldQuaternion, this.v);
        this.o.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);
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
        break;
      case ROTATE_MODE.RESET:
        this.active = false;
        this.camera = this.camera || document.querySelector("#player-camera").object3D;
        this.camera.getWorldPosition(this.eye);
        this.o.getWorldPosition(this.obj);
        this.up.set(0, 1, 0);
        this.eyeToObject.copy(this.obj).sub(this.eye);
        this.v
          .copy(this.eyeToObject)
          .projectOnPlane(this.up)
          .normalize();
        this.resetTarget.copy(this.obj).add(this.v);

        this.o.lookAt(this.resetTarget);
        this.o.position.y = this.eye.y;
        this.o.matrixNeedsUpdate = true;
        this.active = false;
        break;
      case ROTATE_MODE.PUPPET:
        this.active = true;
        this.doublePuppet = data.doublePuppet;
        this.hand.getWorldQuaternion(this.Ci);
        this.o.getWorldQuaternion(this.Oi);
        break;
      default:
        break;
    }
  },

  stopRotating() {
    this.active = false;
  },

  tick() {
    this.plane.material.visible = this.active && (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.AXIS);

    if (!this.active) {
      return;
    }
    if (this.el.systems.userinput.get(paths.actions.cursor.drop)) {
      this.active = false;
      return;
    }

    if (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.GARY || this.mode === ROTATE_MODE.AXIS) {
      this.camera.matrixNeedsUpdate = true;
      this.camera.updateMatrixWorld(true);
      this.o.matrixNeedsUpdate = true;
      this.o.updateMatrixWorld(true);

      this.camera.matrixWorld.decompose(this.v, this.plane.quaternion, this.v2);
      this.o.getWorldPosition(this.plane.position);
      const distance = this.v.sub(this.plane.position).length();

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

      if (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.GARY) {
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

        this.o.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);
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

        this.o.quaternion.premultiply(this.q).premultiply(this.q2);
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

        this.o.quaternion.multiply(this.q.setFromAxisAngle(this.axis, -this.sign * this.dzApplied));
      }

      this.o.matrixNeedsUpdate = true;
      this.prevIntersectionPoint.copy(intersection.point);
    } else if (this.mode === ROTATE_MODE.PUPPET) {
      this.hand.updateMatrixWorld(true);
      this.hand.getWorldQuaternion(this.Cc);
      this.Cd.multiplyQuaternions(this.Cc, this.Ci.clone().inverse());
      this.Oc.copy(this.Oi).premultiply(this.Cd);
      //this.euler = new THREE.Euler().setFromQuaternion(this.Oc);
      //const snap = Math.PI / 12;
      //this.euler.set(
      //  Math.round(this.euler.x / snap) * snap,
      //  Math.round(this.euler.y / snap) * snap,
      //  Math.round(this.euler.z / snap) * snap
      //);
      //this.q.setFromEuler(this.euler);
      this.o.quaternion.copy(this.Oc);
      this.o.matrixNeedsUpdate = true;
    }
  }
});

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
    }, 2000);
  }
});
