const PI_2 = Math.PI / 2;
export default class PointerLookControls {
  constructor(lookControlsEl) {
    this.xSpeed = 0.005;
    this.ySpeed = 0.003;
    this.lookControlsEl = lookControlsEl;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.getLookControls = this.getLookControls.bind(this);
    this.removeEvent = this.removeEvent.bind(this);
    document.addEventListener("touch-used-by-cursor", this.onPointerUp);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    this.getLookControls();
    this.cache = [];
  }

  getLookControls() {
    this.lookControls = this.lookControlsEl.components["look-controls"];
    this.yawObject = this.lookControls.yawObject;
    this.pitchObject = this.lookControls.pitchObject;
  }

  start() {
    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);
    if (!this.lookControls) {
      this.getLookControls();
    }
  }

  stop() {
    document.removeEventListener("pointerdown", this.onPointerDown);
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointercancel", this.onPointerUp);
    this.cache = [];
  }

  onPointerDown(ev) {
    if (ev.isUsedByCursor || ev.clientY / window.innerHeight >= 0.8) {
      return;
    }
    this.cache.push(ev);
  }

  onPointerMove(ev) {
    const cache = this.cache;
    if (ev.isUsedByCursor || ev.clientY / window.innerHeight >= 0.8) {
      return;
    }

    let cachedEv = null;
    for (var i = 0; i < cache.length; i++) {
      if (ev.pointerId === cache[i].pointerId) {
        cachedEv = cache[i];
        cache[i] = ev;
        break;
      }
    }
    if (!cachedEv) {
      return;
    }

    const dX = ev.clientX - cachedEv.clientX;
    const dY = ev.clientY - cachedEv.clientY;

    this.yawObject.rotation.y -= dX * this.xSpeed;
    this.pitchObject.rotation.x -= dY * this.ySpeed;
    this.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, this.pitchObject.rotation.x));
  }

  onPointerUp(ev) {
    this.removeEvent(ev);
  }

  removeEvent(ev) {
    const cache = this.cache;
    for (let i = 0; i < cache.length; i++) {
      if (cache[i].pointerId == ev.pointerId) {
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
