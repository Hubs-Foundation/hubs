/**
 * Manages ownership and haptics on an interatable
 * @namespace network
 * @component super-networked-interactable
 */
AFRAME.registerComponent("super-networked-interactable", {
  schema: {
    hapticsMassVelocityFactor: { default: 0.1 },
    counter: { type: "selector" }
  },

  init: function() {
    this.system = this.el.sceneEl.systems.physics;
    this.counter = this.data.counter.components["networked-counter"];
    this.hand = null;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      if (!NAF.utils.isMine(networkedEl)) {
        this.el.setAttribute("body", { type: "static" });
      } else {
        this.counter.register(networkedEl);
      }
    });

    this._onGrabStart = this._onGrabStart.bind(this);
    this._onGrabEnd = this._onGrabEnd.bind(this);
    this._onOwnershipLost = this._onOwnershipLost.bind(this);
    this.el.addEventListener("grab-start", this._onGrabStart);
    this.el.addEventListener("grab-end", this._onGrabEnd);
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
    this.hand = e.detail.hand;
    this.hand.emit("haptic_pulse", { intensity: "high" });
    if (this.networkedEl && !NAF.utils.isMine(this.networkedEl)) {
      if (NAF.utils.takeOwnership(this.networkedEl)) {
        this.el.setAttribute("body", { type: "dynamic" });
        this.counter.register(this.networkedEl);
      } else {
        this.el.emit("grab-end", { hand: this.hand });
        this.hand = null;
      }
    }
  },

  _onGrabEnd: function(e) {
    e.detail.hand.emit("haptic_pulse", { intensity: "high" });
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("body", { type: "static" });
    this.el.emit("grab-end", { hand: this.hand });
    this.hand = null;
    this.counter.deregister(this.el);
  }
});
