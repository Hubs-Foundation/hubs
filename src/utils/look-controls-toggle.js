export default class LookControlsToggle {
  constructor(lookControlsEl, pointerLookControls) {
    this.lookControlsEl = lookControlsEl;
    this.pointerLookControls = pointerLookControls;
    this.toggle = this.toggle.bind(this);
    this.allAgreeToEnable = this.allAgreeToEnable.bind(this);
    this.requesters = {};
  }

  allAgreeToEnable() {
    for (const i in this.requesters) {
      if (!this.requesters[i]) {
        return false;
      }
    }
    return true;
  }

  toggle(enable, requester) {
    this.requesters[requester] = enable;
    const consensus = this.allAgreeToEnable();

    if (!this.lookControls) {
      this.lookControls = this.lookControlsEl.components["look-controls"];
    }

    if (consensus) {
      this.lookControls.play();
      this.pointerLookControls.start();
    } else {
      this.lookControls.pause();
      this.pointerLookControls.stop();
    }
  }
}
