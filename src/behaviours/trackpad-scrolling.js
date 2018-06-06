function trackpad_scrolling(el) {
  this.el = el;
  this.start = "trackpadtouchstart";
  this.move = "axismove";
  this.end = "trackpadtouchend";
  this.isScrolling = false;
  this.x = 0;
  this.y = 0;
  this.axis = [0, 0];
  this.emittedEventDetail = { detail: { axis: this.axis } };

  this.onStart = this.onStart.bind(this);
  this.onMove = this.onMove.bind(this);
  this.onEnd = this.onEnd.bind(this);
}

trackpad_scrolling.prototype = {
  addEventListeners: function() {
    this.el.addEventListener(this.start, this.onStart);
    this.el.addEventListener(this.move, this.onMove);
    this.el.addEventListener(this.end, this.onEnd);
  },
  removeEventListeners: function() {
    this.el.removeEventListener(this.start, this.onStart);
    this.el.removeEventListener(this.move, this.onMove);
    this.el.removeEventListener(this.end, this.onEnd);
  },
  onStart: function(e) {
    this.x = e.detail.axis[0];
    this.y = e.detail.axis[1];
    this.isScrolling = true;
  },

  onMove: function(e) {
    if (!this.isScrolling) return;
    const x = e.detail.axis[0];
    const y = e.detail.axis[1];

    this.axis[0] = x - this.x;
    this.axis[1] = y - this.y;
    this.emittedEventDetail.axis = this.axis;
    e.target.emit("scroll", this.emittedEventDetail);
    this.x = x;
    this.y = y;
  },

  onEnd: function(e) {
    this.isScrolling = false;
  }
};

export default trackpad_scrolling;
