import { paths } from "../systems/userinput/paths";

const ROTATE_MODE = {
  AXIS: "axis",
  PUPPET: "puppet",
  CURSOR: "cursor",
  ALIGN: "align"
};

const STEP_LENGTH = Math.PI / 10;
const CAMERA_WORLD_QUATERNION = new THREE.Quaternion();
const CAMERA_WORLD_POSITION = new THREE.Vector3();
const TARGET_WORLD_QUATERNION = new THREE.Quaternion();
const v = new THREE.Vector3();
const v2 = new THREE.Vector3();
const q = new THREE.Quaternion();
const q2 = new THREE.Quaternion();

AFRAME.registerComponent("rotate-button", {
  schema: {
    mode: {
      type: "string",
      oneof: Object.values(ROTATE_MODE),
      default: ROTATE_MODE.CURSOR
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
    this.rotating = false;
    this.axis = new THREE.Vector3();
    this.store = window.APP.store;

    this.dxAll = 0;
    this.dxStore = 0;
    this.dxApplied = 0;
    this.dyAll = 0;
    this.dyStore = 0;
    this.dyApplied = 0;

    this.puppet = {
      initialControllerOrientation: new THREE.Quaternion(),
      initialControllerOrientation_inverse: new THREE.Quaternion(),
      initialObjectOrientation: new THREE.Quaternion(),
      currentControllerOrientation: new THREE.Quaternion(),
      controllerOrientationDelta: new THREE.Quaternion()
    };

    this.planarInfo = {
      plane: new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
        new THREE.MeshBasicMaterial({
          visible: false,
          wireframe: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        })
      ),
      normal: new THREE.Vector3(),
      intersections: [],
      previousPointOnPlane: new THREE.Vector3(),
      currentPointOnPlane: new THREE.Vector3(),
      deltaOnPlane: new THREE.Vector3(),
      finalProjectedVec: new THREE.Vector3()
    };
    this.el.object3D.add(this.planarInfo.plane);
  },

  stopRotate() {
    this.rotating = false;
  },

  startPlaneCasting() {
    const { plane, intersections, previousPointOnPlane } = this.planarInfo;

    this.el.camera.getWorldQuaternion(CAMERA_WORLD_QUATERNION);
    plane.quaternion.copy(CAMERA_WORLD_QUATERNION);
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
    this.rotating = !!intersections[0];
    if (!this.rotating) {
      return;
    }

    previousPointOnPlane.copy(intersections[0].point);

    this.target.getWorldQuaternion(TARGET_WORLD_QUATERNION);

    v.set(0, 0, -1).applyQuaternion(CAMERA_WORLD_QUATERNION);
    v2.set(0, 0, -1).applyQuaternion(TARGET_WORLD_QUATERNION);
    this.sign = v.dot(v2) > 0 ? 1 : -1;

    v.set(0, 1, 0); //.applyQuaternion(this.CAMERA_WORLD_QUATERNION);
    v2.set(0, 1, 0).applyQuaternion(TARGET_WORLD_QUATERNION);
    this.sign2 = v.dot(v2) > 0 ? 1 : -1;

    this.dyAll = 0;
    this.dyStore = 0;
    this.dyApplied = 0;
    this.dxAll = 0;
    this.dxStore = 0;
    this.dxApplied = 0;
  },

  startRotate(target, hand, data) {
    this.target = target;
    this.hand = hand.id === "cursor" ? document.querySelector("#player-right-controller").object3D : hand.object3D;
    this.mode = data.mode;
    this.rotating = true;

    if (this.mode === ROTATE_MODE.ALIGN) {
      this.store.update({ activity: { hasRecentered: true } });
      return;
    }

    this.store.update({ activity: { hasRotated: true } });

    if (this.mode === ROTATE_MODE.PUPPET) {
      this.target.getWorldQuaternion(this.puppet.initialObjectOrientation);
      this.hand.getWorldQuaternion(this.puppet.initialControllerOrientation);
      this.puppet.initialControllerOrientation_inverse.copy(this.puppet.initialControllerOrientation).inverse();
      return;
    }

    if (this.mode === ROTATE_MODE.AXIS) {
      this.axis.copy(data.axis);
    }

    this.startPlaneCasting();
  },

  puppetingTick() {
    // Find controller delta as a quaternion, then apply it to the object, snapping in fixed increments if desired:
    // Snap to fixed angle increments by converting to an Euler,
    // restricting the angles using Math.floor, and converting back to a quaternion.
    const {
      currentControllerOrientation,
      controllerOrientationDelta,
      initialControllerOrientation_inverse,
      initialObjectOrientation
    } = this.puppet;
    this.hand.getWorldQuaternion(currentControllerOrientation);
    controllerOrientationDelta.copy(initialControllerOrientation_inverse).premultiply(currentControllerOrientation);
    this.target.quaternion.copy(initialObjectOrientation).premultiply(controllerOrientationDelta);
    this.target.matrixNeedsUpdate = true;
  },

  cursorOrAxisModeTick() {
    const {
      plane,
      normal,
      intersections,
      previousPointOnPlane,
      currentPointOnPlane,
      deltaOnPlane,
      finalProjectedVec
    } = this.planarInfo;

    this.target.getWorldPosition(plane.position);
    this.el.camera.getWorldQuaternion(plane.quaternion);
    plane.matrixNeedsUpdate = true;
    const cameraToPlaneDistance = v.sub(plane.position).length();

    intersections.length = 0;
    const far = this.raycaster.far;
    this.raycaster.far = 1000;
    plane.raycast(this.raycaster, intersections);
    this.raycaster.far = far;
    const intersection = intersections[0]; // point
    if (!intersection) return;

    normal.set(0, 0, -1).applyQuaternion(plane.quaternion);

    currentPointOnPlane.copy(intersection.point);
    deltaOnPlane.copy(currentPointOnPlane).sub(previousPointOnPlane);
    const SENSITIVITY = 10;
    finalProjectedVec
      .copy(deltaOnPlane)
      .projectOnPlane(normal)
      .applyQuaternion(q.copy(plane.quaternion).inverse())
      .multiplyScalar(SENSITIVITY / cameraToPlaneDistance);
    if (this.mode === ROTATE_MODE.CURSOR) {
      const modify = AFRAME.scenes[0].systems.userinput.get(paths.actions.rotateModifier);

      this.dyAll = this.dyStore + finalProjectedVec.y;
      this.dyApplied = modify ? this.dyAll : Math.round(this.dyAll / STEP_LENGTH) * STEP_LENGTH;
      this.dyStore = this.dyAll - this.dyApplied;

      this.dxAll = this.dxStore + finalProjectedVec.x;
      this.dxApplied = modify ? this.dxAll : Math.round(this.dxAll / STEP_LENGTH) * STEP_LENGTH;
      this.dxStore = this.dxAll - this.dxApplied;

      this.target.getWorldQuaternion(TARGET_WORLD_QUATERNION);
      v.set(1, 0, 0).applyQuaternion(modify ? CAMERA_WORLD_QUATERNION : TARGET_WORLD_QUATERNION);
      q.setFromAxisAngle(v, modify ? -this.dyApplied : this.sign2 * this.sign * -this.dyApplied);

      if (modify) {
        v.set(0, 1, 0).applyQuaternion(CAMERA_WORLD_QUATERNION);
      } else {
        v.set(0, 1, 0);
      }
      q2.setFromAxisAngle(v, this.dxApplied);

      this.target.quaternion.premultiply(q).premultiply(q2);
    } else if (this.mode === ROTATE_MODE.AXIS) {
      this.dxAll = this.dxStore + finalProjectedVec.x;
      this.dxApplied = Math.round(this.dxAll / STEP_LENGTH) * STEP_LENGTH;
      this.dxStore = this.dxAll - this.dxApplied;

      this.target.quaternion.multiply(q.setFromAxisAngle(this.axis, -this.sign * this.dxApplied));
    }

    previousPointOnPlane.copy(currentPointOnPlane);
  },

  tick() {
    if (!this.rotating) {
      return;
    }

    if (this.mode === ROTATE_MODE.ALIGN) {
      this.el.camera.getWorldPosition(CAMERA_WORLD_POSITION);
      this.target.lookAt(CAMERA_WORLD_POSITION);
      return;
    }

    if (this.mode === ROTATE_MODE.PUPPET) {
      this.puppetingTick();
      return;
    }
    this.cursorOrAxisModeTick();
  }
});

