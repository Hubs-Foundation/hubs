import { waitForDOMContentLoaded } from "../utils/async-utils";
import { calculateViewingDistance, setMatrixWorld, squareDistanceBetween } from "../utils/three-utils";
import { getBox } from "../utils/auto-box-collider";
import { paths } from "../systems/userinput/paths";
const MIN_JUMP_DISTANCE_SQUARED = 2 ** 2; //meters
const DELAY_FOR_HOLD = 0;
const DEFAULT_DISTANCE_MOD = 1.0;
AFRAME.registerComponent("visible-thing", {
  schema: {},
  init() {
    this.el.appendChild(document.importNode(document.getElementById("visible-thing-template").content, true));
  }
});
AFRAME.registerComponent("show-child-on-hover", {
  schema: {
    target: { type: "string" }
  },
  init() {
    waitForDOMContentLoaded().then(() => {
      this.model = this.el.querySelector(this.data.target);
      this.model.object3D.visible = false;

      this.onHover = () => {
        this.hovering = true;
        this.model.object3D.visible = true;
      };
      this.onHoverOut = () => {
        this.hovering = false;
        this.model.object3D.visible = false;
      };
      this.el.object3D.addEventListener("hovered", this.onHover);
      this.el.object3D.addEventListener("unhovered", this.onHoverOut);
    });
  },
  remove() {
    if (this.didInit) {
      this.el.object3D.removeEventListener("hovered", this.onHover);
      this.el.object3D.removeEventListener("unhovered", this.onHoverOut);
    }
  }
});
AFRAME.registerComponent("show-sibling-on-hover", {
  schema: {
    target: { type: "string" }
  },
  init() {
    waitForDOMContentLoaded().then(() => {
      this.model = this.el.parentNode.querySelector(this.data.target);
      this.model.object3D.visible = false;

      this.onHover = () => {
        this.hovering = true;
        this.model.object3D.visible = true;
      };
      this.onHoverOut = () => {
        this.hovering = false;
        this.model.object3D.visible = false;
      };
      this.el.object3D.addEventListener("hovered", this.onHover);
      this.el.object3D.addEventListener("unhovered", this.onHoverOut);
    });
  },
  remove() {
    if (this.didInit) {
      this.el.object3D.removeEventListener("hovered", this.onHover);
      this.el.object3D.removeEventListener("unhovered", this.onHoverOut);
    }
  }
});

