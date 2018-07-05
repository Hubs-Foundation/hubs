/**
 * Limits networked interactables to a maximum number at any given time
 * @namespace network
 * @component networked-counter
 */
AFRAME.registerComponent("networked-counter", {
  schema: {
    max: { default: 3 },
    ttl: { default: 0 },
    grab_event: { type: "string", default: "grab-start" },
    release_event: { type: "string", default: "grab-end" }
  },

  init() {
    this.registeredEls = new Map();
  },

  remove() {
    this.registeredEls.forEach(({ onGrabHandler, onReleaseHandler, timeout }, el) => {
      el.removeEventListener(this.data.grab_event, onGrabHandler);
      el.removeEventListener(this.data.release_event, onReleaseHandler);
      clearTimeout(timeout);
    });
    this.registeredEls.clear();
  },

  register(el) {
    if (this.data.max <= 0 || this.registeredEls.has(el)) return;

    const grabEventListener = this._onGrabbed.bind(this, el);
    const releaseEventListener = this._onReleased.bind(this, el);

    this.registeredEls.set(el, {
      ts: Date.now(),
      onGrabHandler: grabEventListener,
      onReleaseHandler: releaseEventListener
    });

    el.addEventListener(this.data.grab_event, grabEventListener);
    el.addEventListener(this.data.release_event, releaseEventListener);

    if (!el.is("grabbed")) {
      this._startTimer(el);
    }

    this._destroyOldest();
  },

  deregister(el) {
    if (this.registeredEls.has(el)) {
      const { onGrabHandler, onReleaseHandler, timeout } = this.registeredEls.get(el);
      el.removeEventListener(this.data.grab_event, onGrabHandler);
      el.removeEventListener(this.data.release_event, onReleaseHandler);
      clearTimeout(timeout);
      this.registeredEls.delete(el);
    }
  },

  _onGrabbed(el) {
    clearTimeout(this.registeredEls.get(el).timeout);
  },

  _onReleased(el) {
    this._startTimer(el);
    this.registeredEls.get(el).ts = Date.now();
  },

  _destroyOldest() {
    if (this.registeredEls.size > this.data.max) {
      let oldestEl = null,
        minTs = Number.MAX_VALUE;
      this.registeredEls.forEach(({ ts }, el) => {
        if (ts < minTs && !el.is("grabbed")) {
          oldestEl = el;
          minTs = ts;
        }
      });
      this._destroy(oldestEl);
    }
  },

  _startTimer(el) {
    if (!this.data.ttl) return;
    clearTimeout(this.registeredEls.get(el).timeout);
    this.registeredEls.get(el).timeout = setTimeout(() => {
      this._destroy(el);
    }, this.data.ttl * 1000);
  },

  _destroy(el) {
    // networked-interactable's remvoe will also call deregister, but it will happen async so we do it here as well.
    this.deregister(el);
    el.parentNode.removeChild(el);
  }
});
