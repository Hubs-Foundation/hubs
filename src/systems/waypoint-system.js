import { setMatrixWorld } from "../utils/three-utils";
import { DebugDrawRect } from "./waypoint-tests";
import { isTagged } from "../components/tags";
const ENSURE_OWNERSHIP_RETAINED_TIMEOUT = 500; // Should be enough time to resolve multiple ownership requests
const DEBUG = true;
function debugDrawRect(color) {
  return DEBUG && DebugDrawRect(color);
}
function randomDelay() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, Math.floor(Math.random() * 500));
  });
}
function isMineOrTakeOwnership(el) {
  return NAF.utils.isMine(el) || NAF.utils.takeOwnership(el);
}
function isOccupiableSpawnPoint(waypointData) {
  return waypointData.canBeOccupied && waypointData.canBeSpawnPoint;
}
function isUnoccupiableSpawnPoint(waypointData) {
  return !waypointData.canBeOccupied && waypointData.canBeSpawnPoint;
}
function loadTemplateAndAddToScene(scene, templateId) {
  return new Promise(resolve => {
    const content = document.importNode(document.getElementById(templateId).content.children[0]);
    scene.appendChild(content, true);
    resolve(content);
  });
}
const pooledEls = {};
//TODO:
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

function isOccupiableTeleportWaypoint(data) {
  return data.canBeClicked && data.canBeOccupied && !data.canBeSpawnPoint;
}
function isUnoccupiableTeleportWaypoint(data) {
  return data.canBeClicked && !data.canBeOccupied && !data.canBeSpawnPoint;
}
function templatesToLoadForWaypointData(data) {
  const templateIds = [];
  if (isOccupiableTeleportWaypoint(data)) {
    templateIds.push("occupiable-waypoint-icon");
  } else if (isUnoccupiableSpawnPoint(data)) {
    templateIds.push("teleport-waypoint-icon");
  } else if (isOccupiableSpawnPoint(data)) {
    templateIds.push("occupiable-waypoint-icon");
  } else if (isUnoccupiableTeleportWaypoint(data)) {
    templateIds.push("teleport-waypoint-icon");
  } else {
    templateIds.push("teleport-waypoint-icon");
  }
  return templateIds;
}
function loadTemplatesForWaypointData(scene, data) {
  return templatesToLoadForWaypointData(data).map(templateId => getPooledElOrLoadFromTemplate(scene, templateId));
}

function isOrWillBeOccupied(waypointComponent) {
  return (
    (waypointComponent.data.willBeOccupied || waypointComponent.data.isOccupied) &&
    NAF.utils.getNetworkOwner(waypointComponent.el) !== "scene" // can't be occupied by the scene
  );
}
function shouldTryToOccupy(waypointComponent) {
  return waypointComponent.data.canBeOccupied && !isOrWillBeOccupied(waypointComponent);
}

function isOccupiedByMe(waypointComponent) {
  return (
    waypointComponent.data.canBeOccupied &&
    waypointComponent.data.isOccupied &&
    waypointComponent.el.components.networked &&
    NAF.utils.isMine(waypointComponent.el)
  );
}
function unoccupyWaypoint(waypointComponent) {
  waypointComponent.el.setAttribute("waypoint", { isOccupied: false, willBeOccupied: false });
  debugDrawRect("yellow");
}
function unoccupyWaypoints(waypointComponents) {
  waypointComponents.filter(isOccupiedByMe).forEach(unoccupyWaypoint);
}
function occupyWaypoint(waypointComponent) {
  waypointComponent.el.setAttribute("waypoint", { isOccupied: true, willBeOccupied: false });
}

function signalIntentToOccupyWaypoint(waypointComponent) {
  waypointComponent.el.setAttribute("waypoint", { willBeOccupied: true });
}

export class WaypointSystem {
  constructor(scene) {
    this.scene = scene;
    this.components = [];
    this.loading = [];
    this.ready = [];
    this.waypointForTemplateEl = {};
    this.elementsFromTemplatesFor = {};
    this.eventHandlers = [];
  }

  releaseAnyOccupiedWaypoints() {
    debugDrawRect("lightyellow");
    unoccupyWaypoints(this.ready);
  }

