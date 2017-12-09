function ShortPress(el, button, onActivate) {
  this.lastTime = 0;
  this.timeOut = 500;
  this.eventNameDown = button + "down";
  this.eventNameUp = button + "up";

  this.el = el;
  this.onActivate = onActivate;

  this.onButtonDown = this.onButtonDown.bind(this);
  this.onButtonUp = this.onButtonUp.bind(this);

  el.addEventListener(this.eventNameDown, this.onButtonDown);
  el.addEventListener(this.eventNameUp, this.onButtonUp);
}

ShortPress.prototype = {
  onButtonDown(event) {
    var self = this;
    this.pressTimer = window.setTimeout(function() {
      self.onActivate(event);
    }, this.timeOut);
  },

  onButtonUp(event) {
    clearTimeout(this.pressTimer);
  },

  removeListeners() {
    this.el.removeEventListener(this.eventNameDown, this.onButtonDown);
    this.el.removeEventListener(this.eventNameUp, this.onButtonUp);
  }
};

AFRAME.registerInputActivator("shortpress", ShortPress);
