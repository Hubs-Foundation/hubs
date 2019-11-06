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
  console.log(`spawning ${templateId}`);
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

function isTeleportWaypoint(data) {
  return data.canBeClicked && !data.canBeOccupied && !data.canBeSpawnPoint;
}
function loadTemplatesForWaypointData(scene, data) {
  const promises = [];
  if (isTeleportWaypoint(data)) {
    promises.push(getPooledElOrLoadFromTemplate(scene, "teleport-waypoint-icon"));
  } else if (isUnoccupiableSpawnPoint(data)) {
    promises.push(getPooledElOrLoadFromTemplate(scene, "teleport-waypoint-icon"));
  } else if (isOccupiableSpawnPoint(data)) {
    console.log("occupiable waypoint!", data);
    promises.push(getPooledElOrLoadFromTemplate(scene, "occupiable-waypoint-icon"));
  } else {
    promises.push(getPooledElOrLoadFromTemplate(scene, "teleport-waypoint-icon"));
  }
  return promises;
}
function isOrWillBeOccupied(waypointComponent) {
  return (
    (waypointComponent.data.willBeOccupied || waypointComponent.data.isOccupied) &&
    NAF.utils.getNetworkOwner(waypointComponent.el) !== "scene"
  );
}
function shouldTryToOccupy(waypointComponent) {
  return waypointComponent.data.canBeOccupied && !isOrWillBeOccupied(waypointComponent);
}

export class WaypointSystem {
  constructor(scene) {
    this.components = [];
    this.loading = [];
    this.ready = [];
    this.elementsFromTemplatesFor = {};
    this.eventHandlers = [];
    this.scene = scene;
  }
  tryToOccupy(waypointComponent) {
    return new Promise(resolve => {
      if (
        shouldTryToOccupy(waypointComponent) &&
        (NAF.utils.isMine(waypointComponent.el) || NAF.utils.takeOwnership(waypointComponent.el))
      ) {
        console.log("not occupied so gonna try to take it", waypointComponent.data.isOccupied);
        waypointComponent.el.setAttribute("waypoint", { willBeOccupied: true });
        setTimeout(() => {
          if (NAF.utils.isMine(waypointComponent.el)) {
            waypointComponent.el.setAttribute("waypoint", { isOccupied: true, willBeOccupied: false });
            resolve(true);
          } else {
            debugDrawRect("black");
            resolve(false);
          }
        }, ENSURE_OWNERSHIP_RETAINED_TIMEOUT);
      } else {
        resolve(false);
      }
    });
  }
  acquireSpawnPointFromCandidates(candidates) {
    if (!candidates.length) return Promise.reject("Could not find suitable spawn point.");
    const candidate = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
    return randomDelay()
      .then(() => this.tryToOccupy(candidate))
      .then(didOccupy => {
        if (didOccupy) {
          return Promise.resolve(candidate);
        } else {
          return this.acquireSpawnPointFromCandidates(candidates);
        }
      });
  }
  getUnoccupiableSpawnPoint() {
    const candidates = this.ready.filter(component => isUnoccupiableSpawnPoint(component.data));
    return candidates.length && candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
  }
  getSpawnPoint() {
    const candidates = this.ready.filter(component => isOccupiableSpawnPoint(component.data));
    return this.acquireSpawnPointFromCandidates(candidates).then(candidate => {
      //TODO: When should waypoints become unoccupied?
      return Promise.resolve(candidate);
    });
  }
  teleportToWaypoint(iconEl, waypointComponent) {
    return function onInteract() {
      console.log("teleportToWaypoint");
      this.releaseAnyOccupiedWaypoints();
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      waypointComponent.el.object3D.updateMatrices();
      this.characterController.enqueueWaypointTravelTo(
        waypointComponent.el.object3D.matrixWorld,
        waypointComponent.data,
        300
      );
    }.bind(this);
  }
  tryTeleportToOccupiableWaypoint(iconEl, waypointComponent) {
    return function onInteract() {
      console.log("tryTeleportToOccupiableWaypoint");
      this.releaseAnyOccupiedWaypoints();
      this.tryToOccupy(waypointComponent).then(didOccupy => {
        if (didOccupy) {
          console.log("tryOccupySuccess!");
          this.characterController =
            this.characterController || document.getElementById("avatar-rig").components["character-controller"];
          waypointComponent.el.object3D.updateMatrices();
          this.characterController.enqueueWaypointTravelTo(
            waypointComponent.el.object3D.matrixWorld,
            waypointComponent.data,
            300
          );
        } else {
          console.log("failed to occupy");
        }
      });
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
    });
  }
  setupEventHandlersFor(component) {
    return function setupEventHandlers(elFromTemplate) {
      if (isTagged(elFromTemplate, "singleActionButton") && (true || component.data.canBeClicked)) {
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
          this.eventHandlers[elementsFromTemplates[i].object3D.uuid]["interact"]
        ) {
          elementsFromTemplates[i].object3D.removeEventListener(
            "interact",
            this.eventHandlers[elementsFromTemplates[i].object3D.uuid]["interact"]
          );
          delete this.eventHandlers[elementsFromTemplates[i].object3D.uuid]["interact"];
        }
      }
      this.elementsFromTemplatesFor[component.el.object3D.uuid].length = 0;
    }
  }

  tick() {
    const isEntered = this.scene.is("entered");
    if (isEntered && !this.wasEntered) {
      this.moveToSpawnPoint();
    }
    this.wasEntered = isEntered;

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
    }
    this.ready.forEach(tickWaypoint.bind(this));
  }
  releaseAnyOccupiedWaypoints() {
    const occupiableWaypoints = this.ready.filter(
      waypointComponent => waypointComponent.data.canBeOccupied && NAF.utils.isMine(waypointComponent.el)
    );
    for (let i = 0; i < occupiableWaypoints.length; i++) {
      occupiableWaypoints[i].el.setAttribute("waypoint", { isOccupied: false, willBeOccupied: false });
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
      debugDrawRect("cyan");
    } else {
      debugDrawRect("purple");
    }
  }
  moveToSpawnPoint = (function() {
    return function moveToSpawnPoint() {
      if (this.isMovingToSpawnPoint) {
        setTimeout(() => {
          this.moveToSpawnPoint();
        }, 3000);
        return;
      }
      this.releaseAnyOccupiedWaypoints();
      this.isMovingToSpawnPoint = true;
      debugDrawRect("blue");
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
          debugDrawRect("green");
          this.isMovingToSpawnPoint = false;
        },
        reason => {
          console.warn(reason);
          debugDrawRect("red");
          this.moveToUnoccupiableSpawnPoint();
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
    this.loggedUpdateCount = 0;
    this.updateCount = 0;
    this.ticks = 0;
  },
  update(data) {
    console.log(data);
    this.updateCount += 1;
  },
  tick() {
    this.ticks = this.ticks + 1;
    if (this.updateCount > this.loggedUpdateCount) {
      this.loggedUpdateCount = this.updateCount;
      console.log(this.updateCount, this.ticks);
    }
  },
  remove() {
    this.system.unregisterComponent(this);
  }
});