  teleportToWaypoint(iconEl, waypointComponent) {
    return function onInteract() {
      this.releaseAnyOccupiedWaypoints();
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      waypointComponent.el.object3D.updateMatrices();
      debugDrawRect("lightpurple");
      this.characterController.enqueueWaypointTravelTo(
        waypointComponent.el.object3D.matrixWorld,
        waypointComponent.data,
        300
      );
    }.bind(this);
  }
  tryTeleportToOccupiableWaypoint(iconEl, waypointComponent) {
    return function onInteract() {
      const previouslyOccupiedWaypoints = this.ready.filter(isOccupiedByMe);
      this.tryToOccupy(waypointComponent).then(didOccupy => {
        if (didOccupy) {
          previouslyOccupiedWaypoints
            .filter(wp => wp !== waypointComponent && isOccupiedByMe(wp))
            .forEach(unoccupyWaypoint);

          this.characterController =
            this.characterController || document.getElementById("avatar-rig").components["character-controller"];
          waypointComponent.el.object3D.updateMatrices();

          debugDrawRect("lightgreen");
          this.characterController.enqueueWaypointTravelTo(
            waypointComponent.el.object3D.matrixWorld,
            waypointComponent.data,
            300
          );
        } else {
          console.log("Could not occupy waypoint:", waypointComponent);
        }
      });
    }.bind(this);
  }
  setupEventHandlersFor(component) {
    return function setupEventHandlers(elFromTemplate) {
      if (isTagged(elFromTemplate, "singleActionButton") && component.data.canBeClicked) {
        this.eventHandlers[elFromTemplate.object3D.uuid] = this.eventHandlers[elFromTemplate.object3D.uuid] || {};
        let onInteract = () => {
          console.log("interacted with", elFromTemplate, "associated with waypoint", component);
        };
        if (elFromTemplate.classList.contains("teleport-waypoint-icon")) {
          onInteract = this.teleportToWaypoint(elFromTemplate, component);
        } else if (elFromTemplate.classList.contains("occupiable-waypoint-icon")) {
          onInteract = this.tryTeleportToOccupiableWaypoint(elFromTemplate, component);
        }
        elFromTemplate.object3D.addEventListener("interact", onInteract);
        this.eventHandlers[elFromTemplate.object3D.uuid]["interact"] = onInteract;
      }
    }.bind(this);
  }
  registerComponent(component) {
    this.components.push(component);
    this.loading.push(component);
    const setupEventHandlers = this.setupEventHandlersFor(component);
    this.elementsFromTemplatesFor[component.el.object3D.uuid] =
      this.elementsFromTemplatesFor[component.el.object3D.uuid] || [];
    Promise.all(loadTemplatesForWaypointData(this.scene, component.data)).then(elementsFromTemplates => {
      this.loading.splice(this.loading.indexOf(component), 1);
      this.ready.push(component);
      this.elementsFromTemplatesFor[component.el.object3D.uuid].push(...elementsFromTemplates);
      elementsFromTemplates.forEach(setupEventHandlers);
      elementsFromTemplates.forEach(el => {
        this.waypointForTemplateEl[el.object3D.uuid] = component;
      });
    });
  }
  unregisterComponent(component) {
    const ci = this.components.indexOf(component);
    if (ci !== -1) {
      this.components.splice(ci, 1);
    }
    const li = this.loading.indexOf(component);
    if (li !== -1) {
      this.loading.splice(li, 1);
    }
    const ri = this.ready.indexOf(component);
    if (ri !== -1) {
      this.ready.splice(ri, 1);
      const elementsFromTemplates = this.elementsFromTemplatesFor[component.el.object3D.uuid];
      for (let i = 0; i < elementsFromTemplates.length; i++) {
        if (
          this.eventHandlers[elementsFromTemplates[i].object3D.uuid] &&
          this.eventHandlers[elementsFromTemplates[i].object3D.uuid].interact
        ) {
          elementsFromTemplates[i].object3D.removeEventListener(
            "interact",
            this.eventHandlers[elementsFromTemplates[i].object3D.uuid].interact
          );
          delete this.eventHandlers[elementsFromTemplates[i].object3D.uuid].interact;
        }
      }
      this.elementsFromTemplatesFor[component.el.object3D.uuid].length = 0;
    }
  }
  getUnoccupiableSpawnPoint() {
    const candidates = this.ready.filter(component => isUnoccupiableSpawnPoint(component.data));
    return candidates.length && candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
  }
  moveToUnoccupiableSpawnPoint() {
    this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
    this.avatarPOV.object3D.updateMatrices();
    this.characterController =
      this.characterController || document.getElementById("avatar-rig").components["character-controller"];
    const waypointComponent = this.getUnoccupiableSpawnPoint();
    if (waypointComponent) {
      this.releaseAnyOccupiedWaypoints();
      waypointComponent.el.object3D.updateMatrices();
      this.characterController.enqueueWaypointTravelTo(
        waypointComponent.el.object3D.matrixWorld,
        waypointComponent.data,
        0
      );
      debugDrawRect("lightblue");
    } else {
      debugDrawRect("lightred");
    }
  }
  tryToOccupy(waypointComponent) {
    return new Promise(resolve => {
      if (shouldTryToOccupy(waypointComponent) && isMineOrTakeOwnership(waypointComponent.el)) {
        signalIntentToOccupyWaypoint(waypointComponent);
        setTimeout(() => {
          if (NAF.utils.isMine(waypointComponent.el)) {
            occupyWaypoint(waypointComponent);
            resolve(true);
          } else {
            resolve(false);
          }
        }, ENSURE_OWNERSHIP_RETAINED_TIMEOUT);
      } else {
        resolve(false);
      }
    });
  }
  tryToOccupyAnyOf(waypoints) {
    if (!waypoints.length) return Promise.resolve(null);
    const previouslyOccupiedWaypoints = this.ready.filter(isOccupiedByMe);
    const candidate = waypoints.splice(Math.floor(Math.random() * waypoints.length), 1)[0];
    return randomDelay()
      .then(() => this.tryToOccupy(candidate))
      .then(didOccupy => {
        if (didOccupy) {
          previouslyOccupiedWaypoints.filter(wp => wp !== candidate && isOccupiedByMe(wp)).forEach(unoccupyWaypoint);
          return Promise.resolve(candidate);
        } else {
          return this.tryToOccupyAnyOf(waypoints);
        }
      });
  }
  getOccupiableSpawnPoint() {
    return;
  }
  moveToSpawnPoint() {
    if (this.isMovingToSpawnPoint) {
      return new Promise(resolve => {
        setTimeout(() => {
          this.moveToSpawnPoint().then(resolve);
        }, 1000);
      });
      //TODO: What is the desired behavior if moveToSpawnPoint is called rapidly multiple times in a row?
    }
    this.isMovingToSpawnPoint = true;
    debugDrawRect("orange");

    return this.tryToOccupyAnyOf(this.ready.filter(component => isOccupiableSpawnPoint(component.data))).then(
      waypointComponentOrNull => {
        if (waypointComponentOrNull) {
          const waypointComponent = waypointComponentOrNull;
          waypointComponent.el.object3D.updateMatrices();
          this.characterController =
            this.characterController || document.getElementById("avatar-rig").components["character-controller"];
          debugDrawRect("lightgreen");
          this.characterController.enqueueWaypointTravelTo(
            waypointComponent.el.object3D.matrixWorld,
            waypointComponent.data,
            0
          );
        } else if (waypointComponentOrNull === null) {
          this.moveToUnoccupiableSpawnPoint();
        }
        this.isMovingToSpawnPoint = false;
      }
    );
  }

