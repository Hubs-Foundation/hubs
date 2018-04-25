AFRAME.registerComponent("super-networked-interactable", {
  schema: {
    mass: { default: 1 },
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
        this.el.setAttribute("body", { type: "dynamic", mass: 0 });
      } else {
        this.counter.register(networkedEl);
      }
    });

    this.grabStartListener = this._onGrabStart.bind(this);
    this.ownershipLostListener = this._onOwnershipLost.bind(this);
    this.el.addEventListener("grab-start", this.grabStartListener);
    this.el.addEventListener("ownership-lost", this.ownershipLostListener);
    this.system.addComponent(this);
  },

  remove: function() {
    this.counter.deregister(this.el);
    this.el.removeEventListener("grab-start", this.grabStartListener);
    this.el.removeEventListener("ownership-lost", this.ownershipLostListener);
    this.system.removeComponent(this);
  },

  afterStep: function() {
    if (this.el.is("grabbed") && this.hand && this.hand.components.hasOwnProperty("haptic-feedback")) {
      const hapticFeedback = this.hand.components["haptic-feedback"];
      let velocity = this.el.body.velocity.lengthSquared() * this.el.body.mass * this.data.hapticsMassVelocityFactor;
      velocity = Math.min(1, velocity);
      hapticFeedback.pulse(velocity);
    }
  },

  _onGrabStart: function(e) {
    this.hand = e.detail.hand;
    if (this.networkedEl && !NAF.utils.isMine(this.networkedEl)) {
      if (NAF.utils.takeOwnership(this.networkedEl)) {
        this.el.setAttribute("body", { mass: this.data.mass });
        this.counter.register(this.networkedEl);
      } else {
        this.el.emit("grab-end", { hand: this.hand });
        this.hand = null;
      }
    }
  },

  _onOwnershipLost: function() {
    this.el.setAttribute("body", { mass: 0 });
    this.el.emit("grab-end", { hand: this.hand });
    this.hand = null;
    this.counter.deregister(this.el);
  }
});
