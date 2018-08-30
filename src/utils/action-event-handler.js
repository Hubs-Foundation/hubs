const VERTICAL_SCROLL_TIMEOUT = 250;
const HORIZONTAL_SCROLL_TIMEOUT = 250;
const SCROLL_THRESHOLD = 0.05;
const SCROLL_MODIFIER = 0.1;

export default class ActionEventHandler {
  constructor(scene, cursor) {
    this.scene = scene;
    this.cursor = cursor;
    this.cursorHand = this.cursor.data.cursor.components["super-hands"];
    this.isCursorInteracting = false;
    this.isTeleporting = false;
    this.handThatAlsoDrivesCursor = null;
    this.hovered = false;

    this.gotPrimaryDown = false;

    this.onPrimaryDown = this.onPrimaryDown.bind(this);
    this.onPrimaryUp = this.onPrimaryUp.bind(this);
    this.onSecondaryDown = this.onSecondaryDown.bind(this);
    this.onSecondaryUp = this.onSecondaryUp.bind(this);
    this.onPrimaryGrab = this.onPrimaryGrab.bind(this);
    this.onPrimaryRelease = this.onPrimaryRelease.bind(this);
    this.onSecondaryGrab = this.onSecondaryGrab.bind(this);
    this.onSecondaryRelease = this.onSecondaryRelease.bind(this);
    this.onCardboardButtonDown = this.onCardboardButtonDown.bind(this);
    this.onCardboardButtonUp = this.onCardboardButtonUp.bind(this);
    this.onScrollMove = this.onScrollMove.bind(this);
    this.addEventListeners();

    this.lastVerticalScrollTime = 0;
    this.lastHorizontalScrollTime = 0;
  }

  addEventListeners() {
    this.scene.addEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.addEventListener("action_primary_up", this.onPrimaryUp);
    this.scene.addEventListener("action_secondary_down", this.onSecondaryDown);
    this.scene.addEventListener("action_secondary_up", this.onSecondaryUp);
    this.scene.addEventListener("primary_action_grab", this.onPrimaryGrab);
    this.scene.addEventListener("primary_action_release", this.onPrimaryRelease);
    this.scene.addEventListener("secondary_action_grab", this.onSecondaryGrab);
    this.scene.addEventListener("secondary_action_release", this.onSecondaryRelease);
    this.scene.addEventListener("scroll_move", this.onScrollMove);
    this.scene.addEventListener("cardboardbuttondown", this.onCardboardButtonDown); // TODO: These should be actions
    this.scene.addEventListener("cardboardbuttonup", this.onCardboardButtonUp);
  }

  tearDown() {
    this.scene.removeEventListener("action_primary_down", this.onPrimaryDown);
    this.scene.removeEventListener("action_primary_up", this.onPrimaryUp);
    this.scene.removeEventListener("action_secondary_down", this.onSecondaryDown);
    this.scene.removeEventListener("action_secondary_up", this.onSecondaryUp);
    this.scene.removeEventListener("primary_action_grab", this.onPrimaryGrab);
    this.scene.removeEventListener("primary_action_release", this.onPrimaryRelease);
    this.scene.removeEventListener("secondary_action_grab", this.onSecondaryGrab);
    this.scene.removeEventListener("secondary_action_release", this.onSecondaryRelease);
    this.scene.removeEventListener("scroll_move", this.onScrollMove);
    this.scene.removeEventListener("cardboardbuttondown", this.onCardboardButtonDown);
    this.scene.removeEventListener("cardboardbuttonup", this.onCardboardButtonUp);
  }

  onScrollMove(e) {
    let scrollY = e.detail.axis[1] * SCROLL_MODIFIER;
    scrollY = Math.abs(scrollY) > SCROLL_THRESHOLD ? scrollY : 0;
    const changed = this.cursor.changeDistanceMod(-scrollY); //TODO: don't negate this for certain controllers

    let scrollX = e.detail.axis[0] * SCROLL_MODIFIER;
    scrollX = Math.abs(scrollX) > SCROLL_THRESHOLD ? scrollX : 0;

    if (
      Math.abs(scrollY) > 0 &&
      (this.lastVerticalScrollTime === 0 || this.lastVerticalScrollTime + VERTICAL_SCROLL_TIMEOUT < Date.now())
    ) {
      if (!changed && this.isCursorInteracting && this.isHandThatAlsoDrivesCursor(e.target)) {
        this.cursorHand.el.emit(scrollY < 0 ? "scroll_up" : "scroll_down");
        this.cursorHand.el.emit("vertical_scroll_release");
      } else {
        e.target.emit(scrollY < 0 ? "scroll_up" : "scroll_down");
        e.target.emit("vertical_scroll_release");
      }
      this.lastVerticalScrollTime = Date.now();
    }

    if (
      Math.abs(scrollX) > 0 &&
      (this.lastHorizontalScrollTime === 0 || this.lastHorizontalScrollTime + HORIZONTAL_SCROLL_TIMEOUT < Date.now())
    ) {
      if (this.isCursorInteracting && this.isHandThatAlsoDrivesCursor(e.target)) {
        this.cursorHand.el.emit(scrollX < 0 ? "scroll_left" : "scroll_right");
        this.cursorHand.el.emit("horizontal_scroll_release");
      } else {
        e.target.emit(scrollX < 0 ? "scroll_left" : "scroll_right");
        e.target.emit("horizontal_scroll_release");
      }
    }
  }

