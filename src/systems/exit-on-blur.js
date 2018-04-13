AFRAME.registerSystem("exit-on-blur", {
  init() {
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);

    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);

    this.exitTimeout = null;
  },

  onBlur() {
    if (this.el.isMobile) {
      this.exitTimeout = setTimeout(() => {
        this.el.dispatchEvent(new CustomEvent("exit"));
      }, 10 * 1000);
    }
  },

  onFocus() {
    if (this.el.isMobile) {
      clearTimeout(this.exitTimeout);
    }
  },

  remove() {
    clearTimeout(this.exitTimeout);
    window.removeEventListener("blur", this.onBlur);
  }
});
