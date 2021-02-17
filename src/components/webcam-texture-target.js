import { disposeTexture } from "../utils/material-utils";

AFRAME.registerComponent("webcam-texture-target", {
  schema: {
    src: { type: "string" }
  },

  getMaterial() {
    return (
      (this.el.object3DMap.skinnedmesh && this.el.object3DMap.skinnedmesh.material) ||
      (this.el.object3DMap.mesh && this.el.object3DMap.mesh.material) ||
      this.el.object3D.material
    );
  },

  init() {
    const material = this.getMaterial();
    this.originalTexture = material && material.map;
  },

  update(prevData) {
    const material = this.getMaterial();

    console.log({ src: this.data.src, material, prevSrc: prevData.src });

    if (!material) {
      return;
    }

    const src = this.data.src;

    if (prevData.src === src) {
      return;
    }

    if (src && src.startsWith("hubs://")) {
      const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now

      this.originalTexture = material.map;

      NAF.connection.adapter.getMediaStream(streamClientId, "video").then(stream => {
        if (src !== this.data.src) {
          // Prevent creating and loading video texture if the src changed while we were fetching the video stream.
          return;
        }

        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        // iOS Safari requires the autoplay attribute, or it won't play the video at all.
        video.autoplay = true;
        // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
        // allow the user to unmute it with an interaction in the unmute-video-button component.
        video.muted = AFRAME.utils.device.isIOS();
        video.preload = "auto";
        video.crossOrigin = "anonymous";
        video.srcObject = new MediaStream(stream.getVideoTracks());

        const texture = new THREE.VideoTexture(video);
        texture.flipY = false;
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        material.map = texture;
        material.needsUpdate = true;
      });
    } else {
      if (material.map && material.map !== this.originalTexture) {
        disposeTexture(material.map);
      }

      material.map = this.originalTexture;
      material.needsUpdate = true;
    }
  },

  remove() {
    const material = this.getMaterial();

    if (material.map && material.map !== this.originalTexture) {
      disposeTexture(material.map);
    }
  }
});
