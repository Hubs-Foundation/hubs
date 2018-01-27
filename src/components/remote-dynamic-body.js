AFRAME.registerComponent("remote-dynamic-body", {
  schema: {
    mass: { default: 1 },
    counter: { type: "selector" }
  },

  init: function() {
    this.counter = this.data.counter.components["networked-counter"];
    this.timer = 0;

    this.networkedEl = NAF.utils.getNetworkedEntity(this.el);

    if (!this._isMine()) {
      this.networkedEl.setAttribute("dynamic-body", "mass: 0;");
      this.networkedEl.setAttribute("grabbable", "");
      this.networkedEl.setAttribute("stretchable", "");
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
      this.networkedEl.components["dynamic-body"].updateMass(0);
      this.networkedEl.components["grabbable"].resetGrabber();
      this.counter.deregister(this.networkedEl);
      this.timer = 0;
    }
  },

  _onGrabStart: function(e) {
    if (!this._isMine()) {
      if (this.networkedEl.components.networked.takeOwnership()) {
        this.networkedEl.components["dynamic-body"].updateMass(this.data.mass);
        this.wasMine = true;
        this.counter.register(this.networkedEl);
      }
    }
  },

  _isMine: function() {
    return this.networkedEl.components.networked.isMine();
  }
});