AFRAME.registerComponent("rotate-button-selector", {
  tick() {
    const hand = AFRAME.scenes[0].systems.userinput.get(paths.actions.rightHand.pose);
    if (!hand) {
      if (this.el.components["rotate-button"].data.mode !== ROTATE_MODE.CURSOR) {
        this.el.setAttribute("rotate-button", "mode", ROTATE_MODE.CURSOR);
      }
    } else {
      if (this.el.components["rotate-button"].data.mode !== ROTATE_MODE.PUPPET) {
        this.el.setAttribute("rotate-button", "mode", ROTATE_MODE.PUPPET);
      }
    }
  }
});

const FORWARD = new THREE.Vector3(0, 0, 1);
const TWO_PI = 2 * Math.PI;
AFRAME.registerComponent("visible-if-rotating", {
  init() {},
  tick(t) {
    const shouldBeVisible = AFRAME.scenes[0].systems["rotate-selected-object"].rotating;
    const visibleNeedsUpdate = this.el.getAttribute("visible") !== shouldBeVisible;
    if (visibleNeedsUpdate) {
      this.el.setAttribute("visible", AFRAME.scenes[0].systems["rotate-selected-object"].rotating);
    }

    if (shouldBeVisible) {
      this.el.object3D.quaternion.setFromAxisAngle(FORWARD, TWO_PI * Math.sin(t / 1000.0));
      this.el.object3D.matrixNeedsUpdate = true;
    }
  }
});
