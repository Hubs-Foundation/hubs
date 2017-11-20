import styles from "./networked-video-player.css";

const nafConnected = function() {
  return new Promise(resolve => {
    NAF.clientId
      ? resolve()
      : document.body.addEventListener("connected", resolve);
  });
};
AFRAME.registerComponent("networked-video-player", {
  schema: {},
  async init() {
    await nafConnected();

    const networkedEl = NAF.utils.getNetworkedEntity(this.el);
    if (!networkedEl) {
      throw new Error(
        "Video player must be added on a node, or a child of a node, with the `networked` component."
      );
    }

    const ownerId = networkedEl.components.networked.data.owner;

    const stream = await NAF.connection.adapter.getMediaStream(ownerId);

    if (!stream) {
      return;
    }

    const v = document.createElement("video");
    v.classList.add(styles.video);
    v.srcObject = stream;
    document.body.appendChild(v);
    v.play();

    this.videoEl = v;

    v.onloadedmetadata = () => {
      const ratio = v.videoWidth / v.videoHeight;
      this.el.setAttribute("geometry", {
        width: ratio * 1,
        height: 1
      });
      this.el.setAttribute("material", "src", v);
    };
  },

  remove() {
    if (this.videoEl) {
      this.videoEl.parent.removeChild(this.videoEl);
    }
  }
});
