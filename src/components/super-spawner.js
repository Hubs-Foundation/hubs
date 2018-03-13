AFRAME.registerComponent("super-spawner", {
  schema: {
    template: { default: "" },
    spawn_position: { type: "vec3" }
  },

  init: function() {
    this.el.addEventListener("grab-start", e => {
      this._spawn(e.detail.hand);
    });
  },

  _spawn: function(hand) {
    const entity = document.createElement("a-entity");

    entity.setAttribute("networked", "template:" + this.data.template);

    const componentinitialized = new Promise((resolve, reject) => {
      entity.addEventListener("componentinitialized", e => {
        if (e.detail.name == "grabbable") {
          resolve();
        }
      });
    });

    const bodyloaded = new Promise((resolve, reject) => {
      entity.addEventListener("body-loaded", e => {
        resolve();
      });
    });

    Promise.all([componentinitialized, bodyloaded]).then(() => {
      hand.emit("action_grab", { targetEntity: entity });
      entity.emit("grab-start", { hand: hand });
    });

    entity.setAttribute("position", this.data.spawn_position || this.el.getAttribute("position"));
    this.el.sceneEl.appendChild(entity);
  }
});
