import { setMatrixWorld, calculateCameraTransformForWaypoint, interpolateAffine } from "../utils/three-utils";
//
// Waypoints, Seats, Chairs, and attachments
//
// In Spoke, we inflate the way-point / spawn-point component data as an aframe component
//
//
// going from lobby to room
//
//
//canBeSpawnPoint: { default: false },
//canBeOccupied: { default: false },
//canBeClicked: { default: false },
//willDisableMotion: { default: false },
//willMaintainWorldUp: { default: true }
//
//
function isOccupied(component) {
  return false;
}

function loadTemplateAndAddToScene(scene, templateId) {
  return new Promise(resolve => {
    const content = document.importNode(document.getElementById(templateId).content.children[0]);
    scene.appendChild(content, true);
    resolve(content);
  });
}

const pooledEls = {};
function releasePooledEl(templateId, el) {
  pooledEls[templateId].push(el);
}
function getPooledElOrLoadFromTemplate(scene, templateId) {
  let pool = pooledEls[templateId];
  if (!pool) {
    pool = [];
    pooledEls[templateId] = pool;
  }
  const el = pool.shift();
  return (
    (el &&
      new Promise(resolve => {
        resolve(el);
      })) ||
    loadTemplateAndAddToScene(scene, templateId)
  );
}
//  "occupiable-waypoint-template"
//  "occupiable-waypoint-icon-template"
//  "teleport-waypoint-template"
//  "teleport-waypoint-icon-template"
//  "latch-waypoint-template"
//  "latch-waypoint-icon-template"
function loadTemplatesForWaypointData(scene, data) {
  const promises = [];
  if (true || data.canBeClicked) {
    const el = getPooledElOrLoadFromTemplate(scene, "occupiable-waypoint-icon-template").then(el2 => {
      return el2;
    });
    promises.push(el);
  }
  return promises;
}

export class WaypointSystem {
  constructor(scene) {
    this.components = [];
    this.loading = [];
    this.ready = [];
    this.els = {};
    this.eventHandlers = [];
    this.scene = scene;
  }
  onInteractWithWaypointIcon(waypointEl, iconEl) {
    return function onInteract() {
      console.log("interacted with icon ", iconEl, "for waypoint", waypointEl);
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      iconEl.object3D.updateMatrices();
      this.characterController.enqueueWaypointTravelTo(iconEl.object3D.matrixWorld);
    }.bind(this);
  }
  registerComponent(c) {
    this.components.push(c);
    this.loading.push(c);
    Promise.all(loadTemplatesForWaypointData(this.scene, c)).then(els => {
      this.loading.splice(this.loading.indexOf(c), 1);
      this.ready.push(c);
      this.els[c.el.object3D.uuid] = this.els[c.el.object3D.uuid] || [];
      this.els[c.el.object3D.uuid].push(...els);
      for (let i = 0; i < els.length; i++) {
        if (els[i].classList.contains("way-point-icon")) {
          this.eventHandlers[els[i].object3D.uuid] = this.eventHandlers[els[i].object3D.uuid] || {};
          this.eventHandlers[els[i].object3D.uuid]["interact"] = this.onInteractWithWaypointIcon(els[i], c.el);

          els[i].object3D.addEventListener("interact", this.eventHandlers[els[i].object3D.uuid]["interact"]);
        }
      }
    });
  }
  unregisterComponent(c) {
    const i = this.components.indexOf(c);
    this.components.splice(i, 1);
  }

  tick() {
    const isEntered = this.scene.is("entered");
    if (isEntered && !this.wasEntered) {
      this.moveToSpawnPoint();
    }
    this.wasEntered = isEntered;

    // Process new components by creating visual and interactive elements
    for (let i = 0; i < this.ready.length; i++) {
      const component = this.ready[i];
      const visibleEls = this.els[component.el.object3D.uuid];
      for (let j = 0; j < visibleEls.length; j++) {
        component.el.object3D.updateMatrices();
        const visibleEl = visibleEls[j];
        setMatrixWorld(visibleEl.object3D, component.el.object3D.matrixWorld); //TODO: position model differently
      }
    }
    window.logReady = false;
  }

  moveToSpawnPoint = (function() {
    return function moveToSpawnPoint() {
      this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
      this.avatarPOV.object3D.updateMatrices();
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      for (let i = 0; i < this.ready.length; i++) {
        const component = this.ready[i];
        if (component.canBeSpawnPoint && (!component.canBeOccupied || !isOccupied(component))) {
          component.el.object3D.updateMatrices();
          console.log("traveling to waypoint", component);
          this.characterController.enqueueWaypointTravelTo(component.el.object3D.matrixWorld);
          return;
        }
      }
    };
  })();
}

AFRAME.registerComponent("waypoint", {
  schema: {
    canBeSpawnPoint: { default: false },
    canBeOccupied: { default: false },
    canBeClicked: { default: false },
    willDisableMotion: { default: false },
    willMaintainWorldUp: { default: true }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].waypointSystem;
    this.system.registerComponent(this, this.el.sceneEl);
  },
  remove() {
    this.system.unregisterComponent(this);
  }
});

