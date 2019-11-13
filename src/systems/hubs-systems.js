import { CursorTargettingSystem } from "./cursor-targetting-system";
import { CursorTogglingSystem } from "./cursor-toggling-system";
import { PhysicsSystem } from "./physics-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { DrawingMenuSystem } from "./drawing-menu-system";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { BatchManagerSystem } from "./render-manager-system";
import { LobbyCameraSystem } from "./lobby-camera-system";
import { InteractionSfxSystem } from "./interaction-sfx-system";
import { SpriteSystem } from "./sprites";
import { CameraSystem } from "./camera-system";
import { WaypointSystem } from "./waypoint-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";

AFRAME.registerSystem("hubs-systems", {
  init() {
    waitForDOMContentLoaded().then(() => {
      this.DOMContentDidLoad = true;
    });
    this.cursorTogglingSystem = new CursorTogglingSystem();
    this.interactionSfxSystem = new InteractionSfxSystem();
    this.superSpawnerSystem = new SuperSpawnerSystem();
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.physicsSystem = new PhysicsSystem(this.el.object3D);
    this.constraintsSystem = new ConstraintsSystem(this.physicsSystem);
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.singleActionButtonSystem = new SingleActionButtonSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.hapticFeedbackSystem = new HapticFeedbackSystem();
    this.soundEffectsSystem = new SoundEffectsSystem();
    this.lobbyCameraSystem = new LobbyCameraSystem();
    this.spriteSystem = new SpriteSystem(this.el);
    this.batchManagerSystem = new BatchManagerSystem(this.el.sceneEl.object3D, this.el.sceneEl.renderer);
    this.cameraSystem = new CameraSystem(this.batchManagerSystem);
    this.waypointSystem = new WaypointSystem(this.el);
    this.drawingMenuSystem = new DrawingMenuSystem(this.el.sceneEl);
  },

  tick(t, dt) {
    if (!this.DOMContentDidLoad) return;
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
    this.drawingMenuSystem.tick();
    this.hoverMenuSystem.tick();
    this.hapticFeedbackSystem.tick(
      this.twoPointStretchingSystem,
      this.singleActionButtonSystem.didInteractLeftThisFrame,
      this.singleActionButtonSystem.didInteractRightThisFrame
    );
    this.soundEffectsSystem.tick();
    this.lobbyCameraSystem.tick();
    this.physicsSystem.tick(dt);
    this.spriteSystem.tick(t, dt);
    this.batchManagerSystem.tick(t);
    this.cameraSystem.tick(this.el, dt);
    this.waypointSystem.tick(t, dt);
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});
