function PressedMove(el, button, onActivate) {
  this.down = button + "down";
  this.up = button + "up";
  this.pressed = false;
  this.onActivate = onActivate;
  this.el = el;
  this.onButtonDown = this.onButtonDown.bind(this);
  this.onButtonUp = this.onButtonUp.bind(this);
  this.onAxisMove = this.onAxisMove.bind(this);
  el.addEventListener(this.down, this.onButtonDown);
  el.addEventListener(this.up, this.onButtonUp);
  el.addEventListener("axismove", this.onAxisMove);
}

PressedMove.prototype = {
  onAxisMove: function(event) {
    if (this.pressed) {
      this.onActivate(event);
    }
  },
  onButtonDown: function(event) {
    this.pressed = true;
  },
  onButtonUp: function(event) {
    this.pressed = false;
  },

  removeListeners: function() {
    this.el.addEventListener(this.down, this.onButtonDown);
    this.el.addEventListener(this.up, this.onButtonUp);
    this.el.addEventListener("axismove", this.onAxisMove);
  }
};

export { PressedMove };
