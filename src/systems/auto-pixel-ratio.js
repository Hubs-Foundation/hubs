// On high-DPI displays, measures the median FPS over time and reduces the
// pixelRatio if the FPS drops below a threshold.

const LOW_FPS_THRESHOLD = 30;
const HIGH_FPS_THRESHOLD = 48;
const SKIP_SECONDS_AFTER_SCENE_VISIBLE = 30;
const MEASUREMENT_PERIOD_SECONDS = 5;
const MIN_PIXEL_RATIO = 1;
const CHANGE_RATE = 1;
const NUM_TIMES_DECREASED_BEFORE_CHANGING_MAX_PIXEL_RATIO = 3;

AFRAME.registerSystem("auto-pixel-ratio", {
  init() {
    // For now let's only enabled this on macs, since they tend to have retina displays.
    // Note this test will also include iPads running iPadOS.
    this.enabled = window.devicePixelRatio > 1 && /macintosh/i.test(navigator.userAgent);
    this.deltas = [];
    this.secondsSinceMeasurementStart = 0;
    this.secondsSinceSceneVisible = 0;
    this.maxPixelRatio = window.devicePixelRatio;
    this.pixelRatioToTimesDecreased = {};

    this.disabledByPref = window.APP.store.state.preferences.disableAutoPixelRatio;
    this.onPreferenceChange = this.onPreferenceChange.bind(this);
    window.APP.store.addEventListener("statechanged", this.onPreferenceChange);
  },
  onPreferenceChange() {
    this.disabledByPref = window.APP.store.state.preferences.disableAutoPixelRatio;
  },
  tick(time, delta) {
    if (!this.enabled || this.disabledByPref || this.maxPixelRatio === MIN_PIXEL_RATIO) return;
    if (!this.el.is("visible")) return;
    if (this.secondsSinceSceneVisible < SKIP_SECONDS_AFTER_SCENE_VISIBLE) {
      this.secondsSinceSceneVisible += delta / 1000;
      return;
    }
    if (document.visibilityState === "hidden") return;

    this.deltas.push(delta);
    this.secondsSinceMeasurementStart += delta / 1000;

    if (this.secondsSinceMeasurementStart > MEASUREMENT_PERIOD_SECONDS) {
      this.deltas.sort();
      const medianDelta = this.deltas[Math.floor(this.deltas.length / 2)];
      const medianFps = 1000 / medianDelta;

      const currentPixelRatio = this.el.renderer.getPixelRatio();

      const shouldDecrease = currentPixelRatio > MIN_PIXEL_RATIO && medianFps < LOW_FPS_THRESHOLD;
      const shouldIncrease = currentPixelRatio < this.maxPixelRatio && medianFps > HIGH_FPS_THRESHOLD;
      if (shouldDecrease || shouldIncrease) {
        const newPixelRatio = currentPixelRatio + (CHANGE_RATE * shouldIncrease ? 1 : -1);
        console.info(
          `Hubs auto-pixel-ratio: Median FPS (${medianFps.toFixed()}) was ${
            shouldIncrease ? `above ${HIGH_FPS_THRESHOLD}` : `below ${LOW_FPS_THRESHOLD}`
          }. ` + `Adjusting pixel ratio to ${newPixelRatio}.`
        );
        this.el.renderer.setPixelRatio(newPixelRatio);
        if (shouldDecrease) {
          const timesDecreased = (this.pixelRatioToTimesDecreased[currentPixelRatio] || 0) + 1;
          this.pixelRatioToTimesDecreased[currentPixelRatio] = timesDecreased;
          if (timesDecreased >= NUM_TIMES_DECREASED_BEFORE_CHANGING_MAX_PIXEL_RATIO) {
            console.info(
              `Hubs auto-pixel-ratio: Attempts to maintain high frame rate with pixel ratio ${currentPixelRatio} failed ${timesDecreased} times and will not be attempted again. Lowering maximum pixel ratio to ${newPixelRatio}.`
            );
            this.maxPixelRatio = newPixelRatio;
          }
        }
      }

      // Clear deltas so that we start measuring a new median.
      this.deltas.length = 0;
      this.secondsSinceMeasurementStart = 0;
    }
  }
});
