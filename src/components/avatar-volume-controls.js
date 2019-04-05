import { VOLUME_LABELS } from "./media-views";

AFRAME.registerComponent("avatar-volume-controls", {
  schema: {
    volume: { type: "number", default: 1.0 }
  },

  init() {
    this.volumeUp = this.volumeUp.bind(this);
    this.volumeDown = this.volumeDown.bind(this);
    this.changeVolumeBy = this.changeVolumeBy.bind(this);
    this.volumeUpButton = this.el.querySelector(".avatar-volume-up-button");
    this.volumeDownButton = this.el.querySelector(".avatar-volume-down-button");
    this.volumeLabel = this.el.querySelector(".avatar-volume-label");
    this.volumeUpButton.object3D.addEventListener("interact", this.volumeUp);
    this.volumeDownButton.object3D.addEventListener("interact", this.volumeDown);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      const source = networkedEl.querySelector("[networked-audio-source]");
      this.audio = source.components["networked-audio-source"].sound;
      this.update();
    });

    this.updateVolumeLabel();
  },

  changeVolumeBy(v) {
    this.el.setAttribute("avatar-volume-controls", "volume", THREE.Math.clamp(this.data.volume + v, 0, 1));
    this.updateVolumeLabel();
  },

  volumeUp() {
    this.changeVolumeBy(0.1);
  },

  volumeDown() {
    this.changeVolumeBy(-0.1);
  },

  update() {
    if (this.audio) {
      this.audio.gain.gain.value = this.data.volume;
    }
  },

  updateVolumeLabel() {
    this.volumeLabel.setAttribute(
      "text",
      "value",
      this.data.volume === 0 ? "Muted" : VOLUME_LABELS[Math.floor(this.data.volume / 0.05)]
    );
  }
});
