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
import type { HubsSystems } from "aframe";
import { Camera, Scene, WebGLRenderer } from "three";
import { HubsWorld } from "../app";

declare global {
  interface Window {
    $S: HubsSystems;
  }
}

const timeSystem = (world: HubsWorld) => {
  const { time } = world;
  const now = performance.now();
  time.delta = now - time.elapsed;
  time.elapsed = now;
  time.tick++;
};

// NOTE keeping this around since many things index into it to get a reference to a system. This will
// naturally burn down as we migrate things, so it is not worth going through and changing all of them.
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

    // NOTE think about if we need a spot to initialize new systems or if doing everything when
    // the module is loaded (or via things like preload()) is enough.

    window.$S = this;
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});

export function mainTick(xrFrame: XRFrame, renderer: WebGLRenderer, scene: Scene, camera: Camera) {
  const world = APP.world;

  const sceneEl = AFRAME.scenes[0];
  const aframeSystems = sceneEl.systems;
  const hubsSystems = aframeSystems["hubs-systems"];

  // NOTE this is now blocking execution of all components/systems, make sure that's not an issue
  if (!hubsSystems.DOMContentDidLoad) return;

  timeSystem(world);
  const t = world.time.elapsed;
  const dt = world.time.delta;

  // Tick AFrame components
  const tickComponents = sceneEl.behaviors.tick;
  for (let i = 0; i < tickComponents.length; i++) {
    if (!tickComponents[i].el.isPlaying) continue;
    tickComponents[i].tick(t, dt);
  }

  // TODO these should be inlined instead of looping so they can be ordered with respect to other systems,
  // but this will be a breaking change to third party devs unless we filter the ones we inline
  // aframeSystems["networked"].tick(t, dt);
  // aframeSystems["local-audio-analyser"].tick(t, dt);
  // aframeSystems["transform-selected-object"].tick(t, dt);
  // aframeSystems["nav"].tick(t, dt); // NOTE has no tick function, just state + utilities
  // aframeSystems["frame-scheduler"].tick(t, dt);
  // aframeSystems["personal-space-bubble"].tick(t, dt);
  // aframeSystems["permissions"].tick(t, dt); // NOTE has no tick or state, just utilities
  // aframeSystems["exit-on-blur"].tick(t, dt);
  // aframeSystems["auto-pixel-ratio"].tick(t, dt);
  // aframeSystems["idle-detector"].tick(t, dt);
  // aframeSystems["pen-tools"].tick(t, dt); // NOTE has no tick, just state + utilities
  // aframeSystems["userinput"].tick(t, dt); // NOTE has no tick, uses tick2
  // aframeSystems["userinput-debug"].tick(t, dt);
  // aframeSystems["ui-hotkeys"].tick(t, dt);
  // aframeSystems["tips"].tick(t, dt);
  // aframeSystems["interaction"].tick(t, dt); // NOTE has no tick, just state + utilities, should be considered deprecated as it has been replaced
  // // -- previous location of hubs-systems tick --
  // // NOTE anything that ran after hubs-sytems is now running earlier (before the rest of hubs-systems have run)
  // // the 3 we have don't have ticks so this is not an issue, but its possible 3rd party systems were registered after ours
  // aframeSystems["capture-system"].tick(t, dt); // NOTE has no tick, just state + utilities
  // aframeSystems["listed-media"].tick(t, dt); // NOTE has no tick, just state + utilities
  // aframeSystems["linked-media"].tick(t, dt); // NOTE has no tick, just state + utilities
  const systemNames = sceneEl.systemNames;
  for (let i = 0; i < systemNames.length; i++) {
    if (!aframeSystems[systemNames[i]].tick) continue;
    aframeSystems[systemNames[i]].tick(t, dt);
  }

  networkReceiveSystem(world);
  onOwnershipLost(world);
  mediaLoadingSystem(world);

  physicsCompatSystem(world);

  networkedTransformSystem(world);

  aframeSystems.userinput.tick2(xrFrame);

  interactionSystem(world, hubsSystems.cursorTargettingSystem, t, aframeSystems);

  buttonSystems(world);
  constraintsSystem(world, hubsSystems.physicsSystem);

  // We run hubsSystems earlier in the frame so things have a chance to override properties run by animations
  hubsSystems.animationMixerSystem.tick(dt);

  hubsSystems.characterController.tick(t, dt);
  hubsSystems.cursorTogglingSystem.tick(aframeSystems.interaction, aframeSystems.userinput, hubsSystems.el);
  hubsSystems.interactionSfxSystem.tick(
    aframeSystems.interaction,
    aframeSystems.userinput,
    hubsSystems.soundEffectsSystem
  );
  hubsSystems.superSpawnerSystem.tick();
  hubsSystems.emojiSystem.tick(t, aframeSystems.userinput);
  hubsSystems.cursorPoseTrackingSystem.tick();
  hubsSystems.hoverMenuSystem.tick();
  hubsSystems.positionAtBorderSystem.tick();
  // hubsSystems.constraintsSystem.tick();
  hubsSystems.twoPointStretchingSystem.tick();

  floatyObjectSystem(world);

  hubsSystems.holdableButtonSystem.tick();
  hubsSystems.hoverButtonSystem.tick();
  hubsSystems.drawingMenuSystem.tick();
  hubsSystems.hapticFeedbackSystem.tick(
    hubsSystems.twoPointStretchingSystem,
    false,
    false
    // TODO: didInteractLeftHubsSystemsFrame doesn't exist?
    // hubsSystems.singleActionButtonSystem.didInteractLeftHubsSystemsFrame,
    // hubsSystems.singleActionButtonSystem.didInteractRightHubsSystemsFrame
  );
  hubsSystems.soundEffectsSystem.tick();
  hubsSystems.scenePreviewCameraSystem.tick();
  hubsSystems.physicsSystem.tick(dt);
  hubsSystems.inspectYourselfSystem.tick(hubsSystems.el, aframeSystems.userinput, hubsSystems.cameraSystem);
  hubsSystems.cameraSystem.tick(hubsSystems.el, dt);
  cameraToolSystem(world);
  hubsSystems.waypointSystem.tick(t, dt);
  hubsSystems.menuAnimationSystem.tick(t);
  hubsSystems.spriteSystem.tick(t, dt);
  hubsSystems.uvScrollSystem.tick(dt);
  hubsSystems.shadowSystem.tick();
  videoMenuSystem(world, aframeSystems.userinput);
  videoSystem(world, hubsSystems.audioSystem);
  mediaFramesSystem(world);
  hubsSystems.audioZonesSystem.tick(hubsSystems.el);
  hubsSystems.gainSystem.tick();
  hubsSystems.nameTagSystem.tick();

  deleteEntitySystem(world, aframeSystems.userinput);
  destroyAtExtremeDistanceSystem(world);
  removeNetworkedObjectButtonSystem(world);
  removeObject3DSystem(world);

  // We run this late in the frame so that its the last thing to have an opinion about the scale of an object
  hubsSystems.boneVisibilitySystem.tick();

  networkSendSystem(world);

  renderer.render(scene, camera);

  // TODO inline invoking tocks instead of using onAfterRender registered in a-scene
}
