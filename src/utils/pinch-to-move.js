export default class PinchToMove {
  constructor(el) {
    this.speed = 0.35;
    this.el = el;
    this.onPinch = this.onPinch.bind(this);
    this.onSpread = this.onSpread.bind(this);
    this.decay = this.decay.bind(this);
    document.addEventListener("pinch", this.onPinch);
    document.addEventListener("spread", this.onSpread);

    this.interval = null;
    this.decayingSpeed = 0;
    this.dir = 1;
  }

  decay() {
    if (Math.abs(this.decayingSpeed) < 0.01) {
      window.clearInterval(this.interval);
      this.interval = null;
    }

    this.el.emit("move", { axis: [0, this.dir * this.decayingSpeed] });
    this.decayingSpeed *= 0.95;
  }

  onPinch(e) {
    const dist = e.detail.distance * this.speed;
    this.decayingSpeed = dist;
    this.dir = -1;
    this.el.emit("move", { axis: [0, this.dir * dist] });

    //    if (!this.interval) {
    //      this.interval = window.setInterval(this.decay, 20);
    //    }
  }

  onSpread(e) {
    const dist = e.detail.distance * this.speed;
    this.decayingSpeed = dist;
    this.dir = 1;
    this.el.emit("move", { axis: [0, this.dir * dist] });

    //   if (!this.interval) {
    //     this.interval = window.setInterval(this.decay, 20);
    //   }
  }
}
