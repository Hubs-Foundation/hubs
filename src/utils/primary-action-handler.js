export default class PrimaryActionHandler {
  constructor(scene) {
    this.cursor = null;
    this.handledByCursor = false;
    this.handledByTeleport = false;

    this.rightTeleporter = null;
    this.leftTeleporter = null;
    this.scene = scene;

    this.registerCursor = this.registerCursor.bind(this);
    this.isReady = this.isReady.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.onPrimaryDown = this.onPrimaryDown.bind(this);
    this.onPrimaryUp = this.onPrimaryUp.bind(this);
  }

  registerCursor(cursor) {
    this.cursor = cursor;
    if (this.isReady()) {
      this.addEventListeners();
    }
  }

  isReady() {
    return this.cursor; // && this.rightTeleporter && this.leftTeleporter;
  }

  addEventListeners() {
    this.scene.addEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.addEventListener("action_primary_up", this.onPrimaryUp);
  }

  onPrimaryDown(e) {
    this.handledByCursor = this.cursor.startInteraction();
    if (this.handledByCursor) return;
    // Do teleport things.
    console.log(e);
    if (e.target.components["teleport-controls"]) {
      console.log("yes");
    }
    console.log("no");
  }

  onPrimaryUp(e) {
    if (this.handledByCursor) {
      this.cursor.endInteraction();
      return;
    }
  }
}
