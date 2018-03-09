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

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      if (!NAF.utils.isMine(networkedEl)) {
        this.el.setAttribute("body", "type: dynamic; mass: 0");
        this.el.setAttribute("material", "color: white")
      } else {
        this.el.setAttribute("body", `type: dynamic; mass: ${this.data.mass};`);
        this.counter.register(networkedEl);
        this.timer = Date.now();
      }

      if (this.data.grabbable)
        this.el.setAttribute("grabbable", "")

      if (this.data.stretchable)
        this.el.setAttribute("stretchable", "")
    });

    this.el.addEventListener("grab-start", e => {
      this._onGrabStart(e);
    });

    this.el.addEventListener("ownership-lost", e => {
      this.el.setAttribute("body", "mass: 0");
      this.el.emit("grab-end", {hand: this.hand});
      this.hand = null;
      this.counter.deregister(this.el);
      this.timer = 0;
      this.el.setAttribute("material", "color: white")
    });
  },

  _onGrabStart: function(e) {
    this.hand = e.detail.hand;
    if (this.networkedEl && !NAF.utils.isMine(this.networkedEl)) {
      if (NAF.utils.takeOwnership(this.networkedEl)) {
        this.el.setAttribute("body", `mass: ${this.data.mass};`);
        this.counter.register(this.networkedEl);
        this.el.setAttribute("material", "color: green")
      } else {
        this.el.emit("grab-end", {hand: this.hand});
        this.hand = null;
        this.el.setAttribute("material", "color: red")
      }
    }
  }
});
