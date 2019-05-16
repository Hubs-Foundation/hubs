import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { proxiedUrlFor } from "../utils/media-utils";
import { load } from "../utils/preload";
import cameraModelSrc from "../assets/camera_tool.glb";

AFRAME.registerSystem("hubs-systems", {
  init() {
    Promise.all([
      load(
        proxiedUrlFor("https://asset-bundles-prod.reticulum.io/interactables/DrawingPen/DrawingPen-34fb4aee27.gltf")
      ),
      load(cameraModelSrc)
    ]).then(([pen, camera]) => {
      this.el.renderer.compileAndUploadMaterials(this.el.object3D, this.el.camera, [pen, camera]);
    });

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
