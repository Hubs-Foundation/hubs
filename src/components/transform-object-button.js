import { paths } from "../systems/userinput/paths";

const TRANSFORM_MODE = {
  AXIS: "axis",
  PUPPET: "puppet",
  CURSOR: "cursor",
  ALIGN: "align",
  SCALE: "scale"
};

const SCALE_SENSITIVITY = 100;
const MIN_SCALE = 0.1;
const MAX_SCALE = 100;

const STEP_LENGTH = Math.PI / 10;
const CAMERA_WORLD_QUATERNION = new THREE.Quaternion();
const CAMERA_WORLD_POSITION = new THREE.Vector3();
const TARGET_WORLD_QUATERNION = new THREE.Quaternion();
const v = new THREE.Vector3();
const v2 = new THREE.Vector3();
const q = new THREE.Quaternion();
const q2 = new THREE.Quaternion();

AFRAME.registerComponent("transform-button", {
  schema: {
    mode: {
      type: "string",
      oneof: Object.values(TRANSFORM_MODE),
      default: TRANSFORM_MODE.CURSOR
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
      if (!NAF.utils.isMine(this.targetEl) && !NAF.utils.takeOwnership(this.targetEl)) {
        return;
      }
      if (this.targetEl.body) {
        this.targetEl.setAttribute("ammo-body", { type: "kinematic" });
      }
      this.transformSystem = this.transformSystem || AFRAME.scenes[0].systems["transform-selected-object"];
      this.transformSystem.startTransform(
        this.targetEl.object3D,
        e.path === paths.actions.cursor.grab ? "cursor" : e.path === paths.actions.rightHand.grab ? "right" : "left",
        this.data
      );
    };
    this.onGrabEnd = () => {
      this.transformSystem = this.transformSystem || AFRAME.scenes[0].systems["transform-selected-object"];
      this.transformSystem.stopTransform();
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-up", this.onGrabEnd);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-up", this.onGrabEnd);
  }
});

AFRAME.registerSystem("transform-selected-object", {
  init() {
    this.target = null;
    this.mode = null;
    this.transforming = false;
    this.axis = new THREE.Vector3();
    this.store = window.APP.store;

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

  stopTransform() {
    this.transforming = false;
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
    this.transforming = !!intersections[0];
    if (!this.transforming) {
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

  startTransform(target, hand, data) {
    this.target = target;
    this.hand =
      hand === "cursor" || hand === "right"
        ? document.querySelector("#player-right-controller").object3D
        : document.querySelector("#player-left-controller").object3D;
    this.mode = data.mode;
    this.transforming = true;

    if (this.mode === TRANSFORM_MODE.ALIGN) {
      this.store.update({ activity: { hasRecentered: true } });
      return;
    } else if (this.mode === TRANSFORM_MODE.SCALE) {
      this.store.update({ activity: { hasScaled: true } });
    } else {
      this.store.update({ activity: { hasRotated: true } });
    }

    if (this.mode === TRANSFORM_MODE.PUPPET) {
      this.target.getWorldQuaternion(this.puppet.initialObjectOrientation);
      this.hand.getWorldQuaternion(this.puppet.initialControllerOrientation);
      this.puppet.initialControllerOrientation_inverse.copy(this.puppet.initialControllerOrientation).inverse();
      return;
    }

    if (this.mode === TRANSFORM_MODE.AXIS) {
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

  cursorAxisOrScaleTick() {
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
    if (this.mode === TRANSFORM_MODE.CURSOR || this.mode === TRANSFORM_MODE.SCALE) {
      const modify = AFRAME.scenes[0].systems.userinput.get(paths.actions.transformModifier);

      this.dyAll = this.dyStore + finalProjectedVec.y;
      this.dyApplied = modify ? this.dyAll : Math.round(this.dyAll / STEP_LENGTH) * STEP_LENGTH;
      this.dyStore = this.dyAll - this.dyApplied;

      this.dxAll = this.dxStore + finalProjectedVec.x;
      this.dxApplied = modify ? this.dxAll : Math.round(this.dxAll / STEP_LENGTH) * STEP_LENGTH;
      this.dxStore = this.dxAll - this.dxApplied;

      if (this.mode === TRANSFORM_MODE.CURSOR) {
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
      } else {
        const scaleFactor =
          THREE.Math.clamp(finalProjectedVec.y + finalProjectedVec.x, -0.0005, 0.0005) * SCALE_SENSITIVITY;

        const newScale = this.target.scale.x * (1.0 + scaleFactor);

        if (newScale > MIN_SCALE && newScale < MAX_SCALE) {
          this.target.scale.multiplyScalar(1.0 + scaleFactor);
        }
      }

      this.target.matrixNeedsUpdate = true;
    } else if (this.mode === TRANSFORM_MODE.AXIS) {
      this.dxAll = this.dxStore + finalProjectedVec.x;
      this.dxApplied = Math.round(this.dxAll / STEP_LENGTH) * STEP_LENGTH;
      this.dxStore = this.dxAll - this.dxApplied;

      this.target.quaternion.multiply(q.setFromAxisAngle(this.axis, -this.sign * this.dxApplied));
      this.target.matrixNeedsUpdate = true;
    }

    previousPointOnPlane.copy(currentPointOnPlane);
  },

  tick() {
    if (!this.transforming) {
      return;
    }

    if (this.mode === TRANSFORM_MODE.ALIGN) {
      this.el.camera.getWorldPosition(CAMERA_WORLD_POSITION);
      this.target.lookAt(CAMERA_WORLD_POSITION);
      this.transforming = false;
      return;
    }

    if (this.mode === TRANSFORM_MODE.PUPPET) {
      this.puppetingTick();
      return;
    }
    this.cursorAxisOrScaleTick();
  }
});

AFRAME.registerComponent("transform-button-selector", {
  tick() {
    const hand = AFRAME.scenes[0].systems.userinput.get(paths.actions.rightHand.pose);
    if (!hand) {
      if (this.el.components["transform-button"].data.mode !== TRANSFORM_MODE.CURSOR) {
        this.el.setAttribute("transform-button", "mode", TRANSFORM_MODE.CURSOR);
      }
    } else {
      if (this.el.components["transform-button"].data.mode !== TRANSFORM_MODE.PUPPET) {
        this.el.setAttribute("transform-button", "mode", TRANSFORM_MODE.PUPPET);
      }
    }
  }
});

const FORWARD = new THREE.Vector3(0, 0, 1);
const TWO_PI = 2 * Math.PI;
AFRAME.registerComponent("visible-if-transforming", {
  init() {},
  tick(t) {
    const shouldBeVisible = AFRAME.scenes[0].systems["transform-selected-object"].transforming;
    const visibleNeedsUpdate = this.el.getAttribute("visible") !== shouldBeVisible;
    if (visibleNeedsUpdate) {
      this.el.setAttribute("visible", AFRAME.scenes[0].systems["transform-selected-object"].transforming);
    }

    if (shouldBeVisible) {
      this.el.object3D.quaternion.setFromAxisAngle(FORWARD, TWO_PI * Math.sin(t / 1000.0));
      this.el.object3D.matrixNeedsUpdate = true;
    }
  }
});
