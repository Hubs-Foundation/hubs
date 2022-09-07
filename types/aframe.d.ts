declare module "aframe" {
  import { Scene, Clock, Object3D, Mesh } from "three";

  interface AElement extends HTMLElement {
    object3D: Object3D;
    object3DMap: {
      mesh: Mesh;
      [name: string]: Object3D;
    };
    getObject3D(string): Object3D?;
  }

  interface ASystem {
    init?();
    tick?(t: number, dt: number);
    remove?();
  }

  interface HubsSystems extends ASystem {
    cursorTogglingSystem: CursorTogglingSystem;
    interactionSfxSystem: InteractionSfxSystem;
    superSpawnerSystem: SuperSpawnerSystem;
    cursorTargettingSystem: CursorTargettingSystem;
    positionAtBorderSystem: PositionAtBorderSystem;
    physicsSystem: PhysicsSystem;
    twoPointStretchingSystem: TwoPointStretchingSystem;
    holdableButtonSystem: HoldableButtonSystem;
    hoverButtonSystem: HoverButtonSystem;
    hoverMenuSystem: HoverMenuSystem;
    hapticFeedbackSystem: HapticFeedbackSystem;
    audioSystem: AudioSystem;
    soundEffectsSystem: SoundEffectsSystem;
    scenePreviewCameraSystem: ScenePreviewCameraSystem;
    spriteSystem: SpriteSystem;
    cameraSystem: CameraSystem;
    drawingMenuSystem: DrawingMenuSystem;
    characterController: CharacterControllerSystem;
    waypointSystem: WaypointSystem;
    cursorPoseTrackingSystem: CursorPoseTrackingSystem;
    menuAnimationSystem: MenuAnimationSystem;
    audioSettingsSystem: AudioSettingsSystem;
    animationMixerSystem: AnimationMixerSystem;
    boneVisibilitySystem: BoneVisibilitySystem;
    uvScrollSystem: UVScrollSystem;
    shadowSystem: ShadowSystem;
    inspectYourselfSystem: InspectYourselfSystem;
    emojiSystem: EmojiSystem;
    audioZonesSystem: AudioZonesSystem;
    gainSystem: GainSystem;
    environmentSystem: EnvironmentSystem;
    nameTagSystem: NameTagVisibilitySystem;
  }

  interface UserInputSystem extends ASystem {
    get<T>(path: string): T;
    toggleSet(set: string, value: boolean): T;
    tick2();
  }

  interface InteractionSystem extends ASystem {
    getActiveIntersection(): AElement;
    isHoldingAnything(pred: (AEntity) => boolean): boolean;
    isHeld(el: AElement): boolean;
    updateLegacyState();
  }

  interface AScene extends AElement {
    object3D: Scene;
    renderStarted: boolean;
    tick(time: number, delta: number): void;
    isPlaying: boolean;
    frame: XRFrame;
    clock: Clock;
    systems: {
      "hubs-systems": HubsSystems;
      userinput: UserInputSystem;
      /** @deprecated see bit-interaction-system */
      interaction: InteractionSystem;
    };
  }

  declare global {
    const AFRAME: {
      registerSystem: (name: string, def: ASystem) => void;
      scenes: AScene[];
    };
  }
}
