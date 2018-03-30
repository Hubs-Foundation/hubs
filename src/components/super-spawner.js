AFRAME.registerComponent("super-spawner", {
  schema: {
    template: { default: "" },
    useCustomSpawnPosition: { default: false },
    spawnPosition: { type: "vec3" }
  },

  init: function() {
    this.entities = new Map();
  },

  play: function() {
    this.handleGrabStart = this._handleGrabStart.bind(this);
    this.el.addEventListener("grab-start", this.handleGrabStart);
  },

  pause: function() {
    this.el.removeEventListener("grab-start", this.handleGrabStart);
  },

  remove: function() {
    for (let entity of this.entities.keys()) {
      const data = this.entities.get(entity);
      entity.removeEventListener("componentinitialized", data.componentinInitializedListener);
      entity.removeEventListener("bodyloaded", data.bodyLoadedListener);
    }

    this.entities.clear();
  },

  _handleGrabStart: function(e) {
    const hand = e.detail.hand;
    const entity = document.createElement("a-entity");

    entity.setAttribute("networked", "template:" + this.data.template);

    const componentinInitializedListener = this._handleComponentInitialzed.bind(this, entity);
    const bodyLoadedListener = this._handleBodyLoaded.bind(this, entity);

    this.entities.set(entity, {
      hand: hand,
      componentInitialized: false,
      bodyLoaded: false,
      componentinInitializedListener: componentinInitializedListener,
      bodyLoadedListener: bodyLoadedListener
    });

    entity.addEventListener("componentinitialized", componentinInitializedListener);
    entity.addEventListener("body-loaded", bodyLoadedListener);

    const pos = this.data.useCustomSpawnPosition ? this.data.spawnPosition : this.el.getAttribute("position");
    entity.setAttribute("position", pos);
    this.el.sceneEl.appendChild(entity);
  },

  _handleComponentInitialzed: function(entity, e) {
    if (e.detail.name === "grabbable") {
      this.entities.get(entity).componentInitialized = true;
      this._emitEvents.call(this, entity);
    }
  },

  _handleBodyLoaded: function(entity, e) {
    this.entities.get(entity).bodyLoaded = true;
    this._emitEvents.call(this, entity);
  },

  _emitEvents: function(entity) {
    const data = this.entities.get(entity);
    if (data.componentInitialized && data.bodyLoaded) {
      data.hand.emit("action_grab", { targetEntity: entity });
      entity.emit("grab-start", { hand: data.hand });

      entity.removeEventListener("componentinitialized", data.componentinInitializedListener);
      entity.removeEventListener("body-loaded", data.bodyLoadedListener);

      this.entities.delete(entity);
    }
  }
});
