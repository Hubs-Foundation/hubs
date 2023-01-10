// Monkey patches three.js to stop doing texture uploads for paused videos
THREE.VideoTexture.prototype.update = function () {
  const video = this.image;
  const paused = video.paused;

  // Don't transfer textures from paused videos.
  if (paused && this.wasPaused) return;

  if (video.readyState >= video.HAVE_CURRENT_DATA) {
    if (paused) {
      this.wasPaused = true;
    } else if (this.wasPaused) {
      this.wasPaused = false;
    }

    this.needsUpdate = true;
  }
};
