import { waitForDOMContentLoaded } from "../utils/async-utils";
import { squareDistanceBetween } from "../utils/three-utils";
AFRAME.registerComponent("visible-thing", {
  schema: {},
  init() {
    this.el.appendChild(document.importNode(document.getElementById("visible-thing-template").content, true));
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
    reparent: { default: false }, // Attach to moving objects
    maintainUp: { default: true }, // Maintain the user's perceived up vector. Suggestion: Require this to be explicitly enabled by users to prevent accidental nauseua
    disallowIfOccupied: { default: false },
    disableMovement: { default: false },
    keepOrientation: { default: false },
    offset: { type: "vec3", default: { x: 0, y: 0, z: 0 } }
  },
  init() {
    this.el.appendChild(document.importNode(document.getElementById("way-point-template").content, true));
    this.enqueueWaypointTravelToHere = this.enqueueWaypointTravelToHere.bind(this);
    // Some browsers require a timeout here.
    // I can't remember if it is the .way-point-icon element or the object3D that isn't available.
    setTimeout(() => {
      if (this.didRemove) return;
      this.el.querySelector(".way-point-icon").object3D.addEventListener("interact", this.enqueueWaypointTravelToHere);
    }, 0);
  },
  enqueueWaypointTravelToHere: (function() {
    const mat4 = new THREE.Matrix4();
    const rotMat4 = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const offset = new THREE.Vector3();
    const scale = new THREE.Vector3();
    return function() {
      this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      this.avatarPOV.object3D.updateMatrices();
      this.el.object3D.updateMatrices();
      //position
      //  .setFromMatrixColumn(this.el.object3D.matrixWorld, 3)
      //  .add(
      //    offset
      //      .copy(this.data.offset)
      //      .applyQuaternion(
      //        this.data.keepOrientation
      //          ? quaternion.setFromRotationMatrix(rotMat4.extractRotation(this.avatarPOV.object3D.matrixWorld))
      //          : quaternion.setFromRotationMatrix(this.el.object3D.matrixWorld)
      //      )
      //  );
      //scale.setFromMatrixScale(this.el.object3D.matrixWorld);
      //mat4.compose(
      //  position,
      //  quaternion,
      //  scale
      //);
      mat4.copy(this.el.object3D.matrixWorld);
      this.characterController && this.characterController.enqueueWaypointTravelTo(mat4, this.data);
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

const ENABLE_WAYPOINT_TESTS = true;
if (ENABLE_WAYPOINT_TESTS) {
  AFRAME.registerSystem("make-some-waypoints-for-testing", {
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
