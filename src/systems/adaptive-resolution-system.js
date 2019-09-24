import qsTruthy from "../utils/qs_truthy";
import { paths } from "./userinput/paths";
const ANIMATION_MS = 120;
const EPS = 0.001;
const ULTRA_HIGH_FRAMERATE = 60;
const BACKGROUND_TIMEOUT = 15000;
const HIGH_FRAMERATE = 50;
const LOW_FRAMERATE = 36;
const ULTRA_LOW_FRAMERATE = 24;
const MIN_FRAMERATE = 8;
const MIN_FOREGROUND_RESOLUTION_FACTOR = 0.25;
const MIN_BACKGROUND_RESOLUTION_FACTOR = 0.02;
const enableAdaptiveResolution = qsTruthy("ar");

const lerp = function(a, b, t) {
  return THREE.Math.clamp(t * b + (1 - t) * a, a < b ? a : b, a < b ? b : a);
};

function easeOutQuadratic(t) {
  return t * (2 - t);
}

export class AdaptiveResolutionSystem {
  constructor() {
    this.resolutionFactor = 1;
    this.targetResolutionFactor = 1;
    this.resolutionFactorStartValue = 1;
    this.resolutionFactorStartTime = 0;
    this.lastFpsUpdate = 0;
    this.frameCount = 0;
    this.fps = 55;
  }
  tick(userinput, scene, t) {
    if (!enableAdaptiveResolution) {
      return;
    }
    this.fps = this.fps || document.querySelector("[stats-plus]");
    this.t = t;
    this.characterController =
      this.characterController || document.getElementById("avatar-rig").components["character-controller"];

    const isLoading = scene.is("loader");
    if (isLoading) {
      scene.canvas.width = 1;
      scene.canvas.height = 1;
    } else {
      this.frameCount += 1;
      const now = performance.now();
      if (now >= this.lastFpsUpdate + 500) {
        this.fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
        this.lastFpsUpdate = now;
        this.frameCount = 0;
      }
      const mayChangeResolution = this.t - this.resolutionFactorStartTime > 100;
      const userinput = scene.systems.userinput;
      const cameraDelta = userinput.get(
        scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta
      );
      const movedCameraThisFrame = cameraDelta && Math.abs(cameraDelta[0]) > EPS && Math.abs(cameraDelta[1]) > EPS;
      if (movedCameraThisFrame) {
        this.lastMovedCameraT = this.t;
      }
      this.didMoveCamera = this.didMoveCamera || movedCameraThisFrame;
      const timeSinceMovement =
        !scene.is("entered") && !this.didMoveCamera
          ? 0
          : this.t - Math.max(this.lastMovedCameraT, this.characterController.timeOfLastMovement);
      const resup =
        timeSinceMovement < BACKGROUND_TIMEOUT &&
        (userinput.get(paths.actions.increaseResolution) ||
          this.fps > HIGH_FRAMERATE ||
          (this.fps > LOW_FRAMERATE && timeSinceMovement > 50) ||
          (this.fps > ULTRA_LOW_FRAMERATE && timeSinceMovement > 100) ||
          (this.fps > MIN_FRAMERATE && timeSinceMovement > 150));
      if (mayChangeResolution && resup) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
        const dr =
          this.fps > ULTRA_HIGH_FRAMERATE
            ? 0.2
            : this.fps > HIGH_FRAMERATE
              ? 0.1
              : this.fps > LOW_FRAMERATE
                ? 0.06
                : this.fps > ULTRA_LOW_FRAMERATE
                  ? 0.03
                  : 0.01;
        this.targetResolutionFactor = Math.min(1, this.targetResolutionFactor + dr);
      }
      const resdown =
        !resup &&
        (userinput.get(paths.actions.decreaseResolution) ||
          this.fps < MIN_FRAMERATE ||
          (this.fps < ULTRA_LOW_FRAMERATE && (timeSinceMovement < 50 || timeSinceMovement > BACKGROUND_TIMEOUT)) ||
          (this.fps < LOW_FRAMERATE && timeSinceMovement < 50));
      if (mayChangeResolution && resdown) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
        const dr =
          this.fps < MIN_FRAMERATE
            ? 0.24
            : this.fps < ULTRA_LOW_FRAMERATE
              ? 0.16
              : this.fps < LOW_FRAMERATE
                ? 0.08
                : this.fps < HIGH_FRAMERATE
                  ? 0.04
                  : 0.02;

        this.targetResolutionFactor = Math.max(
          this.didMoveCamera && timeSinceMovement > BACKGROUND_TIMEOUT
            ? MIN_BACKGROUND_RESOLUTION_FACTOR
            : MIN_FOREGROUND_RESOLUTION_FACTOR,
          this.targetResolutionFactor - dr
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
