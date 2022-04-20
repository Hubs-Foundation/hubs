import { waitForDOMContentLoaded } from "../utils/async-utils";

export class NameTagVisibilitySystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.store = window.APP.store;
    this.components = [];
    this.lastUpdateTime = Date.now();
    this.tick = this.tick.bind(this);
    this.onStateChanged = this.onStateChanged.bind(this);
    this.nametagVisibility = this.store.state.preferences.nametagVisibility;
    this.nametagVisibilityDistance = Math.pow(this.store.state.preferences.nametagVisibilityDistance, 2);
    waitForDOMContentLoaded().then(() => {
      this.avatarRig = document.getElementById("avatar-rig").object3D;
    });
    window.APP.store.addEventListener("statechanged", this.onStateChanged);
  }

  register(component) {
    this.components.push(component);
  }

  unregister(component) {
    this.components.splice(this.components.indexOf(component), 1);
  }

  tick = (function() {
    const worldPos = new THREE.Vector3();
    const avatarRigWorldPos = new THREE.Vector3();
    return function tick() {
      this.avatarRig.getWorldPosition(avatarRigWorldPos);
      this.components.forEach(nametag => {
        if (this.nametagVisibility === "showSpeaking") {
          const now = Date.now();
          if (!nametag.isTalking && nametag.wasTalking) {
            if (now - nametag.lastUpdateTime > 3000) {
              nametag.shouldBeVisible = false;
            }
          } else if (nametag.isTalking && !nametag.wasTalking) {
            nametag.lastUpdateTime = Date.now();
            nametag.shouldBeVisible = true;
          } else if (!nametag.isTalking && !nametag.wasTalking) {
            if (now - nametag.lastUpdateTime > 3000) {
              nametag.shouldBeVisible = false;
            }
          }
        } else if (this.nametagVisibility === "showFrozen") {
          nametag.shouldBeVisible = this.sceneEl.is("frozen");
        } else if (this.nametagVisibility === "showNone") {
          nametag.shouldBeVisible = false;
        } else if (this.nametagVisibility === "showClose") {
          if (nametag.ikRoot) {
            nametag.ikRoot.getWorldPosition(worldPos);
            nametag.shouldBeVisible = worldPos.sub(avatarRigWorldPos).lengthSq() < this.nametagVisibilityDistance;
          }
        } else {
          nametag.shouldBeVisible = true;
        }
      });
    };
  })();

  onStateChanged() {
    this.nametagVisibilityDistance = Math.pow(this.store.state.preferences.nametagVisibilityDistance, 2);
    this.nametagVisibility = this.store.state.preferences.nametagVisibility;
  }
}