  tick() {
    function tickTemplateEl(elementFromTemplate, waypointComponent) {
      if (
        elementFromTemplate.classList.contains("teleport-waypoint-icon") ||
        elementFromTemplate.classList.contains("occupiable-waypoint-icon")
      ) {
        waypointComponent.el.object3D.updateMatrices();
        setMatrixWorld(elementFromTemplate.object3D, waypointComponent.el.object3D.matrixWorld);
      }
    }
    function tickWaypoint(waypointComponent) {
      const elementsFromTemplates = this.elementsFromTemplatesFor[waypointComponent.el.object3D.uuid];
      elementsFromTemplates.forEach(el => tickTemplateEl(el, waypointComponent));
      // TODO: When the icon is hovered, show the transparent waypoint preview model
    }
    this.ready.forEach(tickWaypoint.bind(this));
  }
}

AFRAME.registerComponent("waypoint", {
  schema: {
    canBeSpawnPoint: { default: false },
    canBeOccupied: { default: false },
    canBeClicked: { default: false },
    willDisableMotion: { default: false },
    willMaintainWorldUp: { default: true },

    willBeOccupied: { default: false },
    isOccupied: { default: false }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].waypointSystem;
    this.didRegisterWithSystem = false;
  },
  play() {
    if (!this.didRegisterWithSystem) {
      this.system.registerComponent(this, this.el.sceneEl);
      this.didRegisterWithSystem = true;
    }
  },
  remove() {
    if (!this.didRegisterWithSystem) {
      console.warn("Waypoint removed without ever having registered with the system.");
    } else {
      this.system.unregisterComponent(this);
    }
  }
});
