import { paths } from "../systems/userinput/paths";

const ROTATE_MODE = {
  AXIS: "axis",
  PUPPET: "puppet",
  CURSOR: "cursor",
  RESET: "reset"
};

const cameraWorldQuaternion = new THREE.Quaternion();
const objectWorldQuaternion = new THREE.Quaternion();

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
    this.active = false;

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
          visible: true,
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

    this.v = new THREE.Vector3();
    this.v2 = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.q2 = new THREE.Quaternion();

    this.dxAll = 0;
    this.dxStore = 0;
    this.dxApplied = 0;
    this.dyAll = 0;
    this.dyStore = 0;
    this.dyApplied = 0;

    this.resetInfo = {
      targetPos: new THREE.Vector3(),
      cameraPos: new THREE.Vector3(),
      lookDir: new THREE.Vector3(),
      lookPoint: new THREE.Vector3()
    };

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

    if (this.mode === ROTATE_MODE.RESET) {
      this.alignInFront();
      return;
    }

    if (this.mode === ROTATE_MODE.AXIS) {
      this.axis.copy(data.axis);
    }

    if (this.mode === ROTATE_MODE.AXIS || this.mode === ROTATE_MODE.CURSOR) {
      const { plane, intersections, previousPointOnPlane } = this.planarInfo;

      this.el.camera.getWorldQuaternion(cameraWorldQuaternion);
      plane.quaternion.copy(cameraWorldQuaternion);
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

      previousPointOnPlane.copy(intersections[0].point);

      this.target.getWorldQuaternion(objectWorldQuaternion);

      this.v.set(0, 0, -1).applyQuaternion(cameraWorldQuaternion);
      this.v2.set(0, 0, -1).applyQuaternion(objectWorldQuaternion);
      this.sign = this.v.dot(this.v2) > 0 ? 1 : -1;

      this.v.set(0, 1, 0); //.applyQuaternion(this.cameraWorldQuaternion);
      this.v2.set(0, 1, 0).applyQuaternion(objectWorldQuaternion);
      this.sign2 = this.v.dot(this.v2) > 0 ? 1 : -1;

      this.dyAll = 0;
      this.dyStore = 0;
      this.dyApplied = 0;
      this.dxAll = 0;
      this.dxStore = 0;
      this.dxApplied = 0;
    } else if (this.mode === ROTATE_MODE.PUPPET) {
      this.active = true;
      this.target.getWorldQuaternion(this.puppet.initialObjectOrientation);
      this.hand.getWorldQuaternion(this.puppet.initialControllerOrientation);
      this.puppet.initialControllerOrientation_inverse.copy(this.puppet.initialControllerOrientation).inverse();
    }
  },

  alignInFront() {
    // Project the line from your eye to the object onto the XZ plane.
    // Place the object at eye level along the projected line, rotating it to face you.
    this.active = false;
    const { cameraPos, targetPos, lookDir, lookPoint } = this.resetInfo;
    this.el.camera.getWorldPosition(cameraPos);
    this.target.getWorldPosition(targetPos);
    lookDir.copy(targetPos).sub(cameraPos);
    this.v2.set(0, 1, 0);
    this.v
      .copy(lookDir)
      .projectOnPlane(this.v2)
      .normalize();
    lookPoint.copy(targetPos).sub(this.v);

    this.target.lookAt(lookPoint);
    this.target.position.y = cameraPos.y;
    this.target.matrixNeedsUpdate = true;
    this.active = false;
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

  cursorTick() {
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
    const cameraToPlaneDistance = this.v.sub(plane.position).length();

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
      .applyQuaternion(this.q.copy(plane.quaternion).inverse())
      .multiplyScalar(SENSITIVITY / cameraToPlaneDistance);
    if (this.mode === ROTATE_MODE.CURSOR) {
      const modify = AFRAME.scenes[0].systems.userinput.get(paths.actions.rotateModifier);

      const stepLength = Math.PI / 6;
      this.dyAll = this.dyStore + finalProjectedVec.y;
      this.dyApplied = modify ? this.dyAll : Math.round(this.dyAll / stepLength) * stepLength;
      this.dyStore = this.dyAll - this.dyApplied;

      this.dxAll = this.dxStore + finalProjectedVec.x;
      this.dxApplied = modify ? this.dxAll : Math.round(this.dxAll / stepLength) * stepLength;
      this.dxStore = this.dxAll - this.dxApplied;

      this.target.getWorldQuaternion(objectWorldQuaternion);
      this.v.set(1, 0, 0).applyQuaternion(modify ? cameraWorldQuaternion : objectWorldQuaternion);
      this.q.setFromAxisAngle(this.v, modify ? -this.dyApplied : this.sign2 * this.sign * -this.dyApplied);

      if (modify) {
        this.v.set(0, 1, 0).applyQuaternion(cameraWorldQuaternion);
      } else {
        this.v.set(0, 1, 0);
      }
      this.q2.setFromAxisAngle(this.v, this.dxApplied);

      this.target.quaternion.premultiply(this.q).premultiply(this.q2);
    } else if (this.mode === ROTATE_MODE.AXIS) {
      const rotationSnap = Math.PI / 8;
      this.dxAll = this.dxStore + finalProjectedVec.x;
      this.dxApplied = Math.round(this.dxAll / rotationSnap) * rotationSnap;
      this.dxStore = this.dxAll - this.dxApplied;

      this.target.quaternion.multiply(this.q.setFromAxisAngle(this.axis, -this.sign * this.dxApplied));
    }

    previousPointOnPlane.copy(currentPointOnPlane);
  },

  tick() {
    this.planarInfo.plane.material.visible =
      this.active && (this.mode === ROTATE_MODE.CURSOR || this.mode === ROTATE_MODE.AXIS);

    if (!this.active) {
      this.active = false;
      return;
    }

    if (this.mode === ROTATE_MODE.PUPPET) {
      this.puppetingTick();
      return;
    } else {
      this.cursorTick();
    }
  }
});

AFRAME.registerComponent("rotate-button-selector", {
  tick() {
    const hand = AFRAME.scenes[0].systems.userinput.get(paths.actions.rightHand.pose);
    if (!hand) {
      this.el.setAttribute("rotate-button", "mode", ROTATE_MODE.CURSOR);
    } else {
      this.el.setAttribute("rotate-button", "mode", ROTATE_MODE.PUPPET);
    }
  }
});
