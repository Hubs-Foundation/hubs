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
import { deleteEntitySystem } from "../bit-systems/delete-entity-system";
import type { AScene, ASystem, HubsSystems } from "aframe";
import { Camera, Scene, WebGLRenderer } from "three";
import { HubsWorld } from "../app";
import { sceneLoadingSystem } from "../bit-systems/scene-loading";
import { networkDebugSystem } from "../bit-systems/network-debug";
import qsTruthy from "../utils/qs_truthy";

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

interface ITickParams {
  world: HubsWorld;
  xrFrame: XRFrame;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  hubsSystems: any;
  aframeSystems: AScene["systems"];
  t: number;
  dt: number;
}

interface ISystemParams {
  init?: (hubsSystems: any) => void;
  tick?: (params: ITickParams) => void;
  remove?: (hubsSystems: any) => void;
}

interface ISystem {
  [key: string]: ISystemParams;
}

const Systems: ISystem = {
  ["audio-settings-system"]: {
    init: (hubsSystems: any) => (hubsSystems.audioSettingsSystem = new AudioSettingsSystem(hubsSystems.el))
  } as ISystemParams,
  ["network-receive-system"]: {
    tick: (params: ITickParams) => networkReceiveSystem(params.world)
  } as ISystemParams,
  ["on-ownership-lost"]: {
    tick: (params: ITickParams) => onOwnershipLost(params.world)
  } as ISystemParams,
  ["scene-loading-system"]: {
    init: (hubsSystems: any) => (hubsSystems.environmentSystem = new EnvironmentSystem(hubsSystems.el)),
    tick: (params: ITickParams) => sceneLoadingSystem(params.world, params.hubsSystems.environmentSystem)
  } as ISystemParams,
  ["media-loading-system"]: {
    tick: (params: ITickParams) => mediaLoadingSystem(params.world)
  } as ISystemParams,
  ["physics-compat-system"]: {
    tick: (params: ITickParams) => physicsCompatSystem(params.world)
  } as ISystemParams,
  ["networked-transform-system"]: {
    tick: (params: ITickParams) => networkedTransformSystem(params.world)
  } as ISystemParams,
  ["user-input"]: {
    tick: (params: ITickParams) => params.aframeSystems.userinput.tick2(params.xrFrame)
  } as ISystemParams,
  ["interaction-system"]: {
    init: (hubsSystems: any) => (hubsSystems.cursorTargettingSystem = new CursorTargettingSystem()),
    tick: (params: ITickParams) =>
      interactionSystem(params.world, params.hubsSystems.cursorTargettingSystem, params.t, params.aframeSystems),
    remove: (hubsSystems: any) => hubsSystems.cursorTargettingSystem.remove()
  } as ISystemParams,
  ["button-system"]: {
    tick: (params: ITickParams) => buttonSystems(params.world)
  } as ISystemParams,
  ["constraints-system"]: {
    tick: (params: ITickParams) => constraintsSystem(params.world, params.hubsSystems.physicsSystem)
  } as ISystemParams,
  // We run this earlier in the frame so things have a chance to override properties run by animations
  ["animation-mixer-system"]: {
    init: (hubsSystems: any) => (hubsSystems.animationMixerSystem = new AnimationMixerSystem()),
    tick: (params: ITickParams) => params.hubsSystems.animationMixerSystem.tick(params.dt)
  } as ISystemParams,
  ["character-controller-system"]: {
    init: (hubsSystems: any) => (hubsSystems.characterController = new CharacterControllerSystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.characterController.tick(params.t, params.dt)
  } as ISystemParams,
  ["cursor-toggling-system"]: {
    init: (hubsSystems: any) => (hubsSystems.cursorTogglingSystem = new CursorTogglingSystem()),
    tick: (params: ITickParams) =>
      params.hubsSystems.cursorTogglingSystem.tick(
        params.aframeSystems.interaction,
        params.aframeSystems.userinput,
        params.hubsSystems.el
      )
  } as ISystemParams,
  ["interaction-sfx-system"]: {
    init: (hubsSystems: any) => (hubsSystems.interactionSfxSystem = new InteractionSfxSystem()),
    tick: (params: ITickParams) =>
      params.hubsSystems.interactionSfxSystem.tick(
        params.aframeSystems.interaction,
        params.aframeSystems.userinput,
        params.hubsSystems.soundEffectsSystem
      )
  } as ISystemParams,
  ["super-spawner-system"]: {
    init: (hubsSystems: any) => (hubsSystems.superSpawnerSystem = new SuperSpawnerSystem()),
    tick: (params: ITickParams) => params.hubsSystems.superSpawnerSystem.tick()
  } as ISystemParams,
  ["emoji-system"]: {
    init: (hubsSystems: any) => (hubsSystems.emojiSystem = new EmojiSystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.emojiSystem.tick(params.t, params.aframeSystems.userinput)
  } as ISystemParams,
  ["cursor-pose-tracking-system"]: {
    init: (hubsSystems: any) => (hubsSystems.cursorPoseTrackingSystem = new CursorPoseTrackingSystem()),
    tick: (params: ITickParams) => params.hubsSystems.cursorPoseTrackingSystem.tick()
  } as ISystemParams,
  ["hover-menu-system"]: {
    init: (hubsSystems: any) => (hubsSystems.hoverMenuSystem = new HoverMenuSystem()),
    tick: (params: ITickParams) => params.hubsSystems.hoverMenuSystem.tick()
  } as ISystemParams,
  ["position-at-border-system"]: {
    init: (hubsSystems: any) => (hubsSystems.positionAtBorderSystem = new PositionAtBorderSystem()),
    tick: (params: ITickParams) => params.hubsSystems.positionAtBorderSystem.tick()
  } as ISystemParams,
  ["two-point-stretching-system"]: {
    init: (hubsSystems: any) => (hubsSystems.twoPointStretchingSystem = new TwoPointStretchingSystem()),
    tick: (params: ITickParams) => params.hubsSystems.twoPointStretchingSystem.tick()
  } as ISystemParams,
  ["floaty-object-system"]: {
    tick: (params: ITickParams) => floatyObjectSystem(params.world)
  } as ISystemParams,
  ["holdable-button-system"]: {
    init: (hubsSystems: any) => (hubsSystems.holdableButtonSystem = new HoldableButtonSystem()),
    tick: (params: ITickParams) => params.hubsSystems.holdableButtonSystem.tick()
  } as ISystemParams,
  ["hover-button-system"]: {
    init: (hubsSystems: any) => (hubsSystems.hoverButtonSystem = new HoverButtonSystem()),
    tick: (params: ITickParams) => params.hubsSystems.hoverButtonSystem.tick()
  } as ISystemParams,
  ["drawing-menu-system"]: {
    init: (hubsSystems: any) => (hubsSystems.drawingMenuSystem = new DrawingMenuSystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.drawingMenuSystem.tick()
  } as ISystemParams,
  ["heptic-feedback-system"]: {
    init: (hubsSystems: any) => (hubsSystems.hapticFeedbackSystem = new HapticFeedbackSystem()),
    tick: (params: ITickParams) =>
      params.hubsSystems.hapticFeedbackSystem.tick(
        params.hubsSystems.twoPointStretchingSystem,
        false,
        false
        // TODO: didInteractLeftHubsSystemsFrame doesn't exist?
        // hubsSystems.singleActionButtonSystem.didInteractLeftHubsSystemsFrame,
        // hubsSystems.singleActionButtonSystem.didInteractRightHubsSystemsFrame
      )
  } as ISystemParams,
  ["sound-effects-system"]: {
    init: (hubsSystems: any) => (hubsSystems.soundEffectsSystem = new SoundEffectsSystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.soundEffectsSystem.tick()
  } as ISystemParams,
  ["scene-camera-preview-system"]: {
    init: (hubsSystems: any) => (hubsSystems.scenePreviewCameraSystem = new ScenePreviewCameraSystem()),
    tick: (params: ITickParams) => params.hubsSystems.scenePreviewCameraSystem.tick()
  } as ISystemParams,
  ["physics-system"]: {
    init: (hubsSystems: any) => (hubsSystems.physicsSystem = new PhysicsSystem(hubsSystems.el.object3D)),
    tick: (params: ITickParams) => params.hubsSystems.physicsSystem.tick()
  } as ISystemParams,
  ["inspect-yourself-system"]: {
    init: (hubsSystems: any) => (hubsSystems.inspectYourselfSystem = new InspectYourselfSystem()),
    tick: (params: ITickParams) =>
      params.hubsSystems.inspectYourselfSystem.tick(
        params.hubsSystems.el,
        params.aframeSystems.userinput,
        params.hubsSystems.cameraSystem
      )
  } as ISystemParams,
  ["camera-system"]: {
    init: (hubsSystems: any) =>
      (hubsSystems.cameraSystem = new CameraSystem(hubsSystems.el.camera, hubsSystems.el.renderer)),
    tick: (params: ITickParams) => params.hubsSystems.cameraSystem.tick(params.hubsSystems.el, params.dt)
  } as ISystemParams,
  ["camera-tool-system"]: {
    tick: (params: ITickParams) => cameraToolSystem(params.world)
  } as ISystemParams,
  ["waypoint-system"]: {
    init: (hubsSystems: any) =>
      (hubsSystems.waypointSystem = new WaypointSystem(hubsSystems.el, hubsSystems.characterController)),
    tick: (params: ITickParams) => params.hubsSystems.waypointSystem.tick(params.t, params.dt)
  } as ISystemParams,
  ["menu-animation-system"]: {
    init: (hubsSystems: any) => (hubsSystems.menuAnimationSystem = new MenuAnimationSystem()),
    tick: (params: ITickParams) => params.hubsSystems.menuAnimationSystem.tick(params.t)
  } as ISystemParams,
  ["sprite-system"]: {
    init: (hubsSystems: any) => (hubsSystems.spriteSystem = new SpriteSystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.spriteSystem.tick(params.t, params.dt)
  } as ISystemParams,
  ["uv-scroll-system"]: {
    init: (hubsSystems: any) => (hubsSystems.uvScrollSystem = new UVScrollSystem()),
    tick: (params: ITickParams) => params.hubsSystems.uvScrollSystem.tick(params.dt)
  } as ISystemParams,
  ["shadows-system"]: {
    init: (hubsSystems: any) => (hubsSystems.shadowSystem = new ShadowSystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.shadowSystem.tick()
  } as ISystemParams,
  ["object-menu-system"]: {
    tick: (params: ITickParams) =>
      objectMenuSystem(params.world, AFRAME.scenes[0].is("frozen"), params.aframeSystems.userinput)
  } as ISystemParams,
  ["video-menu-system"]: {
    tick: (params: ITickParams) => videoMenuSystem(params.world, params.aframeSystems.userinput)
  } as ISystemParams,
  ["video-system"]: {
    init: (hubsSystems: any) => (hubsSystems.audioSystem = new AudioSystem(hubsSystems.el)),
    tick: (params: ITickParams) => videoSystem(params.world, params.hubsSystems.audioSystem)
  } as ISystemParams,
  ["media-frames-system"]: {
    tick: (params: ITickParams) => mediaFramesSystem(params.world)
  } as ISystemParams,
  ["audio-zones-system"]: {
    init: (hubsSystems: any) => (hubsSystems.audioZonesSystem = new AudioZonesSystem()),
    tick: (params: ITickParams) => params.hubsSystems.audioZonesSystem.tick(params.hubsSystems.el)
  } as ISystemParams,
  ["gain-system"]: {
    init: (hubsSystems: any) => (hubsSystems.gainSystem = new GainSystem()),
    tick: (params: ITickParams) => params.hubsSystems.gainSystem.tick()
  } as ISystemParams,
  ["name-tag-system"]: {
    init: (hubsSystems: any) => (hubsSystems.nameTagSystem = new NameTagVisibilitySystem(hubsSystems.el)),
    tick: (params: ITickParams) => params.hubsSystems.nameTagSystem.tick()
  } as ISystemParams,
  ["delete-entity-system"]: {
    tick: (params: ITickParams) => deleteEntitySystem(params.world, params.aframeSystems.userinput)
  } as ISystemParams,
  ["destroy-at-extreme-distance-system"]: {
    tick: (params: ITickParams) => destroyAtExtremeDistanceSystem(params.world)
  } as ISystemParams,
  ["remove-networked-object-button-system"]: {
    tick: (params: ITickParams) => removeNetworkedObjectButtonSystem(params.world)
  } as ISystemParams,
  ["remove-object-3d-system"]: {
    tick: (params: ITickParams) => removeObject3DSystem(params.world)
  } as ISystemParams,
  // We run this late in the frame so that its the last thing to have an opinion about the scale of an object
  ["bone-visibility-system"]: {
    init: (hubsSystems: any) => (hubsSystems.boneVisibilitySystem = new BoneVisibilitySystem()),
    tick: (params: ITickParams) => params.hubsSystems.boneVisibilitySystem.tick()
  } as ISystemParams,
  ["network-send-system"]: {
    tick: (params: ITickParams) => networkSendSystem(params.world)
  } as ISystemParams,
  ["network-debug-system"]: {
    tick: (params: ITickParams) => enableNetworkDebug && networkDebugSystem(params.world, params.scene)
  } as ISystemParams
};

// NOTE keeping this around since many things index into it to get a reference to a system. This will
// naturally burn down as we migrate things, so it is not worth going through and changing all of them.
AFRAME.registerSystem("hubs-systems", {
  init() {
    waitForDOMContentLoaded().then(() => {
      this.DOMContentDidLoad = true;
    });

    // Init systems
    for (const [name, funcs] of Object.entries(Systems)) {
      const { init } = funcs;
      APP.enabledSystems.has(name) && init && init(this);
    }

    window.$S = this;
  },

  remove() {
    // Remove systems
    for (const [name, funcs] of Object.entries(Systems)) {
      const { remove } = funcs;
      APP.enabledSystems.has(name) && remove && remove(this);
    }
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
  const tick = (name: keyof AScene["systems"]) => {
    if (!APP.enabledSystems.has(name) || !aframeSystems[name].tick) return;
    aframeSystems[name].tick(t, dt);
  };
  for (let i = 0; i < systemNames.length; i++) {
    tick(systemNames[i]);
  }

  for (const [name, funcs] of Object.entries(Systems)) {
    const { tick } = funcs;
    APP.enabledSystems.has(name) &&
      tick &&
      tick({
        world,
        xrFrame,
        renderer,
        scene,
        camera,
        hubsSystems,
        aframeSystems,
        t,
        dt
      });
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
