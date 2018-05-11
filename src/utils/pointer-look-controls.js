const PI_4 = Math.PI / 4;
export default class PointerLookControls {
  constructor(lookControlsEl) {
    this.xSpeed = 0.005;
    this.ySpeed = 0.003;
    this.lookControlsEl = lookControlsEl;
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.getLookControls = this.getLookControls.bind(this);
    this.removeTouch = this.removeTouch.bind(this);
    this.onRotateX = this.onRotateX.bind(this);
    this.usedTouch = { identifier: -1 };
    document.addEventListener("touch-used-by-cursor", ev => {
      const touch = ev.detail;
      this.removeTouch(touch);
      this.usedTouch = touch;
    });

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    this.getLookControls();
    this.cache = [];

    document.addEventListener("touchstart", this.onTouchStart);
    document.addEventListener("touchmove", this.onTouchMove);
    document.addEventListener("touchend", this.onTouchEnd);
    document.addEventListener("touchcancel", this.onTouchEnd);
    AFRAME.scenes[0].sceneEl.addEventListener("rotateX", this.onRotateX);
  }

  onRotateX(e) {
    const dY = e.detail.value;
    this.pitchObject.rotation.x += dY * 0.02;
    this.pitchObject.rotation.x = Math.max(-PI_4, Math.min(PI_4, this.pitchObject.rotation.x));
  }

  getLookControls() {
    this.lookControls = this.lookControlsEl.components["look-controls"];
    this.yawObject = this.lookControls.yawObject;
    this.pitchObject = this.lookControls.pitchObject;
  }

  start() {
    if (!this.lookControls) {
      this.getLookControls();
    }
    this.enabled = true;
  }

  stop() {
    this.enabled = false;
  }

  onTouchStart(ev) {
    for (let i = 0; i < ev.touches.length; i++) {
      const touch = ev.touches[i];
      if (touch.identifier === this.usedTouch.identifier || touch.clientY / window.innerHeight >= 0.8) {
        continue;
      }
    }
  }

  onTouchMove(ev) {
    const cache = this.cache;
    for (let i = 0; i < ev.touches.length; i++) {
      const touch = ev.touches[i];

      if (touch.identifier === this.usedTouch.identifier || touch.clientY / window.innerHeight >= 0.8) {
        continue;
      }

      let cachedTouch = null;
      for (let j = 0; j < cache.length; j++) {
        if (touch.identifier === cache[j].identifier) {
          cachedTouch = cache[j];
          cache[j] = touch;
          break;
        }
      }
      if (!cachedTouch) {
        this.cache.push(touch);
        continue;
      }

      if (!this.enabled) {
        continue;
      }
      const dX = touch.clientX - cachedTouch.clientX;
      const dY = touch.clientY - cachedTouch.clientY;

      this.yawObject.rotation.y -= dX * this.xSpeed;
      this.pitchObject.rotation.x -= dY * this.ySpeed;
      this.pitchObject.rotation.x = Math.max(-PI_4, Math.min(PI_4, this.pitchObject.rotation.x));
    }
  }

  onTouchEnd(ev) {
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const touch = ev.changedTouches[i];
      this.removeTouch(touch);
      if (touch.identifier === this.usedTouch.identifier) {
        this.usedTouch = { identifier: -1 };
      }
    }
  }

  removeTouch(touch) {
    const cache = this.cache;
    for (let i = 0; i < cache.length; i++) {
      if (cache[i].identifier == touch.identifier) {
        cache.splice(i, 1);
        break;
      }
    }
  }

  static distance = (x1, y1, x2, y2) => {
    const x = x1 - x2;
    const y = y1 - y2;
    return Math.sqrt(x * x + y * y);
  };
}
