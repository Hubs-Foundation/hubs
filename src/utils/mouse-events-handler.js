const HORIZONTAL_LOOK_SPEED = 0.0035;
const VERTICAL_LOOK_SPEED = 0.0021;
const PI_4 = Math.PI / 4;

export default class MouseEventsHandler {
  constructor() {
    this.cursor = null;
    this.lookControls = null;
    this.isMouseDown = false;
    this.isMouseDownHandledByCursor = false;
    this.isPointerLocked = false;
    this.dXBuffer = [];
    this.dYBuffer = [];

    this.registerCursor = this.registerCursor.bind(this);
    this.registerLookControls = this.registerLookControls.bind(this);
    this.isReady = this.isReady.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.look = this.look.bind(this);

    document.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    });
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

  registerLookControls(lookControls) {
    this.lookControls = lookControls;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  isReady() {
    return this.cursor && this.lookControls;
  }

  addEventListeners() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("wheel", this.onMouseWheel);
  }

  onMouseDown(e) {
    const isLeftButton = e.button === 0;
    if (isLeftButton) {
      this.isMouseDownHandledByCursor = this.cursor.handleMouseDown();
      this.isMouseDown = true;
    } else {
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
    this.cursor.handleMouseWheel(e);
  }

  onMouseMove(e) {
    const shouldLook = (this.isMouseDown && !this.isMouseDownHandledByCursor) || this.isPointerLocked;
    if (shouldLook) {
      this.look(e);
    }

    this.cursor.handleMouseMove(e);
  }

  look(e) {
    const movementX = e.movementX;
    const movementY = e.movementY;

    const sign = this.invertMouseLook ? 1 : -1;
    this.lookControls.yawObject.rotation.y += sign * movementX * HORIZONTAL_LOOK_SPEED;
    this.lookControls.pitchObject.rotation.x += sign * movementY * VERTICAL_LOOK_SPEED;
    this.lookControls.pitchObject.rotation.x = Math.max(
      -PI_4,
      Math.min(PI_4, this.lookControls.pitchObject.rotation.x)
    );
    this.lookControls.updateOrientation();
  }

  onMouseUp(e) {
    const isLeftButton = e.button === 0;
    if (isLeftButton) {
      if (this.isMouseDownHandledByCursor) {
        this.cursor.handleMouseUp();
      }
      this.isMouseDownHandledByCursor = false;
      this.isMouseDown = false;
      this.dXBuffer = [];
      this.dYBuffer = [];
    } else {
    }
  }
}