AFRAME.registerComponent("way-point", {
  schema: {
    templateId: { default: "way-point-icon-template" },
    reparent: { default: false }, // Attach to moving objects
    maintainUp: { default: true }, // Maintain the user's perceived up vector. Suggestion: Require this to be explicitly enabled by users to prevent accidental nauseua
    disallowIfOccupied: { default: false },
    disableMovement: { default: false },
    keepOrientation: { default: false },
    offset: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    modelSelector: { type: "string" }
  },
  init: (function() {
    return function init() {
      this.distanceMod = DEFAULT_DISTANCE_MOD;

      this.prevDeltaDistance = 0;
      // Delay waypoint initialization because cloning objects is busted
      // TODO: fix
      setTimeout(() => {
        this.el.appendChild(document.importNode(document.getElementById(this.data.templateId).content, true));
        this.enqueueWaypointTravelToHere = this.enqueueWaypointTravelToHere.bind(this);
        this.calculateTarget = this.calculateTarget.bind(this); //TODO: remove?
        this.onInteract = this.onInteract.bind(this);
        this.startHold = this.startHold.bind(this);
        this.stopHold = this.stopHold.bind(this);
        // Some browsers require a timeout after importNode
        setTimeout(() => {
          if (this.didRemove) return;
          const icon = this.el.querySelector(".way-point-icon");
          if (icon) {
            icon.object3D.addEventListener("interact", this.enqueueWaypointTravelToHere);
          } else {
            this.el.object3D.addEventListener("interact", this.onInteract);
            this.el.object3D.addEventListener("holdable-button-down", this.startHold);
            this.el.object3D.addEventListener("holdable-button-up", this.stopHold);
          }
          if (this.data.modelSelector) {
            this.model = this.el.querySelector(this.data.modelSelector);
            this.model.object3D.visible = false;
            if (this.model) {
              this.onHover = () => {
                this.hovering = true;
              };
              this.onHoverOut = () => {
                this.hovering = false;
                this.model.object3D.visible = false;
              };
              this.el.object3D.addEventListener("hovered", this.onHover);
              this.el.object3D.addEventListener("unhovered", this.onHoverOut);
            }
          }
        }, 0);
      }, 0);
    };
  })(),
  startHold: (function() {
    return function startHold() {
      const isPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
      const isFrozen = this.el.sceneEl.is("frozen");
      console.log(this.el);
      this.shouldStartHold = isPinned && !isFrozen;
    };
  })(),
  stopHold: (function() {
    return function stopHold() {
      this.shouldStopHold = true;
    };
  })(),
  onInteract: (function() {
    const waypoint = new THREE.Matrix4();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const v4 = new THREE.Vector3();
    const v5 = new THREE.Vector3();
    const v6 = new THREE.Vector3();
    const center = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const m1 = new THREE.Matrix4();
    return function onInteract() {
      this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera");
      this.viewingCamera.object3D.updateMatrices();
      this.el.object3D.updateMatrices();

      this.avatarPOV.object3D.updateMatrices();
      this.el.object3D.updateMatrices();

      const isPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
      //const squareDistance = squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D);
      if (isPinned && !this.el.sceneEl.is("frozen")) {
        const box = getBox(this.el, this.el.getObject3D("mesh") || this.el, true);
        box.getCenter(center);
        const viewingDistance = calculateViewingDistance(
          this.el.sceneEl.camera.fov,
          this.el.sceneEl.camera.aspect,
          this.el,
          box,
          center,
          this.el.sceneEl.is("vr-mode")
        );
        this.characterController =
          this.characterController || document.getElementById("avatar-rig").components["character-controller"];


        const distance = Math.sqrt(squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D));
        this.distanceMod = distance / viewingDistance;

        waypoint.compose(
          v4.addVectors(
            v5.setFromMatrixColumn(this.el.object3D.matrixWorld, 3),
            v1
              .setFromMatrixColumn(this.viewingCamera.object3D.matrixWorld, 3)
              .sub(v2.setFromMatrixColumn(this.el.object3D.matrixWorld, 3))
              .projectOnPlane(v3.set(0, 1, 0))
              .normalize()
              .multiplyScalar(viewingDistance * this.distanceMod)
          ),
          quaternion.setFromRotationMatrix(m1.extractRotation(this.viewingCamera.object3D.matrixWorld)),
          v6.setFromMatrixScale(this.el.object3D.matrixWorld)
        );
        console.log("onInteract");
        this.characterController && this.characterController.enqueueWaypointTravelTo(waypoint, this.data, 50, true);
      }
    };
  })(),
  calculateTarget: (function() {
    const mat4 = new THREE.Matrix4();
    const rotMat4 = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const offset = new THREE.Vector3();
    const center = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    return function(inMat4) {
      this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      this.avatarPOV.object3D.updateMatrices();
      this.el.object3D.updateMatrices();
      const box = getBox(this.el, this.el.getObject3D("mesh") || this.el, true);
      box.getCenter(center);
      const viewingDistance = calculateViewingDistance(
        this.el.sceneEl.camera.fov,
        this.el.sceneEl.camera.aspect,
        this.el,
        box,
        center,
        this.el.sceneEl.is("vr-mode")
      );
      position.setFromMatrixColumn(this.el.object3D.matrixWorld, 3).add(
        offset
          .copy(this.data.offset)
          .multiplyScalar(viewingDistance * this.distanceMod)
          .applyQuaternion(
            this.data.keepOrientation
              ? quaternion.setFromRotationMatrix(rotMat4.extractRotation(this.avatarPOV.object3D.matrixWorld)) // TODO: Try making forward = (object - head), up = worldUp or headUp (minus projection on forward), and side = their cross
              : quaternion.setFromRotationMatrix(rotMat4.extractRotation(this.el.object3D.matrixWorld))
          )
      );
      //      scale.setFromMatrixScale(this.el.object3D.matrixWorld);
      mat4.compose(
        position,
        quaternion,
        scale
      );
      return inMat4.copy(mat4);
    };
  })(),
  enqueueWaypointTravelToInFrontOf: (function() {
    const mat4 = new THREE.Matrix4();
    return function() {
      this.calculateTarget(mat4);
      this.characterController && this.characterController.enqueueWaypointTravelTo(mat4, this.data, 50, true);
    };
  })(),
  enqueueWaypointTravelToHere: (function() {
    const mat4 = new THREE.Matrix4();
    return function() {
      this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      this.avatarPOV.object3D.updateMatrices();
      this.el.object3D.updateMatrices();
      mat4.copy(this.el.object3D.matrixWorld);
      this.characterController && this.characterController.enqueueWaypointTravelTo(mat4, this.data);
    };
  })(),
  tick: (function() {
    const mat4 = new THREE.Matrix4();
    const flipZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    return function tick(t) {
      if (this.model) {
        this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera");

        const isPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
        this.model.object3D.visible =
          isPinned &&
          !!this.hovering &&
          squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D) > MIN_JUMP_DISTANCE_SQUARED; // TODO: Remove for perf reasons
      }
      if (this.shouldStartHold) {
        this.holding = true;
        this.holdTime = t;
        this.shouldStartHold = false;

        this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
        this.characterController =
          this.characterController || document.getElementById("avatar-rig").components["character-controller"];
        this.avatarPOV.object3D.updateMatrices();
        this.el.object3D.updateMatrices();
        const box = getBox(this.el, this.el.getObject3D("mesh") || this.el, true);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const viewingDistance = calculateViewingDistance(
          this.el.sceneEl.camera.fov,
          this.el.sceneEl.camera.aspect,
          this.el,
          box,
          center,
          this.el.sceneEl.is("vr-mode")
        );
        const distance = Math.sqrt(squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D));
        this.distanceMod = distance / viewingDistance;
        console.log("distance mod is ", this.distanceMod);
        window.lastFocusedItem = this.el;
        window.isHoldingWaypoint = true;
      }
      if (this.holding && t - this.holdTime >= DELAY_FOR_HOLD) {
        const deltaDistance =
          this.el.sceneEl.systems.userinput.get(paths.actions.waypointDeltaDistance) ||
          this.el.sceneEl.systems.userinput.get(paths.device.mouse.wheel) ||
          0;
        const FALLOFF = 0.95;
        if (deltaDistance) {
          this.prevDeltaDistance = deltaDistance;
        } else if (Math.abs(this.prevDeltaDistance) > 0.0001) {
          this.prevDeltaDistance = FALLOFF * this.prevDeltaDistance;
        }
        this.distanceMod = THREE.Math.clamp(
          this.distanceMod + deltaDistance + (5 * this.prevDeltaDistance) / 6,
          0.1,
          10
        );
        //this.onInteract();

        const scene = AFRAME.scenes[0];
        const userinput = scene.systems.userinput;
        const cameraDelta = userinput.get(
          scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta
        );
        if (cameraDelta) {
          this.distanceMod = this.distanceMod + cameraDelta[1] * (window.isTouchscreen ? 3 : 1);
        }
        console.log(t, "enqueue");
        this.enqueueWaypointTravelToInFrontOf();
      }
      if (this.shouldStopHold) {
        this.shouldStopHold = false;
        this.holding = false;
        window.isHoldingWaypoint = false;
      }
      if (!!this.hovering) {
        this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera");
        const isPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
        this.model.object3D.visible =
          isPinned && squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D) > MIN_JUMP_DISTANCE_SQUARED;
        if (this.model) {
          this.calculateTarget(mat4);
          setMatrixWorld(this.model.object3D, mat4);
          this.model.object3D.updateMatrices();
          this.model.object3D.position.set(
            this.model.object3D.position.x,
            this.model.object3D.position.y - 1.6,
            this.model.object3D.position.z
          );
          this.model.object3D.quaternion.multiply(flipZ);
          this.model.object3D.matrixNeedsUpdate = true;
        }
      }
    };
  })(),
  remove() {
    this.didRemove = true;
    this.el.querySelector(".way-point-icon").object3D.removeEventListener("interact", this.enqueueWaypointTravel);
  }
});