  setHandThatAlsoDrivesCursor(handThatAlsoDrivesCursor) {
    this.handThatAlsoDrivesCursor = handThatAlsoDrivesCursor;
  }

  isToggle(el) {
    return el && el.matches(".toggle, .toggle *");
  }

  isHandThatAlsoDrivesCursor(el) {
    return this.handThatAlsoDrivesCursor === el;
  }

  onGrab(e, event) {
    event = event || e.type;
    const superHand = e.target.components["super-hands"];
    const isCursorHand = this.isHandThatAlsoDrivesCursor(e.target);
    this.isCursorInteracting = this.cursor.isInteracting();
    if (isCursorHand && !this.isCursorInteracting) {
      if (superHand.state.has("hover-start") || superHand.state.get("grab-start")) {
        e.target.emit(event);
      } else {
        this.isCursorInteracting = this.cursor.startInteraction();
      }
    } else if (isCursorHand && this.isCursorInteracting) {
      this.cursorHand.el.emit(event);
    } else {
      e.target.emit(event);
    }
  }

  onRelease(e, event) {
    event = event || e.type;
    const isCursorHand = this.isHandThatAlsoDrivesCursor(e.target);
    if (this.isCursorInteracting && isCursorHand) {
      //need to check both grab-start and hover-start in the case that the spawner is being grabbed this frame
      if (this.isToggle(this.cursorHand.state.get("grab-start") || this.cursorHand.state.get("hover-start"))) {
        this.cursorHand.el.emit(event);
        this.isCursorInteracting = this.cursor.isInteracting();
      } else {
        this.isCursorInteracting = false;
        this.cursor.endInteraction();
      }
    } else {
      e.target.emit(event);
    }
  }

  onPrimaryGrab(e) {
    this.onGrab(e, "primary_hand_grab");
  }

  onPrimaryRelease(e) {
    this.onRelease(e, "primary_hand_release");
  }

  onSecondaryGrab(e) {
    this.onGrab(e, "secondary_hand_grab");
  }

  onSecondaryRelease(e) {
    this.onRelease(e, "secondary_hand_release");
  }

  onDown(e, event) {
    this.onGrab(e, event);

    if (
      this.isHandThatAlsoDrivesCursor(e.target) &&
      !this.isCursorInteracting &&
      !this.cursorHand.state.get("grab-start")
    ) {
      this.cursor.setCursorVisibility(false);
      const button = e.target.components["teleport-controls"].data.button;
      e.target.emit(button + "down");
      this.isTeleporting = true;
    }
  }

  onUp(e, event) {
    if (this.isTeleporting && this.isHandThatAlsoDrivesCursor(e.target)) {
      const superHand = e.target.components["super-hands"];
      this.cursor.setCursorVisibility(!superHand.state.has("hover-start"));
      const button = e.target.components["teleport-controls"].data.button;
      e.target.emit(button + "up");
      this.isTeleporting = false;
    } else {
      this.onRelease(e, event);
    }
  }

  onPrimaryDown(e) {
    if (!this.gotPrimaryDown) {
      this.onDown(e, "primary_hand_grab");
      this.gotPrimaryDown = true;
    }
  }

  onPrimaryUp(e) {
    if (this.gotPrimaryDown) {
      this.onUp(e, "primary_hand_release");
    } else {
      this.onUp(e, "secondary_hand_release");
    }
    this.gotPrimaryDown = false;
  }

  onSecondaryDown(e) {
    this.onDown(e, "secondary_hand_grab");
  }

  onSecondaryUp(e) {
    this.onUp(e, "secondary_hand_release");
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
