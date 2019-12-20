// On high-DPI displays, measures the median FPS over time and reduces the
// pixelRatio if the FPS drops below a threshold.

const FPS_THRESHOLD = 50;
const SKIP_SECONDS_AFTER_SCENE_VISIBLE = 30;
const MEASUREMENT_PERIOD_SECONDS = 5;
const MIN_PIXEL_RATIO = 1;

AFRAME.registerSystem("auto-pixel-ratio", {
  init() {
    // For now let's only enabled this on macs, since they tend to have retina displays.
    // Note this test will also include iPads running iPadOS.
    this.enabled = window.devicePixelRatio > 1 && /macintosh/i.test(navigator.userAgent);
    this.deltas = [];
    this.secondsSinceMeasurementStart = 0;
    this.secondsSinceSceneVisible = 0;
  },
  tick(time, delta) {
    if (!this.enabled) return;
    if (!this.el.is("visible")) return;
    if (this.secondsSinceSceneVisible < SKIP_SECONDS_AFTER_SCENE_VISIBLE) {
      this.secondsSinceSceneVisible += delta / 1000;
      return;
    }

    this.deltas.push(delta);
    this.secondsSinceMeasurementStart += delta / 1000;

    if (this.secondsSinceMeasurementStart > MEASUREMENT_PERIOD_SECONDS) {
      this.deltas.sort();
      const medianDelta = this.deltas[Math.floor(this.deltas.length / 2)];
      const medianFps = 1000 / medianDelta;

      if (medianFps < FPS_THRESHOLD) {
        const newPixelRatio = this.el.renderer.getPixelRatio() - 1;
        console.info(
          `Hubs auto-pixel-ratio: Median FPS (${medianFps.toFixed()}) was below ${FPS_THRESHOLD}. ` +
            `Reducing pixel ratio to ${newPixelRatio}.`
        );
        this.el.renderer.setPixelRatio(newPixelRatio);

        if (newPixelRatio <= MIN_PIXEL_RATIO) {
          this.enabled = false;
        }
      }

      // Clear deltas so that we start measuring a new median.
      this.deltas.length = 0;
      this.secondsSinceMeasurementStart = 0;
    }
  }
});
