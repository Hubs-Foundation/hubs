import { setMatrixWorld, affixToWorldUp } from "../utils/three-utils";
import { isTagged } from "../components/tags";
import { applyPersistentSync } from "../utils/permissions-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
const calculateIconTransform = (function() {
  const up = new THREE.Vector3();
  const backward = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const camToWaypoint = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const m1 = new THREE.Matrix4();
  const position = new THREE.Vector3();
  let scale = 1;

  return function calculateIconTransform(waypoint, viewingCamera, outMat4) {
    waypoint.updateMatrices();
    viewingCamera.updateMatrices();
    affixToWorldUp(m1.copy(waypoint.matrixWorld), m1).extractBasis(v1, up, backward);
    position
      .setFromMatrixPosition(waypoint.matrixWorld)
      .add(v1.addVectors(up.multiplyScalar(1.6), backward.multiplyScalar(0.15)));
    camToWaypoint.subVectors(position, v1.setFromMatrixPosition(viewingCamera.matrixWorld));
    const distance = camToWaypoint.length();
    const minDistance = distance < 0.2 * v1.setFromMatrixColumn(viewingCamera.matrixWorld, 0).length();
    if (distance < minDistance) {
      scale = 0.00001;
      camToWaypoint.set(0, 0, -1);
    } else {
      scale = 0.1 + 0.05 * distance;
    }
    forward
      .copy(camToWaypoint)
      .projectOnPlane(up.set(0, 1, 0))
      .normalize();

    return outMat4
      .makeBasis(
        v1.crossVectors(forward, up).multiplyScalar(scale),
        up.multiplyScalar(scale),
        forward.multiplyScalar(scale * -1)
      )
      .setPosition(position);
  };
})();
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
    setTimeout(() => {
      // Without this timeout, this resolves too early in Firefox for Android
      // we have to wait a tick for the attach callbacks to get fired for the elements in a template
      resolve(content);
    }, 0);
  });
}
function templatesToLoadForWaypointData(data) {
  const templateIds = [];
  if (data.canBeClicked && data.canBeOccupied) {
    templateIds.push("occupiable-waypoint-icon");
  } else if (data.canBeClicked && !data.canBeOccupied) {
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
  return templatesToLoadForWaypointData(data).map(templateId => loadTemplateAndAddToScene(scene, templateId));
}

function shouldTryToOccupy(waypointComponent) {
  return (
    waypointComponent.data.canBeOccupied &&
    (NAF.utils.isMine(waypointComponent.el) ||
      !(
        waypointComponent.data.isOccupied &&
        NAF.utils.getNetworkOwner(waypointComponent.el) &&
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
}
function unoccupyWaypoints(waypointComponents) {
  waypointComponents.filter(isOccupiedByMe).forEach(unoccupyWaypoint);
}
function occupyWaypoint(waypointComponent) {
  waypointComponent.el.setAttribute("waypoint", { isOccupied: true });
}

function uuid(el) {
  return el.object3D.uuid;
}

export class WaypointSystem {
  constructor(scene, characterController) {
    this.helperMat4 = new THREE.Matrix4();
    this.scene = scene;
    this.loading = [];
    this.ready = [];
    this.previousWaypointHash = null;
    this.initialSpawnHappened = false;

    this.waypointForTemplateEl = {};
    this.elementsFromTemplatesFor = {};
    this.eventHandlers = [];
    this.lostOwnershipOfWaypoint = this.lostOwnershipOfWaypoint.bind(this);
    waitForDOMContentLoaded().then(() => {
      loadTemplateAndAddToScene(scene, "waypoint-preview-avatar-template").then(el => {
        this.waypointPreviewAvatar = el;
        this.waypointPreviewAvatar.object3D.visible = false;
      });
    });
    this.characterController = characterController;
  }

  releaseAnyOccupiedWaypoints() {
    unoccupyWaypoints(this.ready);
    if (this.currentWaypoint) {
      this.currentWaypoint.el.removeEventListener("ownership-lost", this.lostOwnershipOfWaypoint);
    }
  }

  teleportToWaypoint(iconEl, waypointComponent) {
    return function onInteract() {
      this.moveToWaypoint(waypointComponent, false);
    }.bind(this);
  }
  tryTeleportToOccupiableWaypoint(iconEl, waypointComponent) {
    return function onInteract() {
      const previouslyOccupiedWaypoints = this.ready.filter(isOccupiedByMe);
      this.tryToOccupy(waypointComponent).then(didOccupy => {
        if (didOccupy) {
          waypointComponent.el.object3D.updateMatrices();
          this.characterController.shouldLandWhenPossible = true;
          this.characterController.enqueueWaypointTravelTo(
            waypointComponent.el.object3D.matrixWorld,
            false,
            waypointComponent.data
          );
          unoccupyWaypoints(previouslyOccupiedWaypoints.filter(wp => wp !== waypointComponent));
        }
      });
    }.bind(this);
  }
  setupEventHandlersFor(component) {
    return function setupEventHandlers(el) {
      const id = uuid(el);
      this.eventHandlers[id] = this.eventHandlers[id] || {};
      if (
        component.data.canBeClicked &&
        (el.classList.contains("teleport-waypoint-icon") || el.classList.contains("occupiable-waypoint-icon"))
      ) {
        const onHover = () => {
          component.el.object3D.updateMatrices();
          if (this.waypointPreviewAvatar && !this.waypointForTemplateEl[id].data.willMaintainInitialOrientation) {
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
        el.object3D.addEventListener("hovered", onHover);
        el.object3D.addEventListener("unhovered", onUnhover);
        this.eventHandlers[id]["hovered"] = onHover;
        this.eventHandlers[id]["unhovered"] = onUnhover;
      }
      if (isTagged(el, "singleActionButton") && component.data.canBeClicked) {
        let onInteract = () => {
          console.log("interacted with", el, "associated with waypoint", component);
        };
        if (el.classList.contains("teleport-waypoint-icon")) {
          onInteract = this.teleportToWaypoint(el, component);
        } else if (el.classList.contains("occupiable-waypoint-icon")) {
          onInteract = this.tryTeleportToOccupiableWaypoint(el, component);
        }
        el.object3D.addEventListener("interact", onInteract);
        this.eventHandlers[id]["interact"] = onInteract;
      }
    }.bind(this);
  }
  registerComponent(component) {
    this.loading.push(component);
    const setupEventHandlers = this.setupEventHandlersFor(component);
    const waypointId = uuid(component.el);
    this.elementsFromTemplatesFor[waypointId] = this.elementsFromTemplatesFor[waypointId] || [];
    Promise.all(loadTemplatesForWaypointData(this.scene, component.data)).then(elementsFromTemplates => {
      const li = this.loading.indexOf(component);
      if (li === -1) {
        return null;
      }
      this.loading.splice(li, 1);
      this.ready.push(component);
      this.elementsFromTemplatesFor[waypointId].push(...elementsFromTemplates);
      elementsFromTemplates.forEach(el => {
        this.waypointForTemplateEl[uuid(el)] = component;
      });
      elementsFromTemplates.forEach(setupEventHandlers);
    });
  }
  unregisterComponent(component) {
    const li = this.loading.indexOf(component);
    if (li !== -1) {
      this.loading.splice(li, 1);
    }
    const ri = this.ready.indexOf(component);
    if (ri !== -1) {
      this.ready.splice(ri, 1);
      const waypointId = uuid(component.el);
      const elementsFromTemplates = this.elementsFromTemplatesFor[waypointId];
      for (let i = 0; i < elementsFromTemplates.length; i++) {
        const el = elementsFromTemplates[i];
        const id = uuid(el);
        if (this.eventHandlers[id]) {
          const removeEventListener = eventName => {
            if (this.eventHandlers[id][eventName]) {
              el.object3D.removeEventListener(eventName, this.eventHandlers[id][eventName]);
              delete this.eventHandlers[id][eventName];
            }
          };
          ["interact", "hovered", "unhovered"].map(removeEventListener);
        }
        el.parentNode.removeChild(el);
      }
      this.elementsFromTemplatesFor[waypointId].length = 0;
    }
  }
  getUnoccupiableSpawnPoint() {
    const candidates = this.ready.filter(component => isUnoccupiableSpawnPoint(component.data));
    return candidates.length && candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
  }
  lostOwnershipOfWaypoint(e) {
    if (this.currentWaypoint && this.currentWaypoint.el === e.detail.el) {
      this.mightNeedRespawn = true;
      this.ownershipLostTime = performance.now();
    }
  }
  tryToOccupy(waypointComponent) {
    return new Promise(resolve => {
      if (shouldTryToOccupy(waypointComponent) && isMineOrTakeOwnership(waypointComponent.el)) {
        occupyWaypoint(waypointComponent);
        if (this.currentWaypoint) {
          this.currentWaypoint.el.removeEventListener("ownership-lost", this.lostOwnershipOfWaypoint);
        }
        this.currentWaypoint = waypointComponent;
        waypointComponent.el.addEventListener("ownership-lost", this.lostOwnershipOfWaypoint);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
  tryToOccupyAnyOf(waypoints) {
    if (!waypoints.length) return Promise.resolve(null);
    const candidate = waypoints.splice(Math.floor(Math.random() * waypoints.length), 1)[0];
    return this.tryToOccupy(candidate).then(didOccupy => {
      if (didOccupy) {
        return Promise.resolve(candidate);
      } else {
        return this.tryToOccupyAnyOf(waypoints);
      }
    });
  }
  moveToSpawnPoint() {
    if (this.currentMoveToSpawn) {
      return this.currentMoveToSpawn;
    }
    if (!this.nextMoveToSpawn) {
      this.waitOneTick = true;
      this.nextMoveToSpawn = new Promise(resolve => {
        this.nextMoveToSpawnResolve = resolve;
      });
    }
    return this.nextMoveToSpawn;
  }
  moveToWaypoint(waypointComponent, instant) {
    this.releaseAnyOccupiedWaypoints();
    waypointComponent.el.object3D.updateMatrices();
    this.characterController.shouldLandWhenPossible = true;
    this.characterController.enqueueWaypointTravelTo(
      waypointComponent.el.object3D.matrixWorld,
      !window.APP.store.state.preferences.animateWaypointTransitions || instant,
      waypointComponent.data
    );
  }
  moveToUnoccupiableSpawnPoint() {
    const waypointComponent = this.getUnoccupiableSpawnPoint();
    if (waypointComponent) {
      this.moveToWaypoint(waypointComponent, true);
    }
    return waypointComponent;
  }
  tick() {
    if (this.waitOneTick) {
      this.waitOneTick = false;
      return;
    }

    const hashUpdated = window.location.hash !== "" && this.previousWaypointHash !== window.location.hash;

    if (hashUpdated && this.initialSpawnHappened) {
      const waypointName = window.location.hash.replace("#", "");
      const waypoint = this.ready.find(c => c.el.object3D.name === waypointName);
      if (waypoint) {
        this.moveToWaypoint(waypoint, this.previousWaypointHash === null);
        window.location.hash = ""; // Reset so you can re-activate the same waypoint
      }
      this.previousWaypointHash = window.location.hash;
    }

    if (!this.currentMoveToSpawn && this.nextMoveToSpawn) {
      this.mightNeedRespawn = false;
      this.currentMoveToSpawn = this.nextMoveToSpawn;
      this.currentMoveToSpawnResolve = this.nextMoveToSpawnResolve;
      this.nextMoveToSpawn = null;
      this.nextMoveToSpawnResolve = null;

      let resolvedWaypointOrNull;

      const previouslyOccupiedWaypoints = this.ready.filter(isOccupiedByMe);
      this.tryToOccupyAnyOf(this.ready.filter(component => isOccupiableSpawnPoint(component.data))).then(
        waypointComponentOrNull => {
          if (waypointComponentOrNull) {
            const waypointComponent = waypointComponentOrNull;
            unoccupyWaypoints(previouslyOccupiedWaypoints.filter(wp => wp !== waypointComponent));
            waypointComponent.el.object3D.updateMatrices();
            this.characterController.shouldLandWhenPossible = true;
            this.characterController.enqueueWaypointTravelTo(
              waypointComponent.el.object3D.matrixWorld,
              true,
              waypointComponent.data
            );
            resolvedWaypointOrNull = waypointComponent;
          } else if (waypointComponentOrNull === null) {
            resolvedWaypointOrNull = this.moveToUnoccupiableSpawnPoint();
          }
          this.initialSpawnHappened = true;
          this.currentMoveToSpawnResolve(resolvedWaypointOrNull);
          this.currentMoveToSpawn = null;
          this.currentMoveToSpawnResolve = null;
        }
      );
    } else if (this.mightNeedRespawn && performance.now() - this.ownershipLostTime < 8000) {
      this.mightNeedRespawn = false;
      this.moveToSpawnPoint();
    }
    const tickTemplateEl = (elementFromTemplate, waypointComponent) => {
      if (
        elementFromTemplate.classList.contains("teleport-waypoint-icon") ||
        elementFromTemplate.classList.contains("occupiable-waypoint-icon")
      ) {
        elementFromTemplate.object3D.visible = this.scene.is("frozen");
        if (elementFromTemplate.object3D.visible) {
          this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera").object3DMap.camera;
          setMatrixWorld(
            elementFromTemplate.object3D,
            calculateIconTransform(waypointComponent.el.object3D, this.viewingCamera, this.helperMat4)
          );
        }
      }
    };
    function tickWaypoint(waypointComponent) {
      const elementsFromTemplates = this.elementsFromTemplatesFor[uuid(waypointComponent.el)];
      elementsFromTemplates.forEach(el => tickTemplateEl(el, waypointComponent));
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
    willDisableTeleporting: { default: false },
    snapToNavMesh: { default: false },
    willMaintainInitialOrientation: { default: false },
    willMaintainWorldUp: { default: true },
    isOccupied: { default: false }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].waypointSystem;
    this.didRegisterWithSystem = false;
  },
  play() {
    if (!this.didRegisterWithSystem) {
      if (this.el.components.networked) {
        applyPersistentSync(this.el.components.networked.data.networkId);
      }
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
