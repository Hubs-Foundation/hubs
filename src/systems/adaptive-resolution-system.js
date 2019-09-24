import qsTruthy from "../utils/qs_truthy";
import { paths } from "./userinput/paths";
const EPS = 0.001;
const ANIMATION_MS = 300;
const ULTRA_HIGH_FRAMERATE = 60;
const HIGH_FRAMERATE = 55;
const LOW_FRAMERATE = 50;
const ULTRA_LOW_FRAMERATE = 40;
const MIN_RESOLUTION_FACTOR = 0.20;
const enableAdaptiveResolution = qsTruthy("ar");

const lerp = function(a, b, t) {
  return THREE.Math.clamp(t * b + (1 - t) * a, a < b ? a : b, a < b ? b : a);
};

function easeOutQuadratic(t) {
  return t * (2 - t);
}

export class AdaptiveResolutionSystem {
  constructor() {
    this.reset(false);
    return this;
  }
  reset(reread = true) {
    this.resolutionFactor = 1;
    this.targetResolutionFactor = 1;
    this.resolutionFactorStartValue = 1;
    this.resolutionFactorStartTime = 0;
    this.lastFpsUpdate = 0;
    this.frameCount = 0;
    this.fps = 55;
  }
  tick(userinput, scene, t) {
    this.fps = this.fps || document.querySelector("[stats-plus]");
    this.t = t;

    const isLoading = scene.is("loader");
    if (isLoading) {
      scene.canvas.width = 1;
      scene.canvas.height = 1;
    } else {
      let resup = false;
      let resdown = false;
      if (enableAdaptiveResolution) {
        this.frameCount += 1;
        const now = performance.now();
        if (now >= this.lastFpsUpdate + 300) {
          this.fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
          this.lastFpsUpdate = now;
          this.frameCount = 0;
          resup = this.fps > HIGH_FRAMERATE;
          resdown = this.fps < LOW_FRAMERATE;
        }
      }
      if (resup || userinput.get(paths.actions.increaseResolution)) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
        this.targetResolutionFactor = Math.min(
          1,
          this.targetResolutionFactor + (this.fps < ULTRA_HIGH_FRAMERATE ? 0.01 : 0.15)
        );
      }
      if (resdown || userinput.get(paths.actions.decreaseResolution)) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
        this.targetResolutionFactor = Math.max(
          MIN_RESOLUTION_FACTOR,
          this.targetResolutionFactor - (this.fps < ULTRA_LOW_FRAMERATE ? 0.15 : 0.01)
        );
      }
      if (this.wasLoading) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
      }
      const progress = easeOutQuadratic(Math.min(1, (this.t - this.resolutionFactorStartTime) / ANIMATION_MS));
      this.resolutionFactor = lerp(this.resolutionFactorStartValue, this.targetResolutionFactor, progress);

      if (!scene.is("vr-mode")) {
        scene.canvas.width = this.resolutionFactor * window.innerWidth;
        scene.canvas.height = this.resolutionFactor * window.innerHeight;

        scene.canvas.style.width = scene.canvas.width;
        scene.canvas.style.height = scene.canvas.height;
        scene.renderer.setSize(scene.canvas.width, scene.canvas.height);
      }
    }
    this.wasLoading = isLoading;
  }
}
