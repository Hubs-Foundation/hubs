/**
 * Logs all events dispatched on an entity
 * @namespace debug
 * @component log-events
 */
AFRAME.registerComponent("log-events", {
  init: function() {
    const el = this.el;
    const log = this.log.bind(this);
    const origDispatch = this.el.dispatchEvent;
    this.el.dispatchEvent = function() {
      log(Array.from(arguments));
      return origDispatch.apply(el, arguments);
    };
  },
  log: function([e]) {
    if (["componentchanged"].includes(e.type)) return;
    let firstObject = true;
    const replacer = (k, x) => {
      if (!x) return x;
      if (typeof x === "object" && x.length === undefined) {
        if (firstObject) {
          firstObject = false;
          return x;
        }
        return "[object]";
      }
      return x;
    };
    console.info(`log-events: ${this.el.id} ${e.type} ${JSON.stringify(e.detail, replacer)}`);
  }
});

/**
 * Logs all life cycle phases on an entity.
 * @namespace debug
 * @component lifecycle-checker
 */
AFRAME.registerComponent("lifecycle-checker", {
  schema: {
    name: { type: "string" },
    tick: { default: false }
  },
  init: function() {
    this.log("init");
  },
  update: function() {
    this.log("update");
  },
  tick: function() {
    if (this.data.tick) {
      this.log("tick");
    }
  },
  remove: function() {
    this.log("remove");
  },
  pause: function() {
    this.log("pause");
  },
  play: function() {
    this.log("play");
  },

  log: function(method) {
    console.info(`lifecycle-checker:${this.data.name} ${method}`);
  }
});
