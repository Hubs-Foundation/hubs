export default class GearVRMouseEventsHandler {
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

    const button = this.gazeTeleporter.data.button;
    this.gazeTeleporter.el.emit(button + "down");
    this.isMouseDownHandledByGazeTeleporter = true;
  }

  onMouseUp() {
    if (this.isMouseDownHandledByCursor) {
      this.cursor.endInteraction();
      this.isMouseDownHandledByCursor = false;
    }

    if (this.isMouseDownHandledByGazeTeleporter) {
      const button = this.gazeTeleporter.data.button;
      this.gazeTeleporter.el.emit(button + "up");
      this.isMouseDownHandledByGazeTeleporter = false;
    }
  }
}
