AFRAME.registerComponent("remote-dynamic-body", {
  schema: {
    mass: { default: 1 },
    counter: { type: "selector" },
    grabbable: {type: "boolean", default: true},
    stretchable: {type: "boolean", default: true}
  },

  init: function() {
    this.counter = this.data.counter.components["networked-counter"];
    this.timer = 0;
    this.hand = null;

    this.networkedEl = NAF.utils.getNetworkedEntity(this.el);
    this.networked = this.networkedEl.components.networked;

    if (!this._isMine()) {
      this.networkedEl.setAttribute("body", "type: dynamic; mass: 0");
      if (this.data.grabbable)
        this.networkedEl.setAttribute("grabbable", "");
      if (this.data.stretchable)
        this.networkedEl.setAttribute("stretchable", "");
      this.el.setAttribute("color", "white")
    } else {
      this.counter.register(this.networkedEl);
      this.timer = Date.now();
    }

    this.wasMine = this._isMine();

    this.networkedEl.addEventListener("grab-start", e => {
      this._onGrabStart(e);
    });
  },

  tick: function(t) {
    if (this.wasMine && !this._isMine()) {
      this.wasMine = false;
      this.networkedEl.setAttribute("body", "mass: 0");
      this.networkedEl.emit("grab-end", {hand: this.hand})
      this.hand = null;
      this.counter.deregister(this.networkedEl);
      this.timer = 0;
      this.el.setAttribute("color", "white")
    }
  },

  _onGrabStart: function(e) {
    this.hand = e.detail.hand;
    if (!this._isMine()) {
      if (this.networked.takeOwnership()) {
        this.networkedEl.setAttribute("body", `mass: ${this.data.mass};`);
        this.wasMine = true;
        this.counter.register(this.networkedEl);
        this.el.setAttribute("color", "green")
      } else {
        this.networkedEl.emit("grab-end", {hand: this.hand})
        this.hand = null;
        this.el.setAttribute("color", "red")
      }
    }
  },

  _isMine: function() {
    return this.networked.isMine();
  }
});
