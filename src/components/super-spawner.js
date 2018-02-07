AFRAME.registerComponent("super-spawner", {
  schema: {
    template: { type: "string" },
    mass: {type: "number", default: 1},
    grabbable: {type: "boolean", default: true},
    stretchable: {type: "boolean", default: true},
    spawn_position: {type: "vec3"}
  },

  init: function() {
    this.el.setAttribute("dynamic-body", "mass: 0;");

    this.el.addEventListener("grab-start", e => {
      this._onGrabStart(e);
    });
  },

  _spawn: function(hand) {
    const sceneEl = document.querySelector("a-scene");
    const entity = document.createElement("a-entity");

    entity.setAttribute("dynamic-body", `mass: ${this.data.mass};`);

    if (this.data.grabbable) {
      entity.setAttribute("grabbable", "");
      entity.addEventListener("body-loaded", function(e) {
        hand.emit("action_grab", {targetEntity: entity});
        entity.emit('grab-start', {hand: hand});
      });
    }

    if (this.data.stretchable)
      entity.setAttribute("stretchable", "");

    entity.setAttribute("position", this.data.spawn_position || this.el.getAttribute("position"));
    entity.setAttribute("networked", `template: ${this.data.template};`);
    sceneEl.appendChild(entity);
  },

  _onGrabStart: function(e) {
    this._spawn(e.detail.hand);
  }
});
