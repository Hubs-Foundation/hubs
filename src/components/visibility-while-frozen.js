import { getLastWorldPosition } from "../utils/three-utils";

const isMobile = AFRAME.utils.device.isMobile();

function almostEqual(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) < 0.1;
}

/**
 * Toggles the visibility of this entity when the scene is frozen.
 * @namespace ui
 * @component visibility-while-frozen
 */
AFRAME.registerComponent("visibility-while-frozen", {
  schema: {
    withinDistance: { type: "number" },
    visible: { type: "boolean", default: true },
    requireHoverOnNonMobile: { type: "boolean", default: true },
    withPermission: { type: "string" }
  },

  init() {
    this.updateVisibility = this.updateVisibility.bind(this);
    this.camWorldPos = new THREE.Vector3();
    this.cam2WorldPos = new THREE.Vector3();
    this.objWorldPos = new THREE.Vector3();
    this.cam = document.getElementById("avatar-pov-node").object3D;
    this.cam2 = this.el.sceneEl.camera;

    let hoverableSearch = this.el;

    while (hoverableSearch !== document) {
      if (hoverableSearch.getAttribute("is-remote-hover-target") !== null) {
        this.hoverable = hoverableSearch;
        break;
      }

      hoverableSearch = hoverableSearch.parentNode;
    }
    if (!this.hoverable && this.data.requireHoverOnNonMobile) {
      console.error("Didn't find a remote hover target.");
    }

    this.onStateChange = evt => {
      if (!evt.detail === "frozen") return;
      this.updateVisibility();
    };
    this.updateVisibility();
  },

  tick() {
    const isFrozen = this.el.sceneEl.is("frozen");
    const isVisible = this.el.object3D.visible;
    const shouldNotBeVisible = isFrozen === !this.data.visible;
    if (!isVisible && shouldNotBeVisible) return;

    this.updateVisibility();
  },

  updateVisibility() {
    const isFrozen = this.el.sceneEl.is("frozen");

    let isWithinDistance = true;
    const isVisible = this.el.object3D.visible;

    if (this.data.withinDistance) {
      if (!isVisible) {
        // Edge case, if the object is not visible force a matrix update
        // since the main matrix update loop will not do it.
        this.el.object3D.updateMatrices(true, true);
      }

      getLastWorldPosition(this.cam, this.camWorldPos);
      getLastWorldPosition(this.cam2, this.cam2WorldPos);
      const checkBoth = !almostEqual(this.camWorldPos, this.cam2WorldPos);
      this.objWorldPos.copy(this.el.object3D.position);
      this.el.object3D.localToWorld(this.objWorldPos);

      isWithinDistance =
        this.camWorldPos.distanceToSquared(this.objWorldPos) < this.data.withinDistance * this.data.withinDistance ||
        (checkBoth &&
          this.cam2WorldPos.distanceToSquared(this.objWorldPos) < this.data.withinDistance * this.data.withinDistance);
    }

    const isTransforming = this.el.sceneEl.systems["transform-selected-object"].transforming;

    const allowed = !this.data.withPermission || window.APP.hubChannel.canOrWillIfCreator(this.data.withPermission);

    let shouldBeVisible =
      allowed &&
      ((isFrozen && this.data.visible) || (!isFrozen && !this.data.visible)) &&
      isWithinDistance &&
      !isTransforming;

    if (this.data.requireHoverOnNonMobile && !isMobile) {
      shouldBeVisible =
        shouldBeVisible &&
        ((this.hoverable &&
          (this.el.sceneEl.systems.interaction.state.rightRemote.hovered === this.hoverable ||
            this.el.sceneEl.systems.interaction.state.leftRemote.hovered === this.hoverable)) ||
          isVisible);
    }

    if (isVisible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);

    if (this.hoverable) {
      this.hoverable.object3D.addEventListener("hovered", this.updateVisibility);
      this.hoverable.object3D.addEventListener("unhovered", this.updateVisibility);
    }
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);

    if (this.hoverable) {
      this.hoverable.object3D.addEventListener("hovered", this.updateVisibility);
      this.hoverable.object3D.addEventListener("unhovered", this.updateVisibility);
    }
  }
});

/**
 * Toggles the interactivity of a UI entity while the scene is frozen.
 * @namespace ui
 * @component ui-class-while-frozen
 */
AFRAME.registerComponent("ui-class-while-frozen", {
  init() {
    this.onStateChange = evt => {
      if (!evt.detail === "frozen") return;
      this.el.classList.toggle("ui", this.el.sceneEl.is("frozen"));
    };
    this.el.classList.toggle("ui", this.el.sceneEl.is("frozen"));
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
  }
});
