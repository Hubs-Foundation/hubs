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

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      this._syncCounterRegistration();
      if (!NAF.utils.isMine(networkedEl)) {
        this.el.setAttribute("ammo-body", { type: "kinematic", addCollideEventListener: true });
      } else {
        this.counter.register(networkedEl);
      }
    });

    this._onOwnershipLost = this._onOwnershipLost.bind(this);
    this._syncCounterRegistration = this._syncCounterRegistration.bind(this);
    this.el.addEventListener("pinned", this._syncCounterRegistration);
    this.el.addEventListener("unpinned", this._syncCounterRegistration);
    this.el.addEventListener("ownership-lost", this._onOwnershipLost);
    this.system.addComponent(this);
  },

  remove: function() {
    this.counter.deregister(this.el);
    this.el.removeEventListener("ownership-lost", this._onOwnershipLost);
    this.system.removeComponent(this);
  },

  onGrabStart: function(hand) {
    this.hand = hand;
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
  },

  onGrabEnd: function(hand) {
    if (hand) hand.emit("haptic_pulse", { intensity: "high" });
    this.el.body.forceActivationState(ACTIVATION_STATES.ACTIVE_TAG);
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("ammo-body", { type: "kinematic" });
    this.el.emit("grab-end", { hand: this.hand });
    this.hand = null;
    this._syncCounterRegistration();
  },

  _changeScale: function(delta) {
    if (delta) {
      this.el.object3D.updateMatrices();
      this.el.object3D.scale.addScalar(delta).clampScalar(this.data.minScale, this.data.maxScale);
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
    if (!(this.grabberId && pathsMap[this.grabberId])) return;

    const userinput = AFRAME.scenes[0].systems.userinput;
    this._changeScale(userinput.get(pathsMap[this.grabberId].scaleGrabbedGrabbable));
  }
});
