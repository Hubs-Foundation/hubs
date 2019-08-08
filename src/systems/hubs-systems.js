import { CursorTargettingSystem } from "./cursor-targetting-system";
import { CursorTogglingSystem } from "./cursor-toggling-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { BatchManagerSystem } from "./render-manager-system";
import { LobbyCameraSystem } from "./lobby-camera-system";
import { InteractionSfxSystem } from "./interaction-sfx-system";
import { SpriteSystem } from "./sprites";
import { CameraSystem } from "./camera-system";

AFRAME.registerSystem("hubs-systems", {
  init() {
    this.cursorTogglingSystem = new CursorTogglingSystem();
    this.interactionSfxSystem = new InteractionSfxSystem();
    this.superSpawnerSystem = new SuperSpawnerSystem();
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.constraintsSystem = new ConstraintsSystem();
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.singleActionButtonSystem = new SingleActionButtonSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.hapticFeedbackSystem = new HapticFeedbackSystem();
    this.soundEffectsSystem = new SoundEffectsSystem();
    this.lobbyCameraSystem = new LobbyCameraSystem();
    this.batchManagerSystem = new BatchManagerSystem(this.el.sceneEl.object3D, this.el.sceneEl.renderer);
    this.spriteSystem = new SpriteSystem(this.el);
    this.cameraSystem = new CameraSystem();
  },

  tick(t) {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();
    systems.interaction.tick2();
    this.cursorTogglingSystem.tick(systems.interaction, systems.userinput, this.el);
    this.interactionSfxSystem.tick(systems.interaction, systems.userinput, this.soundEffectsSystem);
    this.superSpawnerSystem.tick();
    this.cursorTargettingSystem.tick(t);
    this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();
    this.singleActionButtonSystem.tick();
    this.holdableButtonSystem.tick();
    this.hoverButtonSystem.tick();
    this.hoverMenuSystem.tick();
    this.hapticFeedbackSystem.tick(
      this.twoPointStretchingSystem,
      this.singleActionButtonSystem.didInteractLeftThisFrame,
      this.singleActionButtonSystem.didInteractRightThisFrame
    );
    this.soundEffectsSystem.tick();
    this.lobbyCameraSystem.tick();
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});

const i = window.setInterval(() => {
  if (AFRAME.scenes[0] && AFRAME.scenes[0].systems && AFRAME.scenes[0].systems.physics) {
    AFRAME.registerSystem("post-physics", {
      init() {
        this.hubsSystems = this.el.sceneEl.systems["hubs-systems"];
      },
      tick(t, dt) {
        this.hubsSystems.spriteSystem.tick(t, dt);
        this.hubsSystems.batchManagerSystem.tick(t);
        this.hubsSystems.cameraSystem.tick();
      }
    });
    window.clearInterval(i);
  }
}, 1000);
