import { paths } from "../systems/userinput/paths";
const ACTIVATION_STATES = require("aframe-physics-system/src/constants").ACTIVATION_STATES;

const pathsMap = {
  "player-right-controller": {
    scaleGrabbedGrabbable: paths.actions.rightHand.scaleGrabbedGrabbable
  },
  "player-left-controller": {
    scaleGrabbedGrabbable: paths.actions.leftHand.scaleGrabbedGrabbable
  },
  cursor: {
    scaleGrabbedGrabbable: paths.actions.cursor.scaleGrabbedGrabbable
  }
};

/**
 * Manages ownership and haptics on an interatable
 * @namespace network
 * @component super-networked-interactable
 */
AFRAME.registerComponent("super-networked-interactable", {
  schema: {
    hapticsMassVelocityFactor: { default: 0.1 },
    counter: { type: "selector" },
    scrollScaleDelta: { default: 0.1 },
    minScale: { default: 0.1 },
    maxScale: { default: 100 }
  },

  init: function() {
    this.system = this.el.sceneEl.systems.physics;
    this.counter = this.data.counter.components["networked-counter"];
    this.hand = null;
    this.currentScale = new THREE.Vector3();
    this.currentScale.copy(this.el.getAttribute("scale"));

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      this._syncCounterRegistration();
      if (!NAF.utils.isMine(networkedEl)) {
        this.el.setAttribute("ammo-body", { type: "kinematic", addCollideEventListener: true });
      } else {
        this.counter.register(networkedEl);
      }
    });

    this._onGrabStart = this._onGrabStart.bind(this);
    this._onGrabEnd = this._onGrabEnd.bind(this);
    this._onOwnershipLost = this._onOwnershipLost.bind(this);
    this._syncCounterRegistration = this._syncCounterRegistration.bind(this);
    this.el.addEventListener("grab-start", this._onGrabStart);
    this.el.addEventListener("grab-end", this._onGrabEnd);
    this.el.addEventListener("pinned", this._syncCounterRegistration);
    this.el.addEventListener("unpinned", this._syncCounterRegistration);
    this.el.addEventListener("ownership-lost", this._onOwnershipLost);
    this.system.addComponent(this);
  },

  remove: function() {
    this.counter.deregister(this.el);
    this.el.removeEventListener("grab-start", this._onGrabStart);
    this.el.removeEventListener("grab-end", this._onGrabEnd);
    this.el.removeEventListener("ownership-lost", this._onOwnershipLost);
    this.system.removeComponent(this);
  },

  _onGrabStart: function(e) {
    if (!this.el.components.grabbable || this.el.components.grabbable.data.maxGrabbers === 0) return;

    this.hand = e.detail.hand;
    this.hand.emit("haptic_pulse", { intensity: "high" });
    if (this.networkedEl) {
      if (!NAF.utils.isMine(this.networkedEl)) {
        if (NAF.utils.takeOwnership(this.networkedEl)) {
          this.el.setAttribute("ammo-body", { type: "dynamic" });
          this.el.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
          this._syncCounterRegistration();
        } else {
          this.el.emit("grab-end", { hand: this.hand });
          this.hand = null;
        }
      } else {
        this.el.body.forceActivationState(ACTIVATION_STATES.DISABLE_DEACTIVATION);
      }
    }
    this.currentScale.copy(this.el.getAttribute("scale"));
  },

  _onGrabEnd: function(e) {
    if (e.detail.hand) e.detail.hand.emit("haptic_pulse", { intensity: "high" });
    this.el.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("ammo-body", { type: "kinematic" });
    this.el.emit("grab-end", { hand: this.hand });
    this.hand = null;
    this._syncCounterRegistration();
  },

  _changeScale: function(delta) {
    if (delta && this.el.is("grabbed") && this.el.components.hasOwnProperty("stretchable")) {
      this.currentScale.addScalar(delta).clampScalar(this.data.minScale, this.data.maxScale);
      this.el.setAttribute("scale", this.currentScale);
      this.el.object3D.matrixNeedsUpdate = true;
    }
  },

  _syncCounterRegistration: function() {
    const el = this.networkedEl;
    if (!el || !el.components["networked"]) return;

    const isPinned = el.components["pinnable"] && el.components["pinnable"].data.pinned;

    if (NAF.utils.isMine(el) && !isPinned) {
      this.counter.register(el);
    } else {
      this.counter.deregister(el);
    }
  },

  tick: function() {
    const grabber = this.el.components.grabbable.grabbers[0];
    if (!(grabber && pathsMap[grabber.id])) return;

    const userinput = AFRAME.scenes[0].systems.userinput;
    this._changeScale(userinput.get(pathsMap[grabber.id].scaleGrabbedGrabbable));
  }
});
