const hubsRegex = /https?:\/\/(hubs.local(:\d+)?|(smoke-)?hubs.mozilla.com)\/(\w+)\/?\S*/g;
const isHubsUrl = hubsRegex.test.bind(hubsRegex);

AFRAME.registerComponent("open-media-button", {
  init() {
    this.label = this.el.querySelector("[text]");

    this.updateSrc = () => {
      this.src = this.targetEl.components["media-loader"].data.src;
      this.label.setAttribute("text", "value", isHubsUrl(this.src) ? "visit" : "open link");
    };

    this.onClick = () => {
      const directNavigate = isHubsUrl(this.src);
      if (directNavigate) {
        location.href = this.src;
      } else {
        window.open(this.src);
      }
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
      this.targetEl.addEventListener("media_resolved", this.updateSrc, { once: true });
      this.updateSrc();
    });
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
