import { setMatrixWorld, calculateCameraTransformForWaypoint, interpolateAffine } from "../utils/three-utils";
import { RENDER_COLORED_RECTANGLE } from "./waypoint-tests";
const THERE_CAN_ONLY_BE_ONE_HIGHLANDER_TIMEOUT = 1500; // Should be enough time to resolve multiple ownership requests
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
              console.log("tried take ownership but then wasn't mine");
              RENDER_COLORED_RECTANGLE("black");
              resolve(false);
            }
          }, THERE_CAN_ONLY_BE_ONE_HIGHLANDER_TIMEOUT);
        } else {
          console.log("didn't seem OK to spawn here");
          resolve(false);
        }
      }, Math.floor(Math.random() * 1000));
    });
  }
  acquireSpawnPointFromCandidates(candidates) {
    if (!candidates.length) return Promise.reject("Could not find suitable spawn point.");
    const candidate = candidates.pop();
    return this.tryToOccupy(candidate).then(didOccupy => {
      if (didOccupy) {
        return Promise.resolve(candidate);
      } else {
        return this.acquireSpawnPointFromCandidates(candidates);
      }
    });
  }
  getSpawnPoint() {
    const candidates = Array.from(this.ready);
    console.log("Trying to find spawn point in:", candidates);
    return this.acquireSpawnPointFromCandidates(candidates).then(candidate => {
      candidate.el.setAttribute("waypoint", { isOccupied: true, willBeOccupied: false });
      this.previousSpawnPoint = candidate;
      //TODO: When should waypoints become unoccupied?
      this.giveUpTimeout = setTimeout(() => {
        if (NAF.utils.isMine(candidate.el)) {
          console.log("giving up occupancy of waypoint...");
          RENDER_COLORED_RECTANGLE("white");
          candidate.el.setAttribute("waypoint", { isOccupied: false });
        } else {
          RENDER_COLORED_RECTANGLE("yellow");
          console.log("somehow lost ownership...");
        }
      }, 20000);
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
  releaseAnyOccupiedWaypoints() {
    if (this.giveUpTimeout) clearTimeout(this.giveUpTimeout);
    if (this.previousSpawnPoint) {
      if (NAF.utils.isMine(this.previousSpawnPoint.el)) {
        this.previousSpawnPoint.el.setAttribute("waypoint", { isOccupied: false, willBeOccupied: false });
        RENDER_COLORED_RECTANGLE("orange");
      }
      this.previousSpawnPoint = null;
    }
  }
  moveToSpawnPoint = (function() {
    return function moveToSpawnPoint() {
      this.releaseAnyOccupiedWaypoints();
      RENDER_COLORED_RECTANGLE("blue");
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
          RENDER_COLORED_RECTANGLE("green");
        },
        reason => {
          console.warn(reason);
          RENDER_COLORED_RECTANGLE("red");
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
