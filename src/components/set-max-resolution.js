AFRAME.registerComponent("set-max-resolution", {
  init() {
    const store = window.APP.store;
    this.onStoreChanged = () => {
      const width =
        store.state.preferences.maxResolutionWidth === undefined ? 1920 : store.state.preferences.maxResolutionWidth;
      const height =
        store.state.preferences.maxResolutionHeight === undefined ? 1920 : store.state.preferences.maxResolutionHeight;
      this.el.sceneEl.maxCanvasSize = { width, height };
      this.el.sceneEl.resize();
    };
    this.onStoreChanged();
    store.addEventListener("statechanged", this.onStoreChanged);
  }
});
