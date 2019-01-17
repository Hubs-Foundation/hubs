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
    puppetExp: { type: "number", default: 1 }
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
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) {
        return;
      }
      if (this.targetEl.components.body) {
        this.targetEl.setAttribute("body", { type: "static" });
      }
      this.system = this.system || AFRAME.scenes[0].systems["rotate-selected-object"];
      this.system.rotate(this.targetEl.object3D, hand, this.data);
      e.preventDefault();
    };
    this.onGrabEnd = e => {
      e.preventDefault();
    };
  },
  update() {},
  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
    this.el.addEventListener("grab-end", this.onGrabEnd);
  },
  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
    this.el.removeEventListener("grab-end", this.onGrabEnd);
  }
});

AFRAME.registerSystem("rotate-selected-object", {
  init() {
    this.o = null;
    this.mode = null;
    this.active = false;

    this.puppet = {
      Ci: new THREE.Quaternion(),
      Ci_inverse: new THREE.Quaternion(),
      Cc: new THREE.Quaternion(),
      Cd: new THREE.Quaternion(),
      Oi: new THREE.Quaternion(),
      Oc: new THREE.Quaternion(),
      CcSnapper: new THREE.Euler(),
      snappedCc: new THREE.Quaternion()
    };

    this.planarInfo = {
      plane: new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
        new THREE.MeshBasicMaterial({
          visible: true,
          wireframe: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        })
      ),
      normal: new THREE.Vector3(),
      intersections: [],
      Pi: new THREE.Vector3(),
      Pp: new THREE.Vector3(),
      Pc: new THREE.Vector3(),
      PiPc: new THREE.Vector3(),
      PpPc: new THREE.Vector3(),
      XYi: new THREE.Vector3()
    };

    this.right = new THREE.Vector3(1, 0, 0);
    this.up = new THREE.Vector3(0, 1, 0);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.v = new THREE.Vector3();
    this.v2 = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.q2 = new THREE.Quaternion();

    this.dzAll = 0;
    this.dzStore = 0;
    this.dzApplied = 0;
    this.dyAll = 0;
    this.dyStore = 0;
    this.dyApplied = 0;

    this.resetInfo = {
      obj: new THREE.Vector3(),
      eye: new THREE.Vector3(),
      eyeToObj: new THREE.Vector3(),
      resetTarget: new THREE.Vector3()
    };
    this.cameraWorldQuaternion = new THREE.Quaternion();
    this.objectWorldQuaternion = new THREE.Quaternion();

    this.el.object3D.add(this.planarInfo.plane);
  },

  rotate(o, hand, data) {
    this.o = o;
    this.hand = hand.id === "cursor" ? document.querySelector("#player-right-controller").object3D : hand.object3D;
    this.mode = data.mode;
    this.camera = this.camera || document.querySelector("#player-camera").object3D;
    if (this.mode === ROTATE_MODE.AXIS) {
      this.axis.copy(data.axis);
    }
    if (this.mode === ROTATE_MODE.AXIS || this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.GARY) {
      const { plane, intersections, Pi, Pp } = this.planarInfo;
      const v = this.v;
      const q = this.q;

      this.camera.matrixWorld.decompose(v, plane.quaternion, v);
      this.o.matrixWorld.decompose(plane.position, q, v);
      plane.matrixNeedsUpdate = true;
      plane.updateMatrixWorld(true);

      this.raycaster =
        this.raycaster || document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
      intersections.length = 0;
      const far = this.raycaster.far;
      this.raycaster.far = 1000;
      plane.raycast(this.raycaster, intersections);
      this.raycaster.far = far;
      this.active = !!intersections[0];
      if (!this.active) {
        return;
      }

      Pi.copy(intersections[0].point);
      Pp.copy(Pi);

      this.camera.matrixWorld.decompose(this.v, this.cameraWorldQuaternion, this.v);
      this.o.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);

      this.v.set(0, 0, -1).applyQuaternion(this.cameraWorldQuaternion);
      this.v2.set(0, 0, -1).applyQuaternion(this.objectWorldQuaternion);
      this.sign = this.v.dot(this.v2) > 0 ? 1 : -1;

      this.v.set(0, 1, 0); //.applyQuaternion(this.cameraWorldQuaternion);
      this.v2.set(0, 1, 0).applyQuaternion(this.objectWorldQuaternion);
      this.sign2 = this.v.dot(this.v2) > 0 ? 1 : -1;

      this.dyAll = 0;
      this.dyStore = 0;
      this.dyApplied = 0;
      this.dzAll = 0;
      this.dzStore = 0;
      this.dzApplied = 0;
    } else if (this.mode === ROTATE_MODE.RESET) {
      // Project the line from your eye to the object onto the XZ plane.
      // Place the object at eye level along the projected line, rotating it to face you.
      // TODO: This could instead be "inspect", which either moves the object to you OR moves you it
      //       optimizing for to a comfortable viewing transform.
      this.active = false;
      const { eye, obj, eyeToObj, resetTarget } = this.resetInfo;
      this.camera.getWorldPosition(eye);
      this.o.getWorldPosition(obj);
      eyeToObj.copy(obj).sub(eye);
      this.up.set(0, 1, 0);
      this.v
        .copy(eyeToObj)
        .projectOnPlane(this.up)
        .normalize();
      resetTarget.copy(obj).sub(this.v);

      this.o.lookAt(resetTarget);
      this.o.position.y = eye.y;
      this.o.matrixNeedsUpdate = true;
      this.active = false;
    } else if (this.mode === ROTATE_MODE.PUPPET) {
      this.active = true;
      this.puppet.exponent = data.exponent;
      const { Ci, Ci_inverse, Oi } = this.puppet;
      this.hand.getWorldQuaternion(Ci);
      Ci_inverse.copy(Ci).inverse();
      this.o.getWorldQuaternion(Oi);
    }
  },

  tick() {
    this.planarInfo.plane.material.visible =
      this.active && (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.AXIS);

    if (!this.active || this.el.systems.userinput.get(paths.actions.cursor.drop)) {
      this.active = false;
      return;
    }

    const { plane, normal, intersections, Pi, Pp, Pc, PiPc, PpPc, XYi } = this.planarInfo;

    this.camera.matrixNeedsUpdate = true;
    this.camera.updateMatrixWorld(true);
    this.o.matrixNeedsUpdate = true;
    this.o.updateMatrixWorld(true);
    plane.matrixNeedsUpdate = true;
    plane.updateMatrixWorld(true);

    if (this.mode === ROTATE_MODE.PUPPET) {
      // Find controller delta as a quaternion, then apply it to the object, snapping in fixed increments if desired:
      //    Cc = Cd * Ci
      // =>      Cd = Cc * Ci_inverse * Oi
      // so that if we set Od = Cd then
      //    Oc = Cd * Oi = Cc * Ci_inverse * Oi
      // Snap to fixed angle increments by converting Cc to an Euler,
      // restricting the angles using Math.floor, and converting back to a quaternion.
      // TODO The quaternion's exponential varies with the "reactivity" of the object under the action of the controller. I know that for the natural numbers, the effect is to apply the "whole" action of the quaternion rather than a part, so I make a special case for exponent == 2.
      // TODO: After sensitivity via exponential, would like to know how to adjust it on a per-axis basis. (But which axes?)
      const { Cc, Cd, Ci_inverse, Oi, Oc, exponent } = this.puppet;
      this.hand.updateMatrixWorld(true);
      this.hand.getWorldQuaternion(Cc);
      Cd.copy(Ci_inverse).premultiply(Cc);
      Oc.copy(Oi);
      Oc.premultiply(Cd);
      if (exponent == 2) {
        Oc.premultiply(Cd);
      }
      this.o.quaternion.copy(Oc);
      this.o.matrixNeedsUpdate = true;
      return;
    }

    this.o.getWorldPosition(plane.position);
    this.camera.matrixWorld.decompose(this.v, plane.quaternion, this.v2);
    const cameraToPlaneDistance = this.v.sub(plane.position).length();

    intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    plane.raycast(this.raycaster, intersections);
    this.raycaster.far = far;
    const intersection = intersections[0]; // point
    if (!intersection) return;

    normal.set(0, 0, -1).applyQuaternion(plane.quaternion);

    Pc.copy(intersection.point);
    PiPc.copy(Pc).sub(Pi);
    if (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.GARY) {
      const boost = AFRAME.scenes[0].systems.userinput.get(paths.actions.boost);
      this.dualAxis = !boost;
      this.gary = boost;
      PpPc.copy(Pc).sub(Pp);
      XYi.copy(PiPc)
        .projectOnPlane(normal)
        .applyQuaternion(this.q.copy(plane.quaternion).inverse())
        .multiplyScalar(5 / cameraToPlaneDistance);
      if (XYi.lengthSq() < 0.00001) {
        return;
      }

      const stepLength = Math.PI / 6;
      this.dyAll = this.dyStore + XYi.y;
      this.dyApplied = this.dualAxis ? Math.round(this.dyAll / stepLength) * stepLength : this.dyAll;
      this.dyStore = this.dyAll - this.dyApplied;

      this.dzAll = this.dzStore + XYi.x;
      this.dzApplied = this.dualAxis ? Math.round(this.dzAll / stepLength) * stepLength : this.dzAll;
      this.dzStore = this.dzAll - this.dzApplied;

      this.o.matrixWorld.decompose(this.v, this.objectWorldQuaternion, this.v);
      this.right.set(1, 0, 0).applyQuaternion(this.dualAxis ? this.objectWorldQuaternion : this.cameraWorldQuaternion);
      this.q.setFromAxisAngle(this.right, this.dualAxis ? this.sign2 * this.sign * -this.dyApplied : -this.dyApplied);

      if (this.dualAxis) {
        this.up.set(0, 1, 0);
      } else {
        this.up.set(0, 1, 0).applyQuaternion(this.cameraWorldQuaternion);
      }
      this.q2.setFromAxisAngle(this.up, this.dzApplied);

      this.o.quaternion.premultiply(this.q).premultiply(this.q2);
    } else {
      XYi.copy(PiPc)
        .projectOnPlane(normal)
        .applyQuaternion(this.q.copy(plane.quaternion).inverse())
        .multiplyScalar(5 / cameraToPlaneDistance);
      if (XYi.lengthSq() < 0.00001) {
        return;
      }

      const rotationSnap = Math.PI / 8;
      this.dzAll = this.dzStore + XYi.x;
      this.dzApplied = Math.round(this.dzAll / rotationSnap) * rotationSnap;
      this.dzStore = this.dzAll - this.dzApplied;

      this.o.quaternion.multiply(this.q.setFromAxisAngle(this.axis, -this.sign * this.dzApplied));
    }

    Pi.copy(intersection.point);
  }
});

AFRAME.registerComponent("exist-if-threedof", {
  schema: {
    existIf3DOF: { default: true }
  },
  init() {
    let threeDOF = false;
    for (const device of AFRAME.scenes[0].systems.userinput.activeDevices) {
      if (
        device.gamepad &&
        (device.gamepad.id === "Oculus Go Controller" ||
          device.gamepad.id === "Gear VR Controller" ||
          device.gamepad.id === "Daydream Controller")
      ) {
        threeDOF = true;
      }
    }
    if (threeDOF !== this.data.existIf3DOF) {
      this.el.parentNode.removeChild(this.el);
    }
  }
});
