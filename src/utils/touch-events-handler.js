const VIRTUAL_JOYSTICK_HEIGHT = 0.8;
const HORIZONTAL_LOOK_SPEED = 0.006;
const VERTICAL_LOOK_SPEED = 0.003;
const PI_4 = Math.PI / 4;

export default class TouchEventsHandler {
  constructor() {
    this.cursor = null;
    this.lookControls = null;
    this.pinchEmitter = null;
    this.touches = [];
    this.touchReservedForCursor = null;
    this.touchesReservedForPinch = [];
    this.touchReservedForLookControls = null;
    this.needsPinch = false;
    this.pinchTouchId1 = -1;
    this.pinchTouchId2 = -1;

    this.registerCursor = this.registerCursor.bind(this);
    this.registerLookControls = this.registerLookControls.bind(this);
    this.isReady = this.isReady.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.singleTouchStart = this.singleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.singleTouchMove = this.singleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.singleTouchEnd = this.singleTouchEnd.bind(this);
    this.pinch = this.pinch.bind(this);
    this.look = this.look.bind(this);
  }

  registerCursor(cursor) {
    this.cursor = cursor;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  registerLookControls(lookControls) {
    this.lookControls = lookControls;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  registerPinchEmitter(pinchEmitter) {
    this.pinchEmitter = pinchEmitter;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  isReady() {
    return this.cursor && this.lookControls && this.pinchEmitter;
  }

  addEventListeners() {
    document.addEventListener("touchstart", this.handleTouchStart);
    document.addEventListener("touchmove", this.handleTouchMove);
    document.addEventListener("touchend", this.handleTouchEnd);
    document.addEventListener("touchcancel", this.handleTouchEnd);
  }

  handleTouchStart(e) {
    Array.prototype.forEach.call(e.changedTouches, this.singleTouchStart);
  }

  singleTouchStart(touch) {
    if (touch.clientY / window.innerHeight >= VIRTUAL_JOYSTICK_HEIGHT) {
      return;
    }
    if (!this.touchReservedForCursor && this.cursor.handleTouchStart(touch)) {
      this.touchReservedForCursor = touch;
    }
    this.touches.push(touch);
  }

  handleTouchMove(e) {
    Array.prototype.forEach.call(e.touches, this.singleTouchMove);
    if (this.needsPinch) {
      this.pinch();
      this.needsPinch = false;
    }
  }

  singleTouchMove(touch) {
    if (this.touchReservedForCursor && touch.identifier === this.touchReservedForCursor.identifier) {
      this.cursor.handleTouchMove(touch);
      return;
    }
    if (touch.clientY / window.innerHeight >= VIRTUAL_JOYSTICK_HEIGHT) return;
    if (!this.touches.some(t => touch.identifier === t.identifier)) {
      return;
    }

    let pinchIndex = this.touchesReservedForPinch.findIndex(t => touch.identifier === t.identifier);
    if (pinchIndex !== -1) {
      this.touchesReservedForPinch[pinchIndex] = touch;
    } else if (this.touchesReservedForPinch.length < 2) {
      this.touchesReservedForPinch.push(touch);
      pinchIndex = this.touchesReservedForPinch.length - 1;
    }
    if (this.touchesReservedForPinch.length == 2 && pinchIndex !== -1) {
      if (this.touchReservedForLookControls && touch.identifier === this.touchReservedForLookControls.identifier) {
        this.touchReservedForLookControls = null;
      }
      this.needsPinch = true;
      return;
    }

    if (!this.touchReservedForLookControls) {
      this.touchReservedForLookControls = touch;
    }
    if (touch.identifier === this.touchReservedForLookControls.identifier) {
      if (!this.touchReservedForCursor) {
        this.cursor.handleTouchMove(touch);
      }
      this.look(this.touchReservedForLookControls, touch);
      this.touchReservedForLookControls = touch;
      return;
    }
  }

  pinch() {
    const t1 = this.touchesReservedForPinch[0];
    const t2 = this.touchesReservedForPinch[1];
    const isNewPinch = t1.identifier !== this.pinchTouchId1 || t2.identifier !== this.pinchTouchId2;
    const pinchDistance = TouchEventsHandler.distance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
    this.pinchEmitter.emit("pinch", { isNewPinch: isNewPinch, distance: pinchDistance });
    this.pinchTouchId1 = t1.identifier;
    this.pinchTouchId2 = t2.identifier;
  }

  look(prevTouch, touch) {
    const dX = touch.clientX - prevTouch.clientX;
    const dY = touch.clientY - prevTouch.clientY;

    this.lookControls.yawObject.rotation.y += dX * HORIZONTAL_LOOK_SPEED;
    this.lookControls.pitchObject.rotation.x += dY * VERTICAL_LOOK_SPEED;
    this.lookControls.pitchObject.rotation.x = Math.max(
      -PI_4,
      Math.min(PI_4, this.lookControls.pitchObject.rotation.x)
    );
  }

  handleTouchEnd(e) {
    Array.prototype.forEach.call(e.changedTouches, this.singleTouchEnd);
  }

  singleTouchEnd(touch) {
    const touchIndex = this.touches.findIndex(t => touch.identifier === t.identifier);
    if (touchIndex === -1) {
      return;
    }
    this.touches.splice(touchIndex, 1);

    if (this.touchReservedForCursor && touch.identifier === this.touchReservedForCursor.identifier) {
      this.cursor.handleTouchEnd(touch);
      this.touchReservedForCursor = null;
      return;
    }

    const pinchIndex = this.touchesReservedForPinch.findIndex(t => touch.identifier === t.identifier);
    if (pinchIndex !== -1) {
      this.touchesReservedForPinch.splice(pinchIndex, 1);
      this.pinchTouchId1 = -1;
      this.pinchTouchId2 = -1;
    }

    if (this.touchReservedForLookControls && touch.identifier === this.touchReservedForLookControls.identifier) {
      this.touchReservedForLookControls = null;
    }
  }

  static distance = (x1, y1, x2, y2) => {
    const x = x1 - x2;
    const y = y1 - y2;
    return Math.sqrt(x * x + y * y);
  };
}
