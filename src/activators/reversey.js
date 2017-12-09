function ReverseY(el, button, onActivate) {
  this.el = el;
  this.emitReverseY = this.emitReverseY.bind(this);
  this.onActivate = onActivate;
  this.button = button;
  this.removeListeners = this.removeListeners.bind(this);
  el.addEventListener(button, this.emitReverseY);
}

ReverseY.prototype = {
  emitReverseY: function(event) {
    event.detail.axis[1] *= -1;
    this.onActivate(event);
  },
  removeListeners: function() {
    this.el.removeEventListener(this.button, this.emitReverseY);
  }
};

export { ReverseY };
