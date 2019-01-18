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
      oneof: Object.values(ROTATE_MODE),
      default: "free"
    },
    axis: { type: "vec3", default: null }
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
      this.rotateSystem = this.rotateSystem || AFRAME.scenes[0].systems["rotate-selected-object"];
      this.rotateSystem.startRotate(this.targetEl.object3D, hand, this.data);
      e.preventDefault();
    };
    this.onGrabEnd = e => {
      this.rotateSystem = this.rotateSystem || AFRAME.scenes[0].systems["rotate-selected-object"];
      this.rotateSystem.stopRotate();
      e.preventDefault();
    };
  },
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
    this.target = null;
    this.mode = null;
    this.active = false;

    this.puppet = {
      Ci: new THREE.Quaternion(),
      Ci_inverse: new THREE.Quaternion(),
      Oi: new THREE.Quaternion(),
      Cc: new THREE.Quaternion(),
      Cd: new THREE.Quaternion()
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
      Pp: new THREE.Vector3(),
      Pc: new THREE.Vector3(),
      PpPc: new THREE.Vector3(),
      XYi: new THREE.Vector3()
    };

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

    this.axis = new THREE.Vector3();

    this.el.object3D.add(this.planarInfo.plane);
  },

  stopRotate() {
    this.active = false;
  },

  startRotate(target, hand, data) {
    this.target = target;
    this.hand = hand.id === "cursor" ? document.querySelector("#player-right-controller").object3D : hand.object3D;
    this.mode = data.mode;
    if (this.mode === ROTATE_MODE.AXIS) {
      this.axis.copy(data.axis);
    }
    if (this.mode === ROTATE_MODE.AXIS || this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.GARY) {
      const { plane, intersections, Pp } = this.planarInfo;
      const v = this.v;
      const q = this.q;

      this.el.camera.getWorldQuaternion(this.cameraWorldQuaternion);
      plane.quaternion.copy(this.cameraWorldQuaternion);
      this.target.getWorldPosition(plane.position);
      plane.matrixNeedsUpdate = true;
      plane.updateMatrixWorld(true);

      intersections.length = 0;
      this.raycaster =
        this.raycaster || document.querySelector("#cursor-controller").components["cursor-controller"].raycaster;
      const far = this.raycaster.far;
      this.raycaster.far = 1000;
      plane.raycast(this.raycaster, intersections);
      this.raycaster.far = far;
      this.active = !!intersections[0];
      if (!this.active) {
        return;
      }

      Pp.copy(intersections[0].point);

      this.target.getWorldQuaternion(this.objectWorldQuaternion);

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
      this.active = false;
      const { eye, obj, eyeToObj, resetTarget } = this.resetInfo;
      this.el.camera.getWorldPosition(eye);
      this.target.getWorldPosition(obj);
      eyeToObj.copy(obj).sub(eye);
      this.v2.set(0, 1, 0);
      this.v
        .copy(eyeToObj)
        .projectOnPlane(this.v2)
        .normalize();
      resetTarget.copy(obj).sub(this.v);

      this.target.lookAt(resetTarget);
      this.target.position.y = eye.y;
      this.target.matrixNeedsUpdate = true;
      this.active = false;
    } else if (this.mode === ROTATE_MODE.PUPPET) {
      this.active = true;
      const { Ci, Ci_inverse, Oi } = this.puppet;
      this.hand.getWorldQuaternion(Ci);
      Ci_inverse.copy(Ci).inverse();
      this.target.getWorldQuaternion(Oi);
    }
  },

  tick() {
    this.planarInfo.plane.material.visible =
      this.active && (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.AXIS);

    if (!this.active) {
      this.active = false;
      return;
    }

    const { plane, normal, intersections, Pp, Pc, PpPc, XYi } = this.planarInfo;

    if (this.mode === ROTATE_MODE.PUPPET) {
      // Find controller delta as a quaternion, then apply it to the object, snapping in fixed increments if desired:
      // Snap to fixed angle increments by converting Cc to an Euler,
      // restricting the angles using Math.floor, and converting back to a quaternion.
      const { Cc, Cd, Ci_inverse, Oi } = this.puppet;
      this.hand.getWorldQuaternion(Cc);
      Cd.copy(Ci_inverse).premultiply(Cc);
      this.target.quaternion.copy(Oi).premultiply(Cd);
      this.target.matrixNeedsUpdate = true;
      return;
    }

    this.target.getWorldPosition(plane.position);
    this.el.camera.getWorldQuaternion(plane.quaternion);
    plane.matrixNeedsUpdate = true;
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
    PpPc.copy(Pc).sub(Pp);
    XYi.copy(PpPc)
      .projectOnPlane(normal)
      .applyQuaternion(this.q.copy(plane.quaternion).inverse())
      .multiplyScalar(5 / cameraToPlaneDistance);
    if (this.mode === ROTATE_MODE.FREE || this.mode === ROTATE_MODE.GARY) {
      const boost = AFRAME.scenes[0].systems.userinput.get(paths.actions.boost);
      this.dualAxis = !boost;
      this.gary = boost;

      const stepLength = Math.PI / 6;
      this.dyAll = this.dyStore + XYi.y;
      this.dyApplied = this.dualAxis ? Math.round(this.dyAll / stepLength) * stepLength : this.dyAll;
      this.dyStore = this.dyAll - this.dyApplied;

      this.dzAll = this.dzStore + XYi.x;
      this.dzApplied = this.dualAxis ? Math.round(this.dzAll / stepLength) * stepLength : this.dzAll;
      this.dzStore = this.dzAll - this.dzApplied;

      this.target.getWorldQuaternion(this.objectWorldQuaternion);
      this.v.set(1, 0, 0).applyQuaternion(this.dualAxis ? this.objectWorldQuaternion : this.cameraWorldQuaternion);
      this.q.setFromAxisAngle(this.v, this.dualAxis ? this.sign2 * this.sign * -this.dyApplied : -this.dyApplied);

      if (this.dualAxis) {
        this.v.set(0, 1, 0);
      } else {
        this.v.set(0, 1, 0).applyQuaternion(this.cameraWorldQuaternion);
      }
      this.q2.setFromAxisAngle(this.v, this.dzApplied);

      this.target.quaternion.premultiply(this.q).premultiply(this.q2);
    } else if (this.mode === ROTATE_MODE.AXIS) {
      const rotationSnap = Math.PI / 8;
      this.dzAll = this.dzStore + XYi.x;
      this.dzApplied = Math.round(this.dzAll / rotationSnap) * rotationSnap;
      this.dzStore = this.dzAll - this.dzApplied;

      this.target.quaternion.multiply(this.q.setFromAxisAngle(this.axis, -this.sign * this.dzApplied));
    }

    Pp.copy(Pc);
  }
});

AFRAME.registerComponent("rotate-button-selector", {
  tick() {
    const mode = this.el.components["rotate-button"].data.mode;
    const hand = AFRAME.scenes[0].systems.userinput.get(paths.actions.rightHand.pose);
    if (mode === "puppet" && !hand) {
      this.el.setAttribute("rotate-button", "mode", "free");
    } else if ((mode === "free" || mode === "gary") && !!hand) {
      this.el.setAttribute("rotate-button", "mode", "puppet");
    }
  }
});
