// TODO: Make look speed adjustable by the user
const HORIZONTAL_LOOK_SPEED = 0.1;
const VERTICAL_LOOK_SPEED = 0.06;
const SCROLL_TIMEOUT = 250;

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

    this.lastScrollTime = 0;
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
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("wheel", this.onMouseWheel);
    document.addEventListener("contextmenu", this.onContextMenu);
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
    if (this.isSticky(this.superHand.state.get("grab-start"))) {
      this.superHand.el.emit("secondary-cursor-grab");
    }
    this.isLeftButtonHandledByCursor = this.cursor.startInteraction();
  }

  onRightButtonDown() {
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
    let mod = 0;
    switch (e.deltaMode) {
      case e.DOM_DELTA_PIXEL:
        mod = e.deltaY / 500;
        break;
      case e.DOM_DELTA_LINE:
        mod = e.deltaY / 10;
        break;
      case e.DOM_DELTA_PAGE:
        mod = e.deltaY / 2;
        break;
    }

    const direction = this.cursor.changeDistanceMod(mod);
    let event;
    if (direction === 1) {
      event = "scroll_up";
    } else if (direction === -1) {
      event = "scroll_down";
    }

    if (direction !== 0 && (this.lastScrollTime === 0 || this.lastScrollTime + SCROLL_TIMEOUT < Date.now())) {
      this.superHand.el.emit(event);
      this.superHand.el.emit("scroll_release");
      this.lastScrollTime = Date.now();
    }
  }

  onMouseMove(e) {
    const shouldLook = this.isPointerLocked || (this.isLeftButtonDown && !this.isLeftButtonHandledByCursor);
    if (shouldLook) {
      this.look(e);
    }

    this.cursor.moveCursor((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }

  onMouseUp(e) {
    switch (e.button) {
      case 0: //left button
        if (this.isSticky(this.superHand.state.get("grab-start"))) {
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

  isSticky(el) {
    return el && el.matches(".sticky, .sticky *");
  }

  look(e) {
    const sign = this.invertMouseLook ? 1 : -1;
    const deltaPitch = e.movementY * VERTICAL_LOOK_SPEED * sign;
    const deltaYaw = e.movementX * HORIZONTAL_LOOK_SPEED * sign;
    this.cameraController.look(deltaPitch, deltaYaw);
  }
}
