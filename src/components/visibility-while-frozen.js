import { getLastWorldPosition } from "../utils/three-utils";

/**
 * Toggles the visibility of this entity when the scene is frozen.
 * @namespace ui
 * @component visibility-while-frozen
 */
AFRAME.registerComponent("visibility-while-frozen", {
  schema: {
    withinDistance: { type: "number" },
    visible: { type: "boolean", default: true }
  },

  init() {
    this.updateVisibility = this.updateVisibility.bind(this);
    this.camWorldPos = new THREE.Vector3();
    this.objWorldPos = new THREE.Vector3();
    this.cam = this.el.sceneEl.camera.el.object3D;
    this.onStateChange = evt => {
      if (!evt.detail === "frozen") return;
      this.updateVisibility();
    };
    this.updateVisibility();
  },

  tick() {
    if (!this.data.withinDistance) return;

    const isFrozen = this.el.sceneEl.is("frozen");
    const isVisible = this.el.getAttribute("visible");
    if (!isFrozen && !isVisible) return;

    this.updateVisibility();
  },

  updateVisibility() {
    const isFrozen = this.el.sceneEl.is("frozen");

    let isWithinDistance = true;
    const isVisible = this.el.object3D.visible;

    if (this.data.withinDistance !== undefined) {
      if (!isVisible) {
        // Edge case, if the object is not visible force a matrix update
        // since the main matrix update loop will not do it.
        this.el.object3D.updateMatrices(true, true);
      }

      getLastWorldPosition(this.cam, this.camWorldPos);
      this.objWorldPos.copy(this.el.object3D.position);
      this.el.object3D.localToWorld(this.objWorldPos);

      isWithinDistance =
        this.camWorldPos.distanceToSquared(this.objWorldPos) < this.data.withinDistance * this.data.withinDistance;
    }

    const isRotating = AFRAME.scenes[0].systems["rotate-selected-object"].rotating;
    const shouldBeVisible =
      ((isFrozen && this.data.visible) || (!isFrozen && !this.data.visible)) && isWithinDistance && !isRotating;

    if (isVisible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
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
