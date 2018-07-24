export default class ActionEventHandler {
  constructor(scene, cursor) {
    this.scene = scene;
    this.cursor = cursor;
    this.isCursorInteracting = false;
    this.isCursorInteractingOnGrab = false;
    this.isTeleporting = false;
    this.handThatAlsoDrivesCursor = null;
    this.hovered = false;
    this.currentlyGrabbingSticky = {};

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
    this.scene.addEventListener("action_secondary_down", this.onPrimaryDown);
    this.scene.addEventListener("action_secondary_up", this.onPrimaryUp);
    this.scene.addEventListener("action_grab", this.onGrab);
    this.scene.addEventListener("action_release", this.onRelease);
    this.scene.addEventListener("secondary_action_grab", this.onGrab);
    this.scene.addEventListener("secondary_action_release", this.onRelease);
    this.scene.addEventListener("move_duck", this.onMoveDuck);
    this.scene.addEventListener("cardboardbuttondown", this.onCardboardButtonDown); // TODO: These should be actions
    this.scene.addEventListener("cardboardbuttonup", this.onCardboardButtonUp);
  }

  tearDown() {
    this.scene.removeEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.removeEventListener("action_primary_up", this.onPrimaryUp);
    this.scene.removeEventListener("action_secondary_down", this.onPrimaryDown);
    this.scene.removeEventListener("action_secondary_up", this.onPrimaryUp);
    this.scene.removeEventListener("action_grab", this.onGrab);
    this.scene.removeEventListener("action_release", this.onRelease);
    this.scene.removeEventListener("secondary_action_grab", this.onGrab);
    this.scene.removeEventListener("secondary_action_release", this.onRelease);
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

  isSticky(el) {
    return el && el.matches(".sticky, .sticky *");
  }

  doGrab(e, primary_event_type) {
    const superHand = e.target.components["super-hands"];
    const cursorHand =
      this.isCursorInteractingOnGrab && this.handThatAlsoDrivesCursor === e.target
        ? this.cursor.data.cursor.components["super-hands"]
        : null;
    let grabbed = superHand.state.get("grab-start") || (cursorHand ? cursorHand.state.get("grab-start") : null);
    if (this.currentlyGrabbingSticky[e.target.id] && !grabbed) {
      this.currentlyGrabbingSticky[e.target.id] = false;
    }
    const validGrab =
      !this.isSticky(grabbed) || !this.currentlyGrabbingSticky[e.target.id] || e.type === primary_event_type;

    if (this.handThatAlsoDrivesCursor && this.handThatAlsoDrivesCursor === e.target && !this.isCursorInteracting) {
      if (superHand.state.has("hover-start") && validGrab) {
        e.target.emit("hand_grab");
      } else {
        this.isCursorInteracting = this.cursor.startInteraction();
        if (this.isCursorInteracting) {
          this.isCursorInteractingOnGrab = true;
        }
      }
    } else if (cursorHand !== null) {
      cursorHand.el.emit(e.type);
    } else if (!this.isCursorInteractingOnGrab && validGrab) {
      e.target.emit("hand_grab");
    }

    grabbed = superHand.state.get("grab-start") || (cursorHand ? cursorHand.state.get("grab-start") : null);
    return this.isCursorInteractingOnGrab || grabbed !== null;
  }

  doRelease(e, primary_event_type) {
    const superHand = e.target.components["super-hands"];
    const cursorHand =
      this.isCursorInteractingOnGrab && this.handThatAlsoDrivesCursor === e.target
        ? this.cursor.data.cursor.components["super-hands"]
        : null;
    let grabbed = superHand.state.get("grab-start") || (cursorHand ? cursorHand.state.get("grab-start") : null);
    if (
      (!this.currentlyGrabbingSticky[e.target.id] && this.isSticky(grabbed)) ||
      (this.currentlyGrabbingSticky[e.target.id] && e.type !== primary_event_type)
    ) {
      if (this.currentlyGrabbingSticky[e.target.id] && cursorHand !== null) {
        cursorHand.el.emit(e.type);
      }
      this.currentlyGrabbingSticky[e.target.id] = true;
      return true;
    } else {
      this.currentlyGrabbingSticky[e.target.id] = false;
    }

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

    grabbed = superHand.state.get("grab-start") || (cursorHand ? cursorHand.state.get("grab-start") : null);
    return !this.isCursorInteractingOnGrab && grabbed === null;
  }

  onGrab(e) {
    this.doGrab(e, "action_grab");
  }

  onRelease(e) {
    this.doRelease(e, "action_release");
  }

  onPrimaryDown(e) {
    if (!this.doGrab(e, "action_primary_down")) {
      this.cursor.setCursorVisibility(false);
      const button = e.target.components["teleport-controls"].data.button;
      e.target.emit(button + "down");
      this.isTeleporting = true;
    }
  }

  onPrimaryUp(e) {
    if (!this.doRelease(e, "primary_action_up")) {
      if (isCursorHand) {
        this.cursor.setCursorVisibility(!state.has("hover-start"));
      }
      const button = e.target.components["teleport-controls"].data.button;
      e.target.emit(button + "up");
      this.isTeleporting = false;
    }
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
