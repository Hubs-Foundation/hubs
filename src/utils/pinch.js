export default class Pinch {
  constructor(el) {
    this.el = el;
    this.prevDiff = -1;
    this.touchCache = [];
    this.usedTouch = { identifier: -1 };

    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.removeTouch = this.removeTouch.bind(this);
    this.addTouch = this.addTouch.bind(this);

    document.addEventListener("touchmove", this.onTouchMove);
    document.addEventListener("touchstart", this.onTouchStart);
    document.addEventListener("touchend", this.onTouchEnd);
    document.addEventListener("touchcancel", this.onTouchEnd);
    document.addEventListener("touch-used-by-cursor", ev => {
      const touch = ev.detail;
      this.removeTouch(touch);
      this.usedTouch = touch;
    });
  }

  onTouchEnd = ev => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const touch = ev.changedTouches[i];
      if (touch.identifier === this.usedTouch.identifier) {
        this.usedTouch = { identifier: -1 };
      }
      this.removeTouch(touch);
    }
  };

  onTouchStart = ev => {
    for (let i = 0; i < ev.touches.length; i++) {
      const touch = ev.touches[i];
      if (touch.identifier === this.usedTouch.identifier || touch.clientY / window.innerHeight >= 0.8) {
        continue;
      }
      this.addTouch(touch);
    }
  };

  onTouchMove = ev => {
    const cache = this.touchCache;
    for (let i = 0; i < ev.touches.length; i++) {
      const touch = ev.touches[i];
      if (touch.identifier !== this.usedTouch.identifier) {
        this.updateTouch(touch);
      }
    }

    if (cache.length !== 2) {
      this.prevDiff = -1;
      return;
    }
    if (window.LookControlsToggle) {
      window.LookControlsToggle.toggle(false, this);
    }

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

  removeTouch = touch => {
    for (let i = 0; i < this.touchCache.length; i++) {
      if (this.touchCache[i].identifier === touch.identifier) {
        this.touchCache.splice(i, 1);
        break;
      }
    }
    if (this.touchCache.length < 2) {
      if (window.LookControlsToggle) {
        window.LookControlsToggle.toggle(true, this);
      }
      this.prevDiff = -1;
    }
  };

  addTouch = touch => {
    for (let i = 0; i < this.touchCache.length; i++) {
      if (this.touchCache[i].identifier === touch.identifier) {
        return;
      }
    }

    this.touchCache.push(touch);
  };

  updateTouch = touch => {
    for (let i = 0; i < this.touchCache.length; i++) {
      if (this.touchCache[i].identifier === touch.identifier) {
        this.touchCache[i] = touch;
        return;
      }
    }
  };

  static distance = (x1, y1, x2, y2) => {
    const x = x1 - x2;
    const y = y1 - y2;
    return Math.sqrt(x * x + y * y);
  };
}
