import { CursorTargettingSystem } from "./cursor-targetting-system";
import { PositionAtBorderSystem } from "../components/position-at-border";
import { BoneVisibilitySystem } from "../components/bone-visibility";
import { AnimationMixerSystem } from "../components/animation-mixer";
import { UVScrollSystem } from "../components/uv-scroll";
import { CursorTogglingSystem } from "./cursor-toggling-system";
import { PhysicsSystem } from "./physics-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { DrawingMenuSystem } from "./drawing-menu-system";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { ScenePreviewCameraSystem } from "./scene-preview-camera-system";
import { InteractionSfxSystem } from "./interaction-sfx-system";
import { SpriteSystem } from "./sprites";
import { CameraSystem } from "./camera-system";
import { WaypointSystem } from "./waypoint-system";
import { CharacterControllerSystem } from "./character-controller-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { CursorPoseTrackingSystem } from "./cursor-pose-tracking";
import { MenuAnimationSystem } from "./menu-animation-system";
import { AudioSettingsSystem } from "./audio-settings-system";
import { AudioSystem } from "./audio-system";
import { ShadowSystem } from "./shadow-system";
import { InspectYourselfSystem } from "./inspect-yourself-system";
import { EmojiSystem } from "./emoji-system";
import { AudioZonesSystem } from "./audio-zones-system";
import { GainSystem } from "./audio-gain-system";
import { EnvironmentSystem } from "./environment-system";
import { NameTagVisibilitySystem } from "./name-tag-visibility-system";

// new world
import { networkSendSystem, networkReceiveSystem } from "./netcode";
import { onOwnershipLost } from "./on-ownership-lost";
import { interactionSystem } from "./bit-interaction-system";
import { floatyObjectSystem } from "./floaty-object-system";
import { removeNetworkedObjectButtonSystem } from "./remove-networked-object-button-system";
import { removeObject3DSystem } from "./remove-object3D-system";
import { networkedTransformSystem } from "./networked-transform";
import { buttonSystems } from "./single-action-button-system";
import { constraintsSystem } from "./bit-constraints-system";
import { mediaFramesSystem } from "./bit-media-frames";
import { videoSystem } from "../bit-systems/video-system";
import { cameraToolSystem } from "../bit-systems/camera-tool";
import { mediaLoadingSystem } from "../bit-systems/media-loading";
// import { holdableButtonSystem } from "./holdable-button-system";
import { physicsCompatSystem } from "./bit-physics";
import { destroyAtExtremeDistanceSystem } from "./bit-destroy-at-extreme-distances";
import { videoMenuSystem } from "../bit-systems/video-menu-system";
import { deleteEntitySystem } from "../bit-systems/delete-entity-system";

AFRAME.registerSystem("hubs-systems", {
  init() {
    waitForDOMContentLoaded().then(() => {
      this.DOMContentDidLoad = true;
    });
    this.cursorTogglingSystem = new CursorTogglingSystem();
    this.interactionSfxSystem = new InteractionSfxSystem();
    this.superSpawnerSystem = new SuperSpawnerSystem();
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.positionAtBorderSystem = new PositionAtBorderSystem();
    this.physicsSystem = new PhysicsSystem(this.el.object3D);
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.hapticFeedbackSystem = new HapticFeedbackSystem();
    this.audioSystem = new AudioSystem(this.el);
    this.soundEffectsSystem = new SoundEffectsSystem(this.el);
    this.scenePreviewCameraSystem = new ScenePreviewCameraSystem();
    this.spriteSystem = new SpriteSystem(this.el);
    this.cameraSystem = new CameraSystem(this.el.camera, this.el.renderer);
    this.drawingMenuSystem = new DrawingMenuSystem(this.el);
    this.characterController = new CharacterControllerSystem(this.el);
    this.waypointSystem = new WaypointSystem(this.el, this.characterController);
    this.cursorPoseTrackingSystem = new CursorPoseTrackingSystem();
    this.menuAnimationSystem = new MenuAnimationSystem();
    this.audioSettingsSystem = new AudioSettingsSystem(this.el);
    this.animationMixerSystem = new AnimationMixerSystem();
    this.boneVisibilitySystem = new BoneVisibilitySystem();
    this.uvScrollSystem = new UVScrollSystem();
    this.shadowSystem = new ShadowSystem(this.el);
    this.inspectYourselfSystem = new InspectYourselfSystem();
    this.emojiSystem = new EmojiSystem(this.el);
    this.audioZonesSystem = new AudioZonesSystem();
    this.gainSystem = new GainSystem();
    this.environmentSystem = new EnvironmentSystem(this.el);
    this.nameTagSystem = new NameTagVisibilitySystem(this.el);

    window.$S = this;
  },

  tick(t, dt) {
    if (!this.DOMContentDidLoad) return;
    const world = APP.world;

    networkReceiveSystem(world);
    onOwnershipLost(world);
    mediaLoadingSystem(world);

    physicsCompatSystem(world);

    networkedTransformSystem(world);

    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();

    interactionSystem(world, this.cursorTargettingSystem, t, systems);

    buttonSystems(world);
    constraintsSystem(world, systems.userinput);

    // We run this earlier in the frame so things have a chance to override properties run by animations
    this.animationMixerSystem.tick(dt);

    this.characterController.tick(t, dt);
    this.cursorTogglingSystem.tick(systems.interaction, systems.userinput, this.el);
    this.interactionSfxSystem.tick(systems.interaction, systems.userinput, this.soundEffectsSystem);
    this.superSpawnerSystem.tick();
    this.emojiSystem.tick(t, systems.userinput);
    this.cursorPoseTrackingSystem.tick();
    this.hoverMenuSystem.tick();
    this.positionAtBorderSystem.tick();
    // this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();

    floatyObjectSystem(world);

    this.holdableButtonSystem.tick();
    this.hoverButtonSystem.tick();
    this.drawingMenuSystem.tick();
    this.hapticFeedbackSystem.tick(
      this.twoPointStretchingSystem,
      false,
      false
      // TODO: didInteractLeftThisFrame doesn't exist?
      // this.singleActionButtonSystem.didInteractLeftThisFrame,
      // this.singleActionButtonSystem.didInteractRightThisFrame
    );
    this.soundEffectsSystem.tick();
    this.scenePreviewCameraSystem.tick();
    this.physicsSystem.tick(dt);
    this.inspectYourselfSystem.tick(this.el, systems.userinput, this.cameraSystem);
    this.cameraSystem.tick(this.el, dt);
    cameraToolSystem(world);
    this.waypointSystem.tick(t, dt);
    this.menuAnimationSystem.tick(t);
    this.spriteSystem.tick(t, dt);
    this.uvScrollSystem.tick(dt);
    this.shadowSystem.tick();
    videoMenuSystem(world, systems.userinput);
    videoSystem(world, this.audioSystem);
    mediaFramesSystem(world);
    this.audioZonesSystem.tick(this.el);
    this.gainSystem.tick();
    this.nameTagSystem.tick();

    deleteEntitySystem(world, systems.userinput);
    destroyAtExtremeDistanceSystem(world);
    removeNetworkedObjectButtonSystem(world);
    removeObject3DSystem(world);

    // We run this late in the frame so that its the last thing to have an opinion about the scale of an object
    this.boneVisibilitySystem.tick();

    networkSendSystem(world);
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});
