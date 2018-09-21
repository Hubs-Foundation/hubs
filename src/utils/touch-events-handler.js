const VIRTUAL_JOYSTICK_HEIGHT = 0.8;
const HORIZONTAL_LOOK_SPEED = 0.35;
const VERTICAL_LOOK_SPEED = 0.18;

export default class TouchEventsHandler {
  constructor(cursor, cameraController, pinchEmitter) {
    this.cursor = cursor;
    this.cameraController = cameraController;
    this.pinchEmitter = pinchEmitter;
    this.touches = [];
    this.touchReservedForCursor = null;
    this.touchesReservedForPinch = [];
    this.touchReservedForLookControls = null;
    this.needsPinch = false;
    this.pinchTouchId1 = -1;
    this.pinchTouchId2 = -1;

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.singleTouchStart = this.singleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.singleTouchMove = this.singleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.singleTouchEnd = this.singleTouchEnd.bind(this);

    this.addEventListeners();
  }

  addEventListeners() {
//    document.addEventListener("touchstart", this.handleTouchStart);
//    document.addEventListener("touchmove", this.handleTouchMove);
//    document.addEventListener("touchend", this.handleTouchEnd);
//    document.addEventListener("touchcancel", this.handleTouchEnd);
  }

  tearDown() {
    document.removeEventListener("touchstart", this.handleTouchStart);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
    document.removeEventListener("touchcancel", this.handleTouchEnd);
  }

  handleTouchStart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.singleTouchStart(e.changedTouches[i]);
    }
  }

  singleTouchStart(touch) {
    if (touch.clientY / window.innerHeight >= VIRTUAL_JOYSTICK_HEIGHT) {
      return;
    }
    if (!this.touchReservedForCursor) {
      const targetX = (touch.clientX / window.innerWidth) * 2 - 1;
      const targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.cursor.moveCursor(targetX, targetY);
      this.cursor.forceCursorUpdate();
      if (this.cursor.startInteraction()) {
        this.touchReservedForCursor = touch;
      }
    }
    this.touches.push(touch);
  }

  handleTouchMove(e) {
    for (let i = 0; i < e.touches.length; i++) {
      this.singleTouchMove(e.touches[i]);
    }
    if (this.needsPinch) {
      this.pinch();
      this.needsPinch = false;
    }
  }

  singleTouchMove(touch) {
    if (this.touchReservedForCursor && touch.identifier === this.touchReservedForCursor.identifier) {
      const targetX = (touch.clientX / window.innerWidth) * 2 - 1;
      const targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.cursor.moveCursor(targetX, targetY);
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
        this.cursor.moveCursor(
          (touch.clientX / window.innerWidth) * 2 - 1,
          -(touch.clientY / window.innerHeight) * 2 + 1
        );
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
    const deltaPitch = (touch.clientY - prevTouch.clientY) * VERTICAL_LOOK_SPEED;
    const deltaYaw = (touch.clientX - prevTouch.clientX) * HORIZONTAL_LOOK_SPEED;
    this.cameraController.look(deltaPitch, deltaYaw);
  }

  handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.singleTouchEnd(e.changedTouches[i]);
    }
  }

  singleTouchEnd(touch) {
    const touchIndex = this.touches.findIndex(t => touch.identifier === t.identifier);
    if (touchIndex === -1) {
      return;
    }
    this.touches.splice(touchIndex, 1);

    if (this.touchReservedForCursor && touch.identifier === this.touchReservedForCursor.identifier) {
      this.cursor.endInteraction(touch);
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
