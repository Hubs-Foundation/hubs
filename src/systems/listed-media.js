AFRAME.registerSystem("listed-media", {
  init: function () {
    this.els = [];
  },

  register: function (el) {
    this.els.push(el);
    this.el.emit("listed_media_changed");
  },

  unregister: function (el) {
    this.els.splice(this.els.indexOf(el), 1);
    this.el.emit("listed_media_changed");
  }
});

AFRAME.registerComponent("listed-media", {
  init: function () {
    this.system.register(this.el);
  },

  remove: function () {
    this.system.unregister(this.el);
  }
});
