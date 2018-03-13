AFRAME.registerComponent("networked-counter", {
  schema: {
    max: { default: 3 },
    ttl: { default: 120 },
    grab_event: { type: "string", default: "grab-start" },
    release_event: { type: "string", default: "grab-end" }
  },

  init: function() {
    this.count = 0;
    this.queue = {};
    this.timeouts = {};
  },

  register: function(networkedEl) {
    if (this.data.max <= 0) {
      return;
    }

    const id = NAF.utils.getNetworkId(networkedEl);
    if (this.queue.hasOwnProperty(id)) {
      return;
    }

    const now = Date.now();
    const onGrabHandler = this._onGrabbed.bind(this, id);
    const onReleaseHandler = this._onReleased.bind(this, id);
    this.queue[id] = {
      ts: now,
      el: networkedEl,
      onGrabHandler: onGrabHandler,
      onReleaseHandler: onReleaseHandler
    };

    networkedEl.addEventListener(this.data.grab_event, onGrabHandler);
    networkedEl.addEventListener(this.data.release_event, onReleaseHandler);

    this.count++;

    if (!this._isCurrentlyGrabbed(id)) {
      this._addTimeout(id);
    }

    this._destroyOldest();
  },

  deregister: function(networkedEl) {
    const id = NAF.utils.getNetworkId(networkedEl);
    if (this.queue.hasOwnProperty(id)) {
      const item = this.queue[id];
      networkedEl.removeEventListener(this.data.grab_event, item.onGrabHandler);
      networkedEl.removeEventListener(this.data.release_event, item.onReleaseHandler);

      delete this.queue[id];

      this._removeTimeout(id);
      delete this.timeouts[id];

      this.count--;
    }
  },

  _onGrabbed: function(id, e) {
    this._removeTimeout(id);
  },

  _onReleased: function(id, e) {
    this._removeTimeout(id);
    this._addTimeout(id);
    this.queue[id].ts = Date.now();
  },

  _destroyOldest: function() {
    if (this.count > this.data.max) {
      let oldest = null,
        ts = Number.MAX_VALUE;
      Object.keys(this.queue).forEach(function(id) {
        const expiration = this.queue[id].ts + this.data.ttl * 1000;
        if (this.queue[id].ts < ts && !this._isCurrentlyGrabbed(id)) {
          oldest = this.queue[id];
          ts = this.queue[id].ts;
        }
      }, this);
      if (ts > 0) {
        this.deregister(oldest.el);
        this._destroy(oldest.el);
      }
    }
  },

  _isCurrentlyGrabbed: function(id) {
    const networkedEl = this.queue[id].el;
    return networkedEl.is("grabbed");
  },

  _addTimeout: function(id) {
    const timeout = this.data.ttl * 1000;
    this.timeouts[id] = setTimeout(() => {
      const el = this.queue[id].el;
      this.deregister(el);
      this._destroy(el);
    }, timeout);
  },

  _removeTimeout: function(id) {
    if (this.timeouts.hasOwnProperty(id)) {
      clearTimeout(this.timeouts[id]);
    }
  },

  _destroy: function(networkedEl) {
    networkedEl.parentNode.removeChild(networkedEl);
  }
});
