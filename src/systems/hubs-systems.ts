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
import { networkReceiveSystem } from "../bit-systems/network-receive-system";
import { networkSendSystem } from "../bit-systems/network-send-system";
import { entityPersistenceSystem } from "../bit-systems/entity-persistence-system";
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
import { objectMenuSystem } from "../bit-systems/object-menu";
import { pdfMenuSystem } from "../bit-systems/pdf-menu-system";
import { linkHoverMenuSystem } from "../bit-systems/link-hover-menu";
import { deleteEntitySystem } from "../bit-systems/delete-entity-system";
import type { HubsSystems } from "aframe";
import { Camera, Scene, WebGLRenderer } from "three";
import { HubsWorld } from "../app";
import { sceneLoadingSystem } from "../bit-systems/scene-loading";
import { networkDebugSystem } from "../bit-systems/network-debug";
import qsTruthy from "../utils/qs_truthy";
import { waypointSystem } from "../bit-systems/waypoint";
import { objectSpawnerSystem } from "../bit-systems/object-spawner";
import { billboardSystem } from "../bit-systems/billboard";
import { videoTextureSystem } from "../bit-systems/video-texture";
import { uvScrollSystem } from "../bit-systems/uv-scroll";
import { simpleWaterSystem } from "../bit-systems/simple-water";
import { pdfSystem } from "../bit-systems/pdf-system";
import { particleEmitterSystem } from "../bit-systems/particle-emitter";
import { audioEmitterSystem } from "../bit-systems/audio-emitter-system";
import { audioZoneSystem } from "../bit-systems/audio-zone-system";
import { audioDebugSystem } from "../bit-systems/audio-debug-system";
import { textSystem } from "../bit-systems/text";
import { audioTargetSystem } from "../bit-systems/audio-target-system";
import { scenePreviewCameraSystem } from "../bit-systems/scene-preview-camera-system";
import { linearTransformSystem } from "../bit-systems/linear-transform";
import { quackSystem } from "../bit-systems/quack";
import { mixerAnimatableSystem } from "../bit-systems/mixer-animatable";
import { loopAnimationSystem } from "../bit-systems/loop-animation";
import { linkSystem } from "../bit-systems/link-system";
import { objectMenuTransformSystem } from "../bit-systems/object-menu-transform-system";
import { bitPenCompatSystem } from "./bit-pen-system";
import { sfxButtonSystem } from "../bit-systems/sfx-button-system";
import { sfxMediaSystem } from "../bit-systems/sfx-media-system";
import { hoverableVisualsSystem } from "../bit-systems/hoverable-visuals-system";
import { linkedMenuSystem } from "../bit-systems/linked-menu-system";
import { followInFovSystem } from "../bit-systems/follow-in-fov-system";
import { linkedMediaSystem } from "../bit-systems/linked-media-system";
import { linkedVideoSystem } from "../bit-systems/linked-video-system";
import { linkedPDFSystem } from "../bit-systems/linked-pdf-system";
import { inspectSystem } from "../bit-systems/inspect-system";
import { snapMediaSystem } from "../bit-systems/snap-media-system";
import { scaleWhenGrabbedSystem } from "../bit-systems/scale-when-grabbed-system";
import { interactableSystem } from "../bit-systems/interactable-system";

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

