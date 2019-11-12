import { setMatrixWorld, rotateInPlaceAroundWorldUp } from "../utils/three-utils";
import { DebugDrawRect } from "./waypoint-tests";
import { isTagged } from "../components/tags";
import { getCurrentPlayerHeight } from "../utils/get-current-player-height";
const ENSURE_OWNERSHIP_RETAINED_TIMEOUT = 1000; // Should be enough time to resolve multiple ownership requests
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
  } else if (isUnoccupiableTeleportWaypoint(data)) {
    templateIds.push("teleport-waypoint-icon");
  } else if (isUnoccupiableSpawnPoint(data)) {
    //    templateIds.push("teleport-waypoint-icon");
  } else if (isOccupiableSpawnPoint(data)) {
    //    templateIds.push("occupiable-waypoint-icon");
  } else {
    //templateIds.push("teleport-waypoint-icon");
  }
  return templateIds;
}
function loadTemplatesForWaypointData(scene, data) {
  return templatesToLoadForWaypointData(data).map(templateId => getPooledElOrLoadFromTemplate(scene, templateId));
}

function shouldTryToOccupy(waypointComponent) {
  return (
    waypointComponent.data.canBeOccupied &&
    (NAF.utils.isMine(waypointComponent.el) ||
      !(
        waypointComponent.data.isOccupied &&
        NAF.connection.connectedClients[NAF.utils.getNetworkOwner(waypointComponent.el)]
      ))
  );
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
  waypointComponent.el.setAttribute("waypoint", { isOccupied: false });
  debugDrawRect("yellow");
}
function unoccupyWaypoints(waypointComponents) {
  waypointComponents.filter(isOccupiedByMe).forEach(unoccupyWaypoint);
}
function occupyWaypoint(waypointComponent) {
  console.log("occupying", waypointComponent);
  waypointComponent.el.setAttribute("waypoint", { isOccupied: true });
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
    loadTemplateAndAddToScene(scene, "waypoint-preview-avatar-template").then(el => {
      this.waypointPreviewAvatar = el;
      this.waypointPreviewAvatar.object3D.visible = false;
    });
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
        0
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
          debugDrawRect("lightgreen");
        } else {
          console.log("Could not occupy waypoint:", waypointComponent);
        }
      });
    }.bind(this);
  }
  setupEventHandlersFor(component) {
    return function setupEventHandlers(elFromTemplate) {
      this.eventHandlers[elFromTemplate.object3D.uuid] = this.eventHandlers[elFromTemplate.object3D.uuid] || {};
      if (
        component.data.canBeClicked &&
        (elFromTemplate.classList.contains("teleport-waypoint-icon") ||
          elFromTemplate.classList.contains("occupiable-waypoint-icon"))
      ) {
        const onHover = () => {
          component.el.object3D.updateMatrices();
          if (this.waypointPreviewAvatar) {
            this.waypointPreviewAvatar.object3D.visible = true;
            component.el.object3D.updateMatrices();
            setMatrixWorld(this.waypointPreviewAvatar.object3D, component.el.object3D.matrixWorld);
          }
        };
        const onUnhover = () => {
          if (this.waypointPreviewAvatar) {
            this.waypointPreviewAvatar.object3D.visible = false;
          }
        };
        elFromTemplate.object3D.addEventListener("hovered", onHover);
        elFromTemplate.object3D.addEventListener("unhovered", onUnhover);
        this.eventHandlers[elFromTemplate.object3D.uuid]["hovered"] = onHover;
        this.eventHandlers[elFromTemplate.object3D.uuid]["unhovered"] = onUnhover;
      }
      if (isTagged(elFromTemplate, "singleActionButton") && component.data.canBeClicked) {
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
    return waypointComponent;
  }
  tryToOccupy(waypointComponent) {
    const previousPOV = new THREE.Matrix4();
    return new Promise(resolve => {
      this.avatarPOV = this.avatarPOV || document.getElementById("avatar-pov-node");
      this.avatarPOV.object3D.updateMatrices();
      previousPOV.copy(this.avatarPOV.object3D.matrixWorld);
      previousPOV.elements[13] -= getCurrentPlayerHeight();
      rotateInPlaceAroundWorldUp(previousPOV, Math.PI, previousPOV);

      waypointComponent.el.object3D.updateMatrices();
      this.characterController =
        this.characterController || document.getElementById("avatar-rig").components["character-controller"];
      this.characterController.enqueueWaypointTravelTo(
        waypointComponent.el.object3D.matrixWorld,
        waypointComponent.data,
        0
      );
      if (shouldTryToOccupy(waypointComponent) && isMineOrTakeOwnership(waypointComponent.el)) {
        occupyWaypoint(waypointComponent);
        setTimeout(() => {
          if (NAF.utils.isMine(waypointComponent.el)) {
            resolve(true);
          } else {
            this.characterController.enqueueWaypointTravelTo(previousPOV, waypointComponent.data, 0);
            resolve(false);
          }
        }, ENSURE_OWNERSHIP_RETAINED_TIMEOUT);
      } else {
        this.characterController.enqueueWaypointTravelTo(previousPOV, waypointComponent.data, 0);
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
  moveToSpawnPoint() {
    if (!this.nextMoveToSpawn) {
      this.nextMoveToSpawn = new Promise(resolve => {
        this.nextMoveToSpawnResolve = resolve;
      });
    }
    return this.nextMoveToSpawn;
  }

  tick() {
    if (!this.currentMoveToSpawn && this.nextMoveToSpawn) {
      this.currentMoveToSpawn = this.nextMoveToSpawn;
      this.currentMoveToSpawnResolve = this.nextMoveToSpawnResolve;
      this.nextMoveToSpawn = null;
      this.nextMoveToSpawnResolve = null;
      debugDrawRect("orange");

      let resolvedWaypointOrNull;
      this.tryToOccupyAnyOf(this.ready.filter(component => isOccupiableSpawnPoint(component.data))).then(
        waypointComponentOrNull => {
          if (waypointComponentOrNull) {
            const waypointComponent = waypointComponentOrNull;
            resolvedWaypointOrNull = waypointComponent;
            //waypointComponent.el.object3D.updateMatrices();
            //this.characterController =
            //  this.characterController || document.getElementById("avatar-rig").components["character-controller"];
            //this.characterController.enqueueWaypointTravelTo(
            //  waypointComponent.el.object3D.matrixWorld,
            //  waypointComponent.data,
            //  0
            //);
            debugDrawRect("lightgreen");
          } else if (waypointComponentOrNull === null) {
            resolvedWaypointOrNull = this.moveToUnoccupiableSpawnPoint();
          }
          this.currentMoveToSpawnResolve(resolvedWaypointOrNull);
          this.currentMoveToSpawn = null;
          this.currentMoveToSpawnResolve = null;
        }
      );
    }

    const tickTemplateEl = (elementFromTemplate, waypointComponent) => {
      if (
        elementFromTemplate.classList.contains("teleport-waypoint-icon") ||
        elementFromTemplate.classList.contains("occupiable-waypoint-icon")
      ) {
        elementFromTemplate.object3D.visible = this.scene.is("frozen");
        waypointComponent.el.object3D.updateMatrices();
        const target = new THREE.Matrix4().identity();
        target.makeRotationY(Math.PI);
        target.elements[13] = getCurrentPlayerHeight();
        const t2 = new THREE.Matrix4().identity();
        t2.copy(waypointComponent.el.object3D.matrixWorld).multiply(target);
        elementFromTemplate.object3D.updateMatrices();
        const scale = new THREE.Vector3().setFromMatrixScale(elementFromTemplate.object3D.matrixWorld);
        const t3 = new THREE.Matrix4()
          .extractRotation(t2)
          .scale(scale)
          .copyPosition(t2);
        setMatrixWorld(elementFromTemplate.object3D, t3);
      }
    };
    function tickWaypoint(waypointComponent) {
      const elementsFromTemplates = this.elementsFromTemplatesFor[waypointComponent.el.object3D.uuid];
      elementsFromTemplates.forEach(el => tickTemplateEl(el, waypointComponent));
      // TODO: When the icon is hovered, show the transparent waypoint preview model
    }
    this.ready.forEach(tickWaypoint.bind(this));
    window.logStuff = false;
  }
}

AFRAME.registerComponent("waypoint", {
  schema: {
    canBeSpawnPoint: { default: false },
    canBeOccupied: { default: false },
    canBeClicked: { default: false },
    willDisableMotion: { default: false },
    willMaintainWorldUp: { default: true },
    isOccupied: { default: false }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].waypointSystem;
    this.didRegisterWithSystem = false;
  },
  play() {
    if (this.canBeOccupied) {
      const persistentFirstSync = NAF.entities.getPersistentFirstSync(this.el.components.networked.data.networkId);
      if (persistentFirstSync) {
        this.el.components.networked.data.applyPersistentFirstSync();
      }
    }
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
