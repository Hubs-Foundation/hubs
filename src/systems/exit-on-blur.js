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
    if (this.isOculusBrowser) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = setTimeout(this.onTimeout, 15 * 1000);
    }
  },

  onBlur() {
    if (this.el.isMobile) {
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
