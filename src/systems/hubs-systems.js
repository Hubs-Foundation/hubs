import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { proxiedUrlFor } from "../utils/media-utils";
import { load, prepareForRender } from "../utils/preload";
import cameraModelSrc from "../assets/camera_tool.glb";

function preloadPenAndCamera(sceneEl) {
  // Must wait for environment to load or else lights will uninitialized,
  // and material programs will later be regenerated
  sceneEl.addEventListener("first-environment-loaded", async () => {
    const objects = [];

    const pen = await load(
      proxiedUrlFor("https://asset-bundles-prod.reticulum.io/interactables/DrawingPen/DrawingPen-34fb4aee27.gltf")
    );
    pen.traverse(o => objects.push(o));

    const camera = await load(cameraModelSrc);
    camera.traverse(o => objects.push(o));

    prepareForRender(sceneEl, objects);
  });
}

AFRAME.registerSystem("hubs-systems", {
  init() {
    preloadPenAndCamera(this.el);

    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.constraintsSystem = new ConstraintsSystem();
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.singleActionButtonSystem = new SingleActionButtonSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.superSpawnerSystem = new SuperSpawnerSystem();
    this.hapticFeedbackSystem = new HapticFeedbackSystem();
    this.soundEffectsSystem = new SoundEffectsSystem();
  },

  tick(t) {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();
    systems.interaction.tick2(this.soundEffectsSystem);
    this.superSpawnerSystem.tick();
    this.cursorTargettingSystem.tick(t);
    this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();
    this.singleActionButtonSystem.tick();
    this.holdableButtonSystem.tick();
    this.hoverButtonSystem.tick();
    this.hoverMenuSystem.tick();
    this.hapticFeedbackSystem.tick(this.twoPointStretchingSystem, this.singleActionButtonSystem.didInteractThisFrame);
    this.soundEffectsSystem.tick();
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});