AFRAME.registerComponent("scale-in-screen-space", {
  schema: {
    baseScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    addedScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } }
  },
  tick: (function() {
    const parentScale = new THREE.Vector3();
    return function tick() {
      this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera");
      const distance = Math.sqrt(squareDistanceBetween(this.el.object3D, this.viewingCamera.object3D));
      const parent = this.el.object3D.parent;
      parent.updateMatrices();
      parentScale.setFromMatrixScale(parent.matrixWorld);
      this.el.object3D.scale.set(
        (1 / parentScale.x) * (this.data.baseScale.x + distance * this.data.addedScale.x),
        (1 / parentScale.y) * (this.data.baseScale.y + distance * this.data.addedScale.y),
        (1 / parentScale.z) * (this.data.baseScale.z + distance * this.data.addedScale.z)
      );
      this.el.object3D.matrixNeedsUpdate = true;
    };
  })()
});

const ENABLE_WAYPOINT_TESTS = false;
if (ENABLE_WAYPOINT_TESTS) {
  AFRAME.registerSystem("make-some-way-points-for-testing", {
    init() {
      const v = new THREE.Vector3();

      const el11 = document.createElement("a-entity");
      this.el.appendChild(el11);
      el11.setAttribute("way-point", "foo", "bar");
      el11.object3D.position.set(0, 5, 15);
      el11.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      el11.object3D.scale.set(6, 6, 6);
      el11.object3D.matrixNeedsUpdate = true;

      const el16 = document.createElement("a-entity");
      this.el.appendChild(el16);
      el16.setAttribute("way-point", "foo", "bar");
      el16.object3D.position.set(0, 5, -15);
      el16.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      el16.object3D.scale.set(6, 6, 6);
      el16.object3D.matrixNeedsUpdate = true;

      const el17 = document.createElement("a-entity");
      this.el.appendChild(el17);
      el17.setAttribute("way-point", "foo", "bar");
      el17.object3D.position.set(0, 10, -15);
      el17.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      el17.object3D.scale.set(1, 1, 1);
      el17.object3D.matrixNeedsUpdate = true;

      const el12 = document.createElement("a-entity");
      this.el.appendChild(el12);
      el12.setAttribute("way-point", "foo", "bar");
      el12.object3D.position.set(0, 12, 0);
      el12.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      //el12.object3D.scale.set(1, 3, 1); // TODO: non-uniform scale
      el12.object3D.matrixNeedsUpdate = true;

      const el0 = document.createElement("a-entity");
      this.el.appendChild(el0);
      el0.setAttribute("way-point", "foo", "bar");
      el0.object3D.position.set(5, 1.6, 0);
      el0.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      el0.object3D.matrixNeedsUpdate = true;

      const el2 = document.createElement("a-entity");
      this.el.appendChild(el2);
      el2.setAttribute("way-point", "foo", "bar");
      el2.object3D.position.set(0, 1.6, 5);
      el2.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      el2.object3D.matrixNeedsUpdate = true;

      const el4 = document.createElement("a-entity");
      this.el.appendChild(el4);
      el4.setAttribute("way-point", "foo", "bar");
      el4.object3D.position.set(-5, 1.6, 0);
      el4.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      el4.object3D.matrixNeedsUpdate = true;

      const el15 = document.createElement("a-entity");
      this.el.appendChild(el15);
      el15.setAttribute("way-point", "foo", "bar");
      el15.object3D.position.set(0, 10, 10);
      el15.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      el15.object3D.scale.set(6, 6, 6);
      el15.object3D.matrixNeedsUpdate = true;

      const el3 = document.createElement("a-entity");
      this.el.appendChild(el3);
      el3.setAttribute("way-point", "foo", "bar");
      el3.object3D.position.set(0, 1.6, -5);
      el3.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      el3.object3D.matrixNeedsUpdate = true;

      const el6 = document.createElement("a-entity");
      this.el.appendChild(el6);
      el6.setAttribute("way-point", "foo", "bar");
      el6.object3D.position.set(5, 2.0, 0);
      el6.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      el6.object3D.matrixNeedsUpdate = true;

      const el5 = document.createElement("a-entity");
      this.el.appendChild(el5);
      el5.setAttribute("way-point", "foo", "bar");
      el5.object3D.position.set(5, 1.6, 5);
      el5.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 4);
      el5.object3D.matrixNeedsUpdate = true;

      const el13 = document.createElement("a-entity");
      this.el.appendChild(el13);
      el13.setAttribute("way-point", "foo", "bar");
      el13.object3D.position.set(0, 10, 10);
      el13.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      el13.object3D.scale.set(6, 6, 6);
      el13.object3D.matrixNeedsUpdate = true;

      const el7 = document.createElement("a-entity");
      this.el.appendChild(el7);
      el7.setAttribute("way-point", "foo", "bar");
      el7.object3D.position.set(1, 4, 0);
      el7.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
      el7.object3D.matrixNeedsUpdate = true;
      const el9 = document.createElement("a-entity");
      this.el.appendChild(el9);
      el9.setAttribute("way-point", "foo", "bar");
      el9.object3D.position.set(0, 4, 1);
      el9.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
      el9.object3D.matrixNeedsUpdate = true;
      const el8 = document.createElement("a-entity");
      this.el.appendChild(el8);
      el8.setAttribute("way-point", "foo", "bar");
      el8.object3D.position.set(-1, 4, 0);
      el8.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
      el8.object3D.matrixNeedsUpdate = true;
      const el10 = document.createElement("a-entity");
      this.el.appendChild(el10);
      el10.setAttribute("way-point", "foo", "bar");
      el10.object3D.position.set(0, 4, -1);
      el10.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      el10.object3D.matrixNeedsUpdate = true;

      const el14 = document.createElement("a-entity");
      this.el.appendChild(el14);
      el14.setAttribute("way-point", "disableMovement", true);
      el14.object3D.position.set(0, 10, 10);
      el14.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
      el14.object3D.scale.set(6, 6, 6);
      el14.object3D.matrixNeedsUpdate = true;

      //const el8 = document.createElement("a-entity");
      //this.el.appendChild(el8);
      //el8.setAttribute("visible-thing", "foo", "bar");
      //el8.object3D.position.set(-5, 4, 0);
      //el8.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 1).normalize(), -Math.PI / 2);
      //el8.object3D.matrixNeedsUpdate = true;
      //window.visibleThing = el8;
    }
  });
}