const enableNetworkDebug = qsTruthy("networkDebug");

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

  // TODO does anything actually ever pause the scene?
  if (!sceneEl.isPlaying && !hubsSystems.DOMContentDidLoad) return;

  timeSystem(world);
  const t = world.time.elapsed;
  const dt = world.time.delta;

  // Tick AFrame components
  const tickComponents = sceneEl.behaviors.tick;
  for (let i = 0; i < tickComponents.length; i++) {
    if (!tickComponents[i].el.isPlaying) continue;
    tickComponents[i].tick(t, dt);
  }

  // Run order of this loop, based on module load order
  // NOTE these could be inlined instead of looping but that would be a breakings change
  // to third part devs. This will also just naturally burndown as we migrate.
  // aframeSystems["networked"].tick(t, dt);
  // aframeSystems["local-audio-analyser"].tick(t, dt);
  // aframeSystems["transform-selected-object"].tick(t, dt);
  // aframeSystems["frame-scheduler"].tick(t, dt);
  // aframeSystems["personal-space-bubble"].tick(t, dt);
  // aframeSystems["exit-on-blur"].tick(t, dt);
  // aframeSystems["auto-pixel-ratio"].tick(t, dt);
  // aframeSystems["idle-detector"].tick(t, dt);
  // aframeSystems["userinput-debug"].tick(t, dt);
  // aframeSystems["ui-hotkeys"].tick(t, dt);
  // aframeSystems["tips"].tick(t, dt);
  const systemNames = sceneEl.systemNames;
  for (let i = 0; i < systemNames.length; i++) {
    if (!aframeSystems[systemNames[i]].tick) continue;
    aframeSystems[systemNames[i]].tick(t, dt);
  }

  networkReceiveSystem(world);
  onOwnershipLost(world);
  sceneLoadingSystem(world, hubsSystems.environmentSystem, hubsSystems.characterController);
  mediaLoadingSystem(world);
  sfxMediaSystem(world, aframeSystems["hubs-systems"].soundEffectsSystem);

  networkedTransformSystem(world);

  aframeSystems.userinput.tick2(xrFrame);

  interactionSystem(world, hubsSystems.cursorTargettingSystem, t, aframeSystems);

  buttonSystems(world);
  sfxButtonSystem(world, aframeSystems["hubs-systems"].soundEffectsSystem);

  physicsCompatSystem(world, hubsSystems.physicsSystem);
  hubsSystems.physicsSystem.tick(dt);
  constraintsSystem(world, hubsSystems.physicsSystem);
  floatyObjectSystem(world);

  hoverableVisualsSystem(world);

  // We run this earlier in the frame so things have a chance to override properties run by animations
  hubsSystems.animationMixerSystem.tick(dt);

  billboardSystem(world, hubsSystems.cameraSystem.viewingCamera);
  particleEmitterSystem(world);
  waypointSystem(world, hubsSystems.characterController, sceneEl.is("frozen"));
  hubsSystems.characterController.tick(t, dt);
  hubsSystems.cursorTogglingSystem.tick(aframeSystems.interaction, aframeSystems.userinput, hubsSystems.el);
  hubsSystems.interactionSfxSystem.tick(
    aframeSystems.interaction,
    aframeSystems.userinput,
    hubsSystems.soundEffectsSystem
  );
  hubsSystems.superSpawnerSystem.tick();
  objectSpawnerSystem(world);
  hubsSystems.emojiSystem.tick(t, aframeSystems.userinput);
  hubsSystems.cursorPoseTrackingSystem.tick();
  hubsSystems.hoverMenuSystem.tick();
  hubsSystems.positionAtBorderSystem.tick();
  hubsSystems.twoPointStretchingSystem.tick();
  interactableSystem(world);

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
  scenePreviewCameraSystem(world, hubsSystems.cameraSystem);
  hubsSystems.inspectYourselfSystem.tick(hubsSystems.el, aframeSystems.userinput, hubsSystems.cameraSystem);
  hubsSystems.cameraSystem.tick(hubsSystems.el, dt);
  cameraToolSystem(world);
  hubsSystems.waypointSystem.tick(t, dt);
  hubsSystems.menuAnimationSystem.tick(t);
  hubsSystems.spriteSystem.tick(t, dt);
  hubsSystems.uvScrollSystem.tick(dt);
  uvScrollSystem(world);
  hubsSystems.shadowSystem.tick();
  objectMenuSystem(world, sceneEl.is("frozen"), APP.hubChannel!);
  linkedMenuSystem(world);
  videoMenuSystem(world, aframeSystems.userinput, sceneEl.is("frozen"));
  videoSystem(world, hubsSystems.audioSystem);
  pdfMenuSystem(world, sceneEl.is("frozen"));
  linkSystem(world);
  linkHoverMenuSystem(world, sceneEl.is("frozen"));
  pdfSystem(world);
  mediaFramesSystem(world, hubsSystems.physicsSystem);
  hubsSystems.audioZonesSystem.tick(hubsSystems.el);
  audioZoneSystem(world);
  audioEmitterSystem(world, hubsSystems.audioSystem);
  audioTargetSystem(world, hubsSystems.audioSystem);
  hubsSystems.gainSystem.tick();
  hubsSystems.nameTagSystem.tick();
  simpleWaterSystem(world);
  linearTransformSystem(world);
  quackSystem(world);
  followInFovSystem(world);
  linkedMediaSystem(world);
  linkedVideoSystem(world);
  linkedPDFSystem(world);
  inspectSystem(world, hubsSystems.cameraSystem);
  scaleWhenGrabbedSystem(world, aframeSystems.userinput);

  objectMenuTransformSystem(world);

  mixerAnimatableSystem(world);
  loopAnimationSystem(world);

  // All systems that update text properties should run before this
  textSystem(world);

  videoTextureSystem(world);
  audioDebugSystem(world);

  bitPenCompatSystem(world, aframeSystems["pen-tools"]);
  snapMediaSystem(world, aframeSystems["hubs-systems"].soundEffectsSystem);

  deleteEntitySystem(world, aframeSystems.userinput);
  destroyAtExtremeDistanceSystem(world);
  removeNetworkedObjectButtonSystem(world);
  removeObject3DSystem(world);

  // We run this late in the frame so that its the last thing to have an opinion about the scale of an object
  hubsSystems.boneVisibilitySystem.tick();

  entityPersistenceSystem(world, APP.hubChannel!);
  networkSendSystem(world);

  if (enableNetworkDebug) {
    networkDebugSystem(world, scene);
  }

  scene.updateMatrixWorld();

  renderer.info.reset();
  if (APP.fx.composer) {
    APP.fx.composer.render();
  } else {
    renderer.render(scene, camera);
  }

  // tock()s on components and system will fire here. (As well as any other time render() is called without unbinding onAfterRender)
  // TODO inline invoking tocks instead of using onAfterRender registered in a-scene
}
