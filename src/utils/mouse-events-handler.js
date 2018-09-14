// TODO: Make look speed adjustable by the user
const HORIZONTAL_LOOK_SPEED = 0.1;
const VERTICAL_LOOK_SPEED = 0.06;
const VERTICAL_SCROLL_TIMEOUT = 50;
const HORIZONTAL_SCROLL_TIMEOUT = 50;

export default class MouseEventsHandler {
  constructor(cursor, cameraController) {
    this.cursor = cursor;
    const cursorController = this.cursor.el.getAttribute("cursor-controller");
    this.superHand = cursorController.cursor.components["super-hands"];
    this.cameraController = cameraController;
    this.isLeftButtonDown = false;
    this.isLeftButtonHandledByCursor = false;
    this.isPointerLocked = false;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.addEventListeners();

    this.lastVerticalScrollTime = 0;
    this.lastHorizontalScrollTime = 0;
  }

  tearDown() {
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("wheel", this.onMouseWheel);
    document.removeEventListener("contextmenu", this.onContextMenu);
  }

  setInverseMouseLook(invert) {
    this.invertMouseLook = invert;
  }

  addEventListeners() {
    //document.addEventListener("mousedown", this.onMouseDown);
    //document.addEventListener("mousemove", this.onMouseMove);
    //document.addEventListener("mouseup", this.onMouseUp);
    //document.addEventListener("wheel", this.onMouseWheel);
    //document.addEventListener("contextmenu", this.onContextMenu);
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onMouseDown(e) {
    switch (e.button) {
      case 0: //left button
        this.onLeftButtonDown();
        break;
      case 1: //middle/scroll button
        //TODO: rotation? scaling?
        break;
      case 2: //right button
        this.onRightButtonDown();
        break;
    }
  }

  onLeftButtonDown() {
    this.isLeftButtonDown = true;
    if (this.isToggle(this.superHand.state.get("grab-start"))) {
      this.superHand.el.emit("secondary-cursor-grab");
    }
    this.isLeftButtonHandledByCursor = this.cursor.startInteraction();
  }

  onRightButtonDown() {
    this.isLeftButtonHandledByCursor = this.cursor.isInteracting();
    if (!this.isLeftButtonHandledByCursor) {
      if (this.isPointerLocked) {
        document.exitPointerLock();
        this.isPointerLocked = false;
      } else {
        document.body.requestPointerLock();
        this.isPointerLocked = true;
      }
    }
  }

  onMouseWheel(e) {
    let changed = true;
    if (!e.altKey && !e.shiftKey) {
      changed = this.cursor.changeDistanceMod(this.getScrollMod(e.deltaY, e.deltaMode));
    }

    if (
      (!changed || e.shiftKey) &&
      (this.lastVerticalScrollTime === 0 || this.lastVerticalScrollTime + VERTICAL_SCROLL_TIMEOUT < Date.now())
    ) {
      this.superHand.el.emit(e.deltaY > 0 ? "scroll_up" : "scroll_down");
      this.superHand.el.emit("vertical_scroll_release");
      this.lastVerticalScrollTime = Date.now();
    }

    const delta = e.altKey ? e.deltaY : e.deltaX;
    if (
      Math.abs(delta) > 0 &&
      (this.lastHorizontalScrollTime === 0 || this.lastHorizontalScrollTime + HORIZONTAL_SCROLL_TIMEOUT < Date.now())
    ) {
      this.superHand.el.emit(delta < 0 ? "scroll_left" : "scroll_right");
      this.superHand.el.emit("horizontal_scroll_release");
      this.lastHorizontalScrollTime = Date.now();
    }

    if (e.altKey) e.preventDefault(); //prevent forward/back on firefox
  }

  getScrollMod(delta, deltaMode) {
    switch (deltaMode) {
      case WheelEvent.DOM_DELTA_PIXEL:
        return delta / 500;
      case WheelEvent.DOM_DELTA_LINE:
        return delta / 10;
      case WheelEvent.DOM_DELTA_PAGE:
        return delta / 2;
    }
  }

  onMouseMove(e) {
    const shouldLook =
      this.isPointerLocked ||
      (!this.superHand.state.get("grab-start") && this.isLeftButtonDown && !this.isLeftButtonHandledByCursor);
    if (shouldLook) {
      this.look(e);
    }

    this.cursor.moveCursor((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }

  onMouseUp(e) {
    switch (e.button) {
      case 0: //left button
        if (this.isToggle(this.superHand.state.get("grab-start"))) {
          this.superHand.el.emit("secondary-cursor-release");
        } else {
          this.endInteraction();
        }
        this.isLeftButtonDown = false;
        break;
      case 1: //middle/scroll button
        break;
      case 2: //right button
        this.endInteraction();
        break;
    }
  }

  endInteraction() {
    this.cursor.endInteraction();
    this.isLeftButtonHandledByCursor = false;
  }

  isToggle(el) {
    return el && el.matches(".toggle, .toggle *");
  }

  look(e) {
    const sign = this.invertMouseLook ? 1 : -1;
    const deltaPitch = e.movementY * VERTICAL_LOOK_SPEED * sign;
    const deltaYaw = e.movementX * HORIZONTAL_LOOK_SPEED * sign;
    this.cameraController.look(deltaPitch, deltaYaw);
  }
}
