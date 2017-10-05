// @TODO break this up into 2 components
// 1. a component that just adds an analyser node and reads audio data
// 2. a component that uses the other component's data to apply some effect
// Communication either happens by dispatching some event or by component 2 directly reading componet 1
AFRAME.registerComponent("audio-feedback", {
  schema: {
    audioSource: { type: "selector" }
  },
  init: function() {
    // @TODO using an arbitrary timeout here which is very bad. Needs to wait on model loading and audio source being connected
    setTimeout(() => {
      const audioComponent = (this.data.audioSource || this.el).components[
        "networked-audio-source"
      ];

      const audioSource = audioComponent && audioComponent.sound;
      if (!audioSource) return;

      this.mat = this.el.object3D.getObjectByName(
        "DodecAvatar_Head_0"
      ).material;

      this.analyser = audioSource.context.createAnalyser();
      this.levels = new Uint8Array(this.analyser.frequencyBinCount);
      audioSource.disconnect();
      audioSource.setFilter(this.analyser);
      audioSource.connect();
      console.log(audioSource.filters, audioSource.isPlaying);
    }, 5000);
  },

  tick: function() {
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.levels);

    var sum = 0;
    for (var i = 0; i < this.levels.length; i++) {
      sum += this.levels[i];
    }
    this.volume = sum / this.levels.length;
    this.mat.color.setScalar(1 + this.volume / 255 * 2);
    this.el.object3D.scale.setScalar(1 + this.volume / 255);
  }
});
