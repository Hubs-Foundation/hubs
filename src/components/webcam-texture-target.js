AFRAME.registerComponent("webcam-texture-target", {
  schema: {
    src: { type: "string" }
  },
  init() {},

  update() {
    const src = this.data.src;

    if (src.startsWith("hubs://")) {
      const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now

      NAF.connection.adapter.getMediaStream(streamClientId, "video").then(stream => {
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

        this.el.object3D.traverse(obj => {
          const textureTargetComponent =
            obj.material?.userData.gltfExtensions?.MOZ_hubs_components?.["webcam-texture-target"];

          if (textureTargetComponent) {
            obj.material.map = texture;
          }
        });
      });
    }
  }
});
