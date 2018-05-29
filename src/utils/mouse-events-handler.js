// TODO: Make look speed adjustable by the user
const HORIZONTAL_LOOK_SPEED = 0.1;
const VERTICAL_LOOK_SPEED = 0.06;

export class MouseEventsHandler {
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
    this.cursor.handleMouseWheel(e);
  }

  onMouseMove(e) {
    const shouldLook = this.isPointerLocked || (this.isLeftButtonDown && !this.isLeftButtonHandledByCursor);
    if (shouldLook) {
      this.look(e);
    }

    this.cursor.moveCursor(e);
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

//TODO: Finish gearvr mouse events handler
export class GearVRMouseEventsHandler {
  constructor() {
    this.cursor = null;
    this.gazeTeleporter = null;
    this.isMouseDownHandledByCursor = false;
    this.isMouseDownHandledByGazeTeleporter = false;

    this.registerCursor = this.registerCursor.bind(this);
    this.registerGazeTeleporter = this.registerGazeTeleporter.bind(this);
    this.isReady = this.isReady.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  registerCursor(cursor) {
    this.cursor = cursor;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  registerGazeTeleporter(gazeTeleporter) {
    this.gazeTeleporter = gazeTeleporter;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  isReady() {
    return this.cursor && this.gazeTeleporter;
  }

  addEventListeners() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown() {
    this.isMouseDownHandledByCursor = this.cursor.startInteraction();
    if (this.isMouseDownHandledByCursor) {
      return;
    }

    this.gazeTeleporter.startTeleport();
    this.isMouseDownHandledByGazeTeleporter = true;
  }

  onMouseUp() {
    if (this.isMouseDownHandledByCursor) {
      this.cursor.endInteraction();
      this.isMouseDownHandledByCursor = false;
    }

    if (this.isMouseDownHandledByGazeTeleporter) {
      this.gazeTeleporter.endTeleport();
      this.isMouseDownHandledByGazeTeleporter = false;
    }
  }
}
