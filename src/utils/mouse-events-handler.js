// TODO: Make look speed adjustable by the user
const HORIZONTAL_LOOK_SPEED = 0.1;
const VERTICAL_LOOK_SPEED = 0.06;

export default class MouseEventsHandler {
  constructor(cursor, cameraController) {
    this.cursor = cursor;
    const cursorController = this.cursor.el.getAttribute("cursor-controller");
    this.superHand = cursorController.cursor.components["super-hands"];
    this.cameraController = cameraController;
    this.isLeftButtonDown = false;
    this.isLeftButtonHandledByCursor = false;
    this.isPointerLocked = false;
    this.currentlyGrabbingSticky = false;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.addEventListeners();
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
    if (this.currentlyGrabbingSticky) {
      this.superHand.el.emit("secondary-cursor-grab");
    } else {
      this.isLeftButtonDown = true;
      this.isLeftButtonHandledByCursor = this.cursor.startInteraction();
    }
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
    switch (e.deltaMode) {
      case e.DOM_DELTA_PIXEL:
        this.cursor.changeDistanceMod(e.deltaY / 500);
        break;
      case e.DOM_DELTA_LINE:
        this.cursor.changeDistanceMod(e.deltaY / 10);
        break;
      case e.DOM_DELTA_PAGE:
        this.cursor.changeDistanceMod(e.deltaY / 2);
        break;
    }
  }

  onMouseMove(e) {
    const shouldLook = this.isPointerLocked || (this.isLeftButtonDown && !this.isLeftButtonHandledByCursor);
    if (shouldLook) {
      this.look(e);
    }

    this.cursor.moveCursor(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }

  onMouseUp(e) {
    switch (e.button) {
      case 0: //left button
        const grabbed = this.superHand.state.get("grab-start");
        if (!this.isSticky(grabbed)) {
          this.endCursorInteraction();
        } else if (!this.currentlyGrabbingSticky) {
          this.currentlyGrabbingSticky = true;
        } else {
          this.superHand.el.emit("secondary-cursor-release");
        }
        break;
      case 1: //middle/scroll button
        this.endCursorInteraction();
        break;
      case 2: //right button
        this.endCursorInteraction();
        break;
    }
  }

  isSticky(el) {
    return el && el.classList.contains("sticky");
  }

  endCursorInteraction() {
    if (this.isLeftButtonHandledByCursor) {
      this.cursor.endInteraction();
    }
    this.isLeftButtonHandledByCursor = false;
    this.isLeftButtonDown = false;
    this.currentlyGrabbingSticky = false;
  }

  look(e) {
    const sign = this.invertMouseLook ? 1 : -1;
    const deltaPitch = e.movementY * VERTICAL_LOOK_SPEED * sign;
    const deltaYaw = e.movementX * HORIZONTAL_LOOK_SPEED * sign;
    this.cameraController.look(deltaPitch, deltaYaw);
  }
}
