const ACTIVATION_STATE = require("aframe-physics-system/src/constants").ACTIVATION_STATE;

/**
 * Manages ownership and haptics on an interatable
 * @namespace network
 * @component super-networked-interactable
 */
AFRAME.registerComponent("super-networked-interactable", {
  schema: {
    counter: { type: "selector" }
  },

  init: function() {
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

    this._onGrabStart = this._onGrabStart.bind(this);
    this._onGrabEnd = this._onGrabEnd.bind(this);
    this._onOwnershipLost = this._onOwnershipLost.bind(this);
    this._syncCounterRegistration = this._syncCounterRegistration.bind(this);
    this.el.addEventListener("grab-start", this._onGrabStart);
    this.el.addEventListener("grab-end", this._onGrabEnd);
    this.el.addEventListener("pinned", this._syncCounterRegistration);
    this.el.addEventListener("unpinned", this._syncCounterRegistration);
    this.el.addEventListener("ownership-lost", this._onOwnershipLost);
  },

  remove: function() {
    this.counter.deregister(this.el);
    this.el.removeEventListener("grab-start", this._onGrabStart);
    this.el.removeEventListener("grab-end", this._onGrabEnd);
    this.el.removeEventListener("ownership-lost", this._onOwnershipLost);
  },

  _onGrabStart: function(e) {
    if (!this.el.components.grabbable || this.el.components.grabbable.data.maxGrabbers === 0) return;

    this.hand = e.detail.hand;
    this.hand.emit("haptic_pulse", { intensity: "high" });
    if (this.networkedEl) {
      if (!NAF.utils.isMine(this.networkedEl)) {
        if (NAF.utils.takeOwnership(this.networkedEl)) {
          this.el.setAttribute("ammo-body", {
            type: "dynamic",
            activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
          });
          this._syncCounterRegistration();
        } else {
          this.el.emit("grab-end", { hand: this.hand });
          this.hand = null;
        }
      } else {
        this.el.setAttribute("ammo-body", {
          activationState: ACTIVATION_STATE.DISABLE_DEACTIVATION
        });
      }
    }
  },

  _onGrabEnd: function(e) {
    if (e.detail.hand) e.detail.hand.emit("haptic_pulse", { intensity: "high" });
    this.el.setAttribute("ammo-body", {
      activationState: ACTIVATION_STATE.ACTIVE_TAG
    });
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("ammo-body", { type: "kinematic" });
    this.el.emit("grab-end", { hand: this.hand });
    this.hand = null;
    this._syncCounterRegistration();
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
  }
});
