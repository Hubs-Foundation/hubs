import { setMatrixWorld, calculateCameraTransformForWaypoint, interpolateAffine } from "../utils/three-utils";
import { DEBUG_RENDER_COLORED_RECTANGLE } from "./waypoint-tests";
const THERE_CAN_ONLY_BE_ONE_HIGHLANDER_TIMEOUT = 1000; // Should be enough time to resolve multiple ownership requests
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
//
function isUnoccupiableSpawnPoint(waypointComponent) {
  return !waypointComponent.data.canBeOccupied && waypointComponent.data.canBeSpawnPoint;
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
  if (data.canBeClicked) {
    const el = getPooledElOrLoadFromTemplate(scene, "teleport-waypoint-icon");
    promises.push(el);
  }
  return promises;
}
function isOrWillBeOccupied(waypointComponent) {
  return (
    (waypointComponent.data.willBeOccupied || waypointComponent.data.isOccupied) &&
    NAF.utils.getNetworkOwner(waypointComponent.el) !== "scene"
  );
}
function seemsOkToSpawnAt(waypointComponent) {
  return (
    waypointComponent.data.canBeSpawnPoint &&
    waypointComponent.data.canBeOccupied &&
    !isOrWillBeOccupied(waypointComponent)
  );
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
  tryToOccupy(waypointComponent) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (seemsOkToSpawnAt(waypointComponent)) {
          NAF.utils.takeOwnership(waypointComponent.el);
          waypointComponent.el.setAttribute("waypoint", { willBeOccupied: true });
          setTimeout(() => {
            if (NAF.utils.isMine(waypointComponent.el)) {
              resolve(true);
            } else {
              DEBUG_RENDER_COLORED_RECTANGLE("black");
              resolve(false);
            }
          }, THERE_CAN_ONLY_BE_ONE_HIGHLANDER_TIMEOUT);
        } else {
          resolve(false);
        }
      }, Math.floor(Math.random() * 500));
    });
  }
  acquireSpawnPointFromCandidates(candidates) {
    if (!candidates.length) return Promise.reject("Could not find suitable spawn point.");
    const candidateIndex = Math.floor(Math.random() * candidates.length);
    const candidate = candidates.splice(candidateIndex, 1)[0];
    return this.tryToOccupy(candidate).then(didOccupy => {
      if (didOccupy) {
        return Promise.resolve(candidate);
      } else {
        return this.acquireSpawnPointFromCandidates(candidates);
      }
    });
  }
  getUnoccupiableSpawnPoint() {
    const candidates = this.ready.filter(isUnoccupiableSpawnPoint);
    return candidates.length && candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
  }
  getSpawnPoint() {
    const candidates = Array.from(this.ready);
    return this.acquireSpawnPointFromCandidates(candidates).then(candidate => {
      candidate.el.setAttribute("waypoint", { isOccupied: true, willBeOccupied: false });
      //TODO: When should waypoints become unoccupied?
      return Promise.resolve(candidate);
    });
  }
  onInteractWithWaypointIcon(iconEl, waypointEl) {
    return function onInteract() {
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      waypointEl.object3D.updateMatrices();
      this.characterController.enqueueWaypointTravelTo(
        waypointEl.object3D.matrixWorld,
        waypointEl.components["waypoint"].data,
        300
      );
    }.bind(this);
  }
  registerComponent(c) {
    this.components.push(c);
    this.loading.push(c);
    Promise.all(loadTemplatesForWaypointData(this.scene, c.data)).then(els => {
      this.loading.splice(this.loading.indexOf(c), 1);
      this.ready.push(c);
      this.els[c.el.object3D.uuid] = this.els[c.el.object3D.uuid] || [];
      this.els[c.el.object3D.uuid].push(...els);
      for (let i = 0; i < els.length; i++) {
        if (els[i].classList.contains("way-point-icon") && c.data.canBeClicked) {
          this.eventHandlers[els[i].object3D.uuid] = this.eventHandlers[els[i].object3D.uuid] || {};
          this.eventHandlers[els[i].object3D.uuid]["interact"] = this.onInteractWithWaypointIcon(els[i], c.el);

          els[i].object3D.addEventListener("interact", this.eventHandlers[els[i].object3D.uuid]["interact"]);
        }
      }
    });
  }
  unregisterComponent(c) {
    const ci = this.components.indexOf(c);
    if (ci !== -1) {
      this.components.splice(ci, 1);
    }
    const li = this.loading.indexOf(c);
    if (li !== -1) {
      this.loading.splice(li, 1);
    }
    const ri = this.ready.indexOf(c);
    if (ri !== -1) {
      this.ready.splice(ri, 1);
      const els = this.els[c.el.object3D.uuid];
      for (let i = 0; i < els.length; i++) {
        if (this.eventHandlers[els[i].object3D.uuid] && this.eventHandlers[els[i].object3D.uuid]["interact"]) {
          els[i].object3D.removeEventListener("interact", this.eventHandlers[els[i].object3D.uuid]["interact"]);
          console.log("removing interaction event listener from", els[i]);
          this.eventHandlers[els[i].object3D.uuid].delete("interact");
        }
      }
      this.els[c.el.object3D.uuid].length = 0;
    }
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
  releaseAnyOccupiedWaypoints() {
    for (let i = 0; i < this.ready; i++) {
      if (NAF.utils.isMine(this.ready[i].el) && this.ready[i].data.canBeOccupied) {
        this.ready[i].el.setAttribute("waypoint", { isOccupied: false, willBeOccupied: false });
      }
    }
  }
  moveToUnoccupiableSpawnPoint() {
    this.releaseAnyOccupiedWaypoints();

    this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
    this.avatarPOV.object3D.updateMatrices();
    this.characterController =
      this.characterController || document.getElementById("avatar-rig").components["character-controller"];
    const waypointComponent = this.getUnoccupiableSpawnPoint();
    if (waypointComponent) {
      waypointComponent.el.object3D.updateMatrices();
      this.characterController.enqueueWaypointTravelTo(
        waypointComponent.el.object3D.matrixWorld,
        waypointComponent.data,
        0
      );
      DEBUG_RENDER_COLORED_RECTANGLE("cyan");
    } else {
      DEBUG_RENDER_COLORED_RECTANGLE("purple");
    }
  }
  moveToSpawnPoint = (function() {
    return function moveToSpawnPoint() {
      this.releaseAnyOccupiedWaypoints();
      if (this.isMovingToSpawnPoint) {
        console.log("already trying to move, trying again in a few seconds");
        setTimeout(() => {
          this.moveToSpawnPoint();
        }, 3000);
      }
      this.isMovingToSpawnPoint = true;
      console.log("starting to move");
      DEBUG_RENDER_COLORED_RECTANGLE("blue");
      this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
      this.avatarPOV.object3D.updateMatrices();
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];

      this.getSpawnPoint().then(
        waypointComponent => {
          waypointComponent.el.object3D.updateMatrices();
          this.characterController.enqueueWaypointTravelTo(
            waypointComponent.el.object3D.matrixWorld,
            waypointComponent.data,
            0
          );
          DEBUG_RENDER_COLORED_RECTANGLE("green");
          console.log("not moving anymore");
          this.isMovingToSpawnPoint = false;
        },
        reason => {
          console.warn(reason);
          DEBUG_RENDER_COLORED_RECTANGLE("red");
          this.moveToUnoccupiableSpawnPoint();
          console.log("not moving anymore2 ");
          this.isMovingToSpawnPoint = false;
        }
      );
    };
  })();
}

AFRAME.registerComponent("waypoint", {
  schema: {
    canBeSpawnPoint: { default: false },
    canBeOccupied: { default: false },
    willBeOccupied: { default: false },
    isOccupied: { default: false },
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