AFRAME.registerSystem("make-some-waypoints-for-testing", {
  init() {
    const v = new THREE.Vector3();

    const el11 = document.createElement("a-entity");
    this.el.appendChild(el11);
    el11.setAttribute("waypoint", "foo", "bar");
    el11.object3D.position.set(0, 5, 15);
    el11.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el11.object3D.scale.set(6, 6, 6);
    el11.object3D.matrixNeedsUpdate = true;

    const el16 = document.createElement("a-entity");
    this.el.appendChild(el16);
    el16.setAttribute("waypoint", "foo", "bar");
    el16.object3D.position.set(0, 5, -15);
    el16.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    el16.object3D.scale.set(6, 6, 6);
    el16.object3D.matrixNeedsUpdate = true;

    const el17 = document.createElement("a-entity");
    this.el.appendChild(el17);
    el17.setAttribute("waypoint", "foo", "bar");
    el17.object3D.position.set(0, 10, -15);
    el17.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    el17.object3D.scale.set(1, 1, 1);
    el17.object3D.matrixNeedsUpdate = true;

    const el12 = document.createElement("a-entity");
    this.el.appendChild(el12);
    el12.setAttribute("waypoint", "foo", "bar");
    el12.object3D.position.set(0, 12, 0);
    el12.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    //el12.object3D.scale.set(1, 3, 1); // TODO: non-uniform scale
    el12.object3D.matrixNeedsUpdate = true;

    const el0 = document.createElement("a-entity");
    this.el.appendChild(el0);
    el0.setAttribute("waypoint", "foo", "bar");
    el0.object3D.position.set(5, 1.6, 0);
    el0.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    el0.object3D.matrixNeedsUpdate = true;

    const el2 = document.createElement("a-entity");
    this.el.appendChild(el2);
    el2.setAttribute("waypoint", "foo", "bar");
    el2.object3D.position.set(0, 1.6, 5);
    el2.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el2.object3D.matrixNeedsUpdate = true;

    const el4 = document.createElement("a-entity");
    this.el.appendChild(el4);
    el4.setAttribute("waypoint", "foo", "bar");
    el4.object3D.position.set(-5, 1.6, 0);
    el4.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
    el4.object3D.matrixNeedsUpdate = true;

    const el15 = document.createElement("a-entity");
    this.el.appendChild(el15);
    el15.setAttribute("waypoint", "foo", "bar");
    el15.object3D.position.set(0, 10, 10);
    el15.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el15.object3D.scale.set(6, 6, 6);
    el15.object3D.matrixNeedsUpdate = true;

    const el3 = document.createElement("a-entity");
    this.el.appendChild(el3);
    el3.setAttribute("waypoint", "foo", "bar");
    el3.object3D.position.set(0, 1.6, -5);
    el3.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    el3.object3D.matrixNeedsUpdate = true;

    const el6 = document.createElement("a-entity");
    this.el.appendChild(el6);
    el6.setAttribute("waypoint", "foo", "bar");
    el6.object3D.position.set(5, 2.0, 0);
    el6.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    el6.object3D.matrixNeedsUpdate = true;

    const el5 = document.createElement("a-entity");
    this.el.appendChild(el5);
    el5.setAttribute("waypoint", "foo", "bar");
    el5.object3D.position.set(5, 1.6, 5);
    el5.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 4);
    el5.object3D.matrixNeedsUpdate = true;

    const el13 = document.createElement("a-entity");
    this.el.appendChild(el13);
    el13.setAttribute("waypoint", "foo", "bar");
    el13.object3D.position.set(0, 10, 10);
    el13.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el13.object3D.scale.set(6, 6, 6);
    el13.object3D.matrixNeedsUpdate = true;

    const el7 = document.createElement("a-entity");
    this.el.appendChild(el7);
    el7.setAttribute("waypoint", "foo", "bar");
    el7.object3D.position.set(1, 4, 0);
    el7.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), -Math.PI / 2);
    el7.object3D.matrixNeedsUpdate = true;
    const el9 = document.createElement("a-entity");
    this.el.appendChild(el9);
    el9.setAttribute("waypoint", "foo", "bar");
    el9.object3D.position.set(0, 4, 1);
    el9.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI);
    el9.object3D.matrixNeedsUpdate = true;
    const el8 = document.createElement("a-entity");
    this.el.appendChild(el8);
    el8.setAttribute("waypoint", "foo", "bar");
    el8.object3D.position.set(-1, 4, 0);
    el8.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), Math.PI / 2);
    el8.object3D.matrixNeedsUpdate = true;
    const el10 = document.createElement("a-entity");
    this.el.appendChild(el10);
    el10.setAttribute("waypoint", "foo", "bar");
    el10.object3D.position.set(0, 4, -1);
    el10.object3D.quaternion.setFromAxisAngle(v.set(0, 1, 0), 0);
    el10.object3D.matrixNeedsUpdate = true;

    const el14 = document.createElement("a-entity");
    this.el.appendChild(el14);
    el14.setAttribute("waypoint", "disableMovement", true);
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
