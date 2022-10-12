/**
 * Emits an "exit" event when a user has stopped using the app for a certain period of time
 * @system exit-on-blur
 */
AFRAME.registerSystem("exit-on-blur", {
  init() {
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onTimeout = this.onTimeout.bind(this);
    this.onEnterVR = this.onEnterVR.bind(this);

    this.isOculusBrowser = navigator.userAgent.match(/Oculus/);
    this.enteredVR = false;

    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
    this.el.addEventListener("enter-vr", this.onEnterVR);

    this.lastTimeoutCheck = 0;
    this.exitTimeout = null;
  },

  tick(t) {
    // This is a hack to detect when an Oculus Go user has taken off the headset and the headset has
    // entered standby mode. Currently Oculus Browser is not emitting a blur, vrdisplaydeactivate,
    // vrdisplayblur, visibilitychange, or vrdisplaypresentchange event, so we wait 15 seconds after
    // the last requestAnimationFrame callback to determine if the headset has gone into standby mode.
    // We also check that you have entered VR so that this timeout does not occur in the setup UI.
    if (
      this.isOculusBrowser &&
      this.enteredVR &&
      (this.lastTimeoutCheck === 0 || t - this.lastTimeoutCheck >= 1000.0) // Don't do this clear every frame, slow.
    ) {
      this.lastTimeoutCheck = t;
      clearTimeout(this.exitTimeout);
      this.exitTimeout = setTimeout(this.onTimeout, 30 * 1000);
    }
  },

  onEnterVR() {
    this.enteredVR = true;
  },

  onBlur() {
    if (this.el.isMobile) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = setTimeout(this.onTimeout, 30 * 1000);
    }
  },

  onFocus() {
    if (this.el.isMobile) {
      clearTimeout(this.exitTimeout);
    }
  },

  onTimeout() {
    if (window.APP.store.state.preferences.disableIdleDetection) return;
    this.el.dispatchEvent(new CustomEvent("exit"));
  },

  remove() {
    clearTimeout(this.exitTimeout);
    window.removeEventListener("blur", this.onBlur);
  }
});
