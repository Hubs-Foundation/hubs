declare module "aframe" {
  import { Scene, Clock, Object3D, Mesh, WebGLRenderer } from "three";

  interface AElement extends HTMLElement {
    object3D: Object3D;
    object3DMap: {
      mesh: Mesh;
      [name: string]: Object3D;
    };
    getObject3D(string): Object3D?;
    components: { [s: string]: AComponent };
    eid: number;
    isPlaying: boolean;
  }

  type FnTick = (t: number, dt: number) => void;

  interface ASystem {
    init();
    tick: FnTick;
    tock: FnTick;
    remove();
    el: Scene;
  }

  interface AComponent {
    data: any;
    init();
    tick: FnTick;
    tock: FnTick;
    remove();
    el: AElement;
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

  interface PersonalSpaceInvader extends AComponent {
    enable(): void;
    disable(): void;
  }

  interface PersonalSpaceBubbleSystem extends ASystem {
    invaders: PersonalSpaceInvader[];
  }

  interface PenToolsSystem extends ASystem {
    myPen: AElement;
  }

  interface PenComponent extends AComponent {
    targets: Object3D[];
  }

  interface TransformSelectedObjectSystem extends ASystem {
    startTransform(targetObj: Object3D, handObj: Object3D, data: object): void;
    stopTransform(): void;
  }

  interface AScene extends AElement {
    object3D: Scene;
    renderStarted: boolean;
    renderer: WebGLRenderer;
    tick(time: number, delta: number): void;
    behaviors: {
      tick: AComponent[];
      tock: AComponent[];
    };
    systemNames: Array<keyof AScene["systems"]>;
    systems: {
      "hubs-systems": HubsSystems;
      "personal-space-bubble": PersonalSpaceBubbleSystem;
      "transform-selected-object": TransformSelectedObjectSystem;
      userinput: UserInputSystem;
      /** @deprecated see bit-interaction-system */
      interaction: InteractionSystem;
      nav: NavSystem;
      "pen-tools": PenToolsSystem;
    };
    emit(string, any?): void;
    addState(string): void;
    is(string): boolean;
  }

  interface Device {
    isMobileVR: Function;
  }
  interface Utils {
    device: Device;
  }

  declare global {
    const AFRAME: {
      registerSystem(name: string, def: Partial<ASystem>);
      registerComponent(name: string, def: Partial<AComponent>);
      scenes: AScene[];
      utils: Util;
    };
  }
}
