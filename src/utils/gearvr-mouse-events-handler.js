export default class GearVRMouseEventsHandler {
  constructor(cursor, gazeTeleporter) {
    this.cursor = cursor;
    this.gazeTeleporter = gazeTeleporter;
    this.isMouseDownHandledByCursor = false;
    this.isMouseDownHandledByGazeTeleporter = false;

    this.addEventListeners = this.addEventListeners.bind(this);
    this.tearDown = this.tearDown.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.addEventListeners();
  }

  addEventListeners() {
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  tearDown() {
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown() {
    this.isMouseDownHandledByCursor = this.cursor.startInteraction();
    if (this.isMouseDownHandledByCursor) {
      return;
    }

    this.cursor.setCursorVisibility(false);

    const button = this.gazeTeleporter.data.button;
    this.gazeTeleporter.el.emit(button + "down");
    this.isMouseDownHandledByGazeTeleporter = true;
  }

  onMouseUp() {
    if (this.isMouseDownHandledByCursor) {
      this.cursor.endInteraction();
      this.isMouseDownHandledByCursor = false;
    }

    this.cursor.setCursorVisibility(true);

    if (this.isMouseDownHandledByGazeTeleporter) {
      const button = this.gazeTeleporter.data.button;
      this.gazeTeleporter.el.emit(button + "up");
      this.isMouseDownHandledByGazeTeleporter = false;
    }
  }
}
