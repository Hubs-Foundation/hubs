export default class PrimaryActionHandler {
  constructor(scene) {
    this.scene = scene;
    this.cursor = null;
    this.isCursorInteracting = false;

    this.registerCursor = this.registerCursor.bind(this);
    this.isReady = this.isReady.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onPrimaryDown = this.onPrimaryDown.bind(this);
    this.onPrimaryUp = this.onPrimaryUp.bind(this);
    this.onGrab = this.onGrab.bind(this);
    this.onRelease = this.onRelease.bind(this);
    this.onCardboardButtonDown = this.onCardboardButtonDown.bind(this);
    this.onCardboardButtonUp = this.onCardboardButtonUp.bind(this);
    this.onMoveDuck = this.onMoveDuck.bind(this);
  }

  registerCursor(cursor) {
    this.cursor = cursor;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  isReady() {
    return this.cursor;
  }

  addEventListeners() {
    this.scene.addEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.addEventListener("action_primary_up", this.onPrimaryUp);
    this.scene.addEventListener("action_grab", this.onGrab);
    this.scene.addEventListener("action_release", this.onRelease);
    this.scene.addEventListener("cardboardbuttondown", this.onCardboardButtonDown);
    this.scene.addEventListener("cardboardbuttonup", this.onCardboardButtonUp);
    this.scene.addEventListener("move_duck", this.onMoveDuck);
  }

  onMoveDuck(e) {
    if (this.isCursorInteracting) {
      this.cursor.changeDistanceMod(-e.detail.axis[1] / 8);
    }
  }

  onGrab(e) {
    if (e.target.id.match(this.cursor.data.handedness)) {
      if (this.isCursorInteracting) {
        return;
      } else if (e.target.components["super-hands"].state.has("hover-start")) {
        e.target.emit("hand_grab");
        return;
      } else {
        this.isCursorInteracting = this.cursor.startInteraction();
        return;
      }
    } else {
      e.target.emit("hand_grab");
      return;
    }
  }

  onRelease(e) {
    if (e.target.id.match(this.cursor.data.handedness) && this.isCursorInteracting) {
      this.isCursorInteracting = false;
      this.cursor.endInteraction();
    } else {
      e.target.emit("hand_release");
    }
  }

  onPrimaryDown(e) {
    if (e.target.id.match(this.cursor.data.handedness)) {
      if (this.isCursorInteracting) {
        return;
      } else if (e.target.components["super-hands"].state.has("hover-start")) {
        e.target.emit("hand_grab");
        return;
      } else {
        this.isCursorInteracting = this.cursor.startInteraction();
        if (this.isCursorInteracting) return;
      }
    }

    this.cursor.setCursorVisibility(false);
    const button = e.target.components["teleport-controls"].data.button;
    e.target.emit(button + "down");
  }

  onPrimaryUp(e) {
    if (e.target.id.match(this.cursor.data.handedness) && this.isCursorInteracting) {
      this.isCursorInteracting = false;
      this.cursor.endInteraction();
      return;
    }

    if (e.target.components["super-hands"].state.has("grab-start")) {
      e.target.emit("hand_release");
    }

    this.cursor.setCursorVisibility(true);
    const button = e.target.components["teleport-controls"].data.button;
    e.target.emit(button + "up");
  }

  onCardboardButtonDown(e) {
    this.isCursorInteracting = this.cursor.startInteraction();
    if (this.isCursorInteracting) {
      return;
    }

    this.cursor.setCursorVisibility(false);

    const gazeTeleport = e.target.querySelector("#gaze-teleport");
    const button = gazeTeleport.components["teleport-controls"].data.button;
    gazeTeleport.emit(button + "down");
  }

  onCardboardButtonUp(e) {
    if (this.isCursorInteracting) {
      this.isCursorInteracting = false;
      this.cursor.endInteraction();
      return;
    }

    this.cursor.setCursorVisibility(true);

    const gazeTeleport = e.target.querySelector("#gaze-teleport");
    const button = gazeTeleport.components["teleport-controls"].data.button;
    gazeTeleport.emit(button + "up");
  }
}
