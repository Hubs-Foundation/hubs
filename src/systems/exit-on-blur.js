AFRAME.registerSystem("exit-on-blur", {
  init() {
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onTimeout = this.onTimeout.bind(this);

    this.isOculusBrowser = navigator.userAgent.match(/Oculus/);

    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);

    this.exitTimeout = null;
  },

  tick() {
    // This is a hack to detect when an Oculus Go user has taken off the headset and the headset has
    // entered standby mode. Currently Oculus Browser is not emitting a blur, vrdisplaydeactivate,
    // vrdisplayblur, visibilitychange, or vrdisplaypresentchange event, so we wait 15 seconds after
    // the last requestAnimationFrame callback to determine if the headset has gone into standby mode.
    if (this.isOculusBrowser) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = setTimeout(this.onTimeout, 15 * 1000);
    }
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
    this.el.dispatchEvent(new CustomEvent("exit"));
  },

  remove() {
    clearTimeout(this.exitTimeout);
    window.removeEventListener("blur", this.onBlur);
  }
});
