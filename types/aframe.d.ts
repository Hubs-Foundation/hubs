declare module "aframe" {
  import { Scene, Clock, Object3D, Mesh } from "three";

  interface AElement extends HTMLElement {
    object3D: Object3D;
    object3DMap: {
      mesh: Mesh;
      [name: string]: Object3D;
    };
    getObject3D(string): Object3D?;
    components: { [s: string]: AComponent };
  }

  type FnTick = (t: number, dt: number) => void;

  interface ASystem {
    init();
    tick: FnTick;
    tock: FnTick;
    remove();
    el: AScene;
  }

  interface AComponent {
    init();
    tick: FnTick;
    tock: FnTick;
    remove();
    el: AScene;
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

    DOMContentDidLoad: bool;
  }

  interface UserInputSystem extends ASystem {
    get<T>(path: string): T;
    toggleSet(set: string, value: boolean): T;
    tick2(xrFrame: XRFrame);
  }

  interface InteractionSystem extends ASystem {
    getActiveIntersection(): AElement;
    isHoldingAnything(pred: (AEntity) => boolean): boolean;
    isHeld(el: AElement): boolean;
    updateLegacyState();
  }

  interface NavSystem extends ASystem {
    loadMesh(mesh: Mesh, zone: string);
    mesh?: Mesh;
  }

  interface AScene extends AElement {
    object3D: Scene;
    renderStarted: boolean;
    tick(time: number, delta: number): void;
    isPlaying: boolean;
    behaviors: {
      tick: AComponent[];
      tock: AComponent[];
    };
    systemNames: Array<keyof AScene["systems"]>;
    systems: {
      "hubs-systems": HubsSystems;
      userinput: UserInputSystem;
      /** @deprecated see bit-interaction-system */
      interaction: InteractionSystem;
      nav: NavSystem;
    };
    emit(string, any): void;
    addState(string): void;
    is(string): boolean;
  }

  declare global {
    const AFRAME: {
      registerSystem(name: string, def: Partial<ASystem>);
      scenes: AScene[];
    };
  }
}
