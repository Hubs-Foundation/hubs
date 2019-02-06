const pending = [];
AFRAME.registerSystem("nextframe", {
  init() {
    const render = this.el.render;
    const el = this.el;
    this.el.render = function(time, frame) {
      render.call(el, time, frame);
      for (let i = 0; i < pending.length; i++) {
        pending[i]();
      }
      pending.length = 0;
    };
  },

  nextFrame() {
    return new Promise(resolve => {
      pending.push(resolve);
    });
  }
});
