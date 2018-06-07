export default class ActionEventHandler {
  constructor(scene, cursor) {
    this.scene = scene;
    this.cursor = cursor;
    this.isCursorInteracting = false;
    this.isCursorInteractingOnGrab = false;
    this.isTeleporting = false;
    this.handThatAlsoDrivesCursor = null;
    this.hovered = false;

    this.onPrimaryDown = this.onPrimaryDown.bind(this);
    this.onPrimaryUp = this.onPrimaryUp.bind(this);
    this.onGrab = this.onGrab.bind(this);
    this.onRelease = this.onRelease.bind(this);
    this.onCardboardButtonDown = this.onCardboardButtonDown.bind(this);
    this.onCardboardButtonUp = this.onCardboardButtonUp.bind(this);
    this.onMoveDuck = this.onMoveDuck.bind(this);
    this.addEventListeners();
  }

  addEventListeners() {
    this.scene.addEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.addEventListener("action_primary_up", this.onPrimaryUp);
    this.scene.addEventListener("action_grab", this.onGrab);
    this.scene.addEventListener("action_release", this.onRelease);
    this.scene.addEventListener("move_duck", this.onMoveDuck);
    this.scene.addEventListener("cardboardbuttondown", this.onCardboardButtonDown); // TODO: These should be actions
    this.scene.addEventListener("cardboardbuttonup", this.onCardboardButtonUp);
  }

  tearDown() {
    this.scene.removeEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.removeEventListener("action_primary_up", this.onPrimaryUp);
    this.scene.removeEventListener("action_grab", this.onGrab);
    this.scene.removeEventListener("action_release", this.onRelease);
    this.scene.removeEventListener("move_duck", this.onMoveDuck);
    this.scene.removeEventListener("cardboardbuttondown", this.onCardboardButtonDown);
    this.scene.removeEventListener("cardboardbuttonup", this.onCardboardButtonUp);
  }

  onMoveDuck(e) {
    this.cursor.changeDistanceMod(-e.detail.axis[1] / 8);
  }

  setHandThatAlsoDrivesCursor(handThatAlsoDrivesCursor) {
    this.handThatAlsoDrivesCursor = handThatAlsoDrivesCursor;
  }

  onGrab(e) {
    if (this.handThatAlsoDrivesCursor && this.handThatAlsoDrivesCursor === e.target) {
      if (this.isCursorInteracting) {
        return;
      } else if (e.target.components["super-hands"].state.has("hover-start")) {
        e.target.emit("hand_grab");
        return;
      } else {
        this.isCursorInteracting = this.cursor.startInteraction();
        if (this.isCursorInteracting) {
          this.isCursorInteractingOnGrab = true;
        }
        return;
      }
    } else {
      e.target.emit("hand_grab");
      return;
    }
  }

  onRelease(e) {
    if (
      this.isCursorInteracting &&
      this.isCursorInteractingOnGrab &&
      this.handThatAlsoDrivesCursor &&
      this.handThatAlsoDrivesCursor === e.target
    ) {
      this.isCursorInteracting = false;
      this.isCursorInteractingOnGrab = false;
      this.cursor.endInteraction();
    } else {
      e.target.emit("hand_release");
    }
  }

  onPrimaryDown(e) {
    if (this.isCursorInteractingOnGrab) return;
    if (this.handThatAlsoDrivesCursor && this.handThatAlsoDrivesCursor === e.target) {
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
    this.isTeleporting = true;
  }

  onPrimaryUp(e) {
    if (this.isCursorInteractingOnGrab) return;
    const isCursorHand = this.handThatAlsoDrivesCursor && this.handThatAlsoDrivesCursor === e.target;
    if (this.isCursorInteracting && isCursorHand) {
      this.isCursorInteracting = false;
      this.cursor.endInteraction();
      return;
    }

    const state = e.target.components["super-hands"].state;
    if (state.has("grab-start")) {
      e.target.emit("hand_release");
      return;
    }

    if (isCursorHand) {
      this.cursor.setCursorVisibility(!state.has("hover-start"));
    }
    const button = e.target.components["teleport-controls"].data.button;
    e.target.emit(button + "up");
    this.isTeleporting = false;
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
    this.isTeleporting = true;
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
    this.isTeleporting = false;
  }

  manageCursorEnabled() {
    const handState = this.handThatAlsoDrivesCursor.components["super-hands"].state;
    const handHoveredThisFrame = !this.hovered && handState.has("hover-start") && !this.isCursorInteracting;
    const handStoppedHoveringThisFrame =
      this.hovered === true && !handState.has("hover-start") && !handState.has("grab-start");
    if (handHoveredThisFrame) {
      this.hovered = true;
      this.cursor.disable();
    } else if (handStoppedHoveringThisFrame) {
      this.hovered = false;
      this.cursor.enable();
      this.cursor.setCursorVisibility(!this.isTeleporting);
    }
  }
}
