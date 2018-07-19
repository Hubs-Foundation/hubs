import styles from "./networked-video-player.css";

const nafConnected = function() {
  return new Promise(resolve => {
    NAF.clientId ? resolve() : document.body.addEventListener("connected", resolve);
  });
};

/**
 * Instantiates and plays a network video stream, setting the video as the source material for this entity.
 * @namespace network
 * @component networked-video-player
 */
AFRAME.registerComponent("networked-video-player", {
  schema: {},
  async init() {
    await nafConnected();

    const networkedEl = await NAF.utils.getNetworkedEntity(this.el);
    if (!networkedEl) {
      throw new Error("Video player must be added on a node, or a child of a node, with the `networked` component.");
    }

    const ownerId = networkedEl.components.networked.data.owner;

    const qs = new URLSearchParams(location.search);
    const rejectScreenShares = !qs.has("accept_screen_shares");
    if (ownerId !== NAF.clientId && rejectScreenShares) {
      // Toggle material visibility since object visibility is network-synced
      // TODO: There ought to be a better way to disable network syncs on a remote entity
      this.el.setAttribute("material", { visible: false });
      return;
    }

    let container = document.getElementById("nvp-debug-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "nvp-debug-container";
      container.classList.add(styles.container);
      document.body.appendChild(container);
    }

    const stream = await NAF.connection.adapter.getMediaStream(ownerId, "video");
    if (!stream) {
      return;
    }

    const v = document.createElement("video");
    v.id = `nvp-video-${ownerId}`;
    // muted and autoplay so that more restrictive browsers (e.g. Safari on iOS) will actually play the video.
    v.muted = true;
    v.autoplay = true;
    v.playsInline = true;
    v.classList.add(styles.video);
    v.srcObject = new MediaStream(stream.getVideoTracks()); // We only want the video track so make a new MediaStream
    container.appendChild(v);
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
      this.videoEl.parentNode.removeChild(this.videoEl);
    }
  }
});
