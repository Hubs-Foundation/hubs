// TODO: Make look speed adjustable by the user
const HORIZONTAL_LOOK_SPEED = 0.1;
const VERTICAL_LOOK_SPEED = 0.06;

export default class MouseEventsHandler {
  constructor() {
    this.cursor = null;
    this.cameraController = null;
    this.isLeftButtonDown = false;
    this.isLeftButtonHandledByCursor = false;
    this.isPointerLocked = false;

    this.registerCursor = this.registerCursor.bind(this);
    this.registerCameraController = this.registerCameraController.bind(this);
    this.isReady = this.isReady.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onLeftButtonDown = this.onLeftButtonDown.bind(this);
    this.onRightButtonDown = this.onRightButtonDown.bind(this);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.look = this.look.bind(this);
  }

  setInverseMouseLook(invert) {
    this.invertMouseLook = invert;
  }

  registerCursor(cursor) {
    this.cursor = cursor;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  registerCameraController(cameraController) {
    this.cameraController = cameraController;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  isReady() {
    return this.cursor && this.cameraController;
  }

  addEventListeners() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("wheel", this.onMouseWheel);
    document.addEventListener("contextmenu", e => {
      e.preventDefault();
    });
  }

  onMouseDown(e) {
    const isLeftButton = e.button === 0;
    if (isLeftButton) {
      this.onLeftButtonDown();
    } else {
      this.onRightButtonDown();
    }
  }

  onLeftButtonDown() {
    this.isLeftButtonDown = true;
    this.isLeftButtonHandledByCursor = this.cursor.startInteraction();
    if (this.isLeftButtonHandledByCursor) {
      return;
    }
  }

  onRightButtonDown() {
    if (this.isPointerLocked) {
      document.exitPointerLock();
      this.isPointerLocked = false;
    } else {
      document.body.requestPointerLock();
      this.isPointerLocked = true;
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
    const isLeftButton = e.button === 0;
    if (!isLeftButton) return;

    if (this.isLeftButtonHandledByCursor) {
      this.cursor.endInteraction();
    }
    this.isLeftButtonHandledByCursor = false;
    this.isLeftButtonDown = false;
  }

  look(e) {
    const sign = this.invertMouseLook ? 1 : -1;
    const deltaPitch = e.movementY * VERTICAL_LOOK_SPEED * sign;
    const deltaYaw = e.movementX * HORIZONTAL_LOOK_SPEED * sign;
    this.cameraController.look(deltaPitch, deltaYaw);
  }
}
