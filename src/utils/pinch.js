export default class Pinch {
  constructor(el) {
    this.el = el;
    this.prevDiff = -1;
    this.evCache = [];

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.removeEvent = this.removeEvent.bind(this);

    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);
    document.addEventListener("touch-used-by-cursor", this.onPointerUp);
  }

  onPointerUp = ev => {
    this.removeEvent(ev);
    if (this.evCache.length < 2) {
      window.LookControlsToggle.toggle(true, this);
      this.prevDiff = -1;
    }
  };

  onPointerDown = ev => {
    if (ev.isUsedByCursor || ev.clientY / window.innerHeight >= 0.8) {
      return;
    }
    this.evCache.push(ev);
  };

  onPointerMove = ev => {
    const cache = this.evCache;

    for (var i = 0; i < cache.length; i++) {
      if (ev.pointerId === cache[i].pointerId) {
        cache[i] = ev;
        break;
      }
    }

    if (cache.length !== 2) {
      return;
    }
    window.LookControlsToggle.toggle(false, this);

    const diff = Pinch.distance(cache[0].clientX, cache[0].clientY, cache[1].clientX, cache[1].clientY);

    if (this.prevDiff > 0) {
      if (diff > this.prevDiff) {
        this.el.emit("spread", { distance: diff - this.prevDiff });
      } else if (diff < this.prevDiff) {
        this.el.emit("pinch", { distance: this.prevDiff - diff });
      }
    }

    this.prevDiff = diff;
  };

  removeEvent = ev => {
    for (let i = 0; i < this.evCache.length; i++) {
      if (this.evCache[i].pointerId == ev.pointerId) {
        this.evCache.splice(i, 1);
        break;
      }
    }
  };

  static distance = (x1, y1, x2, y2) => {
    const x = x1 - x2;
    const y = y1 - y2;
    return Math.sqrt(x * x + y * y);
  };
}
