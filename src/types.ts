import { AScene, HubsSystems } from "aframe";
import { App, HubsWorld } from "./app";
import { Permission } from "./prefabs/prefabs";
import { EntityDef } from "./utils/jsx-entity";
import { NetworkSchema } from "./utils/network-schemas";
import { EntityID } from "./utils/networking-types";
import { IComponent } from "bitecs";

export enum SystemOrderE {
  Setup = 0,
  PrePhysics = 100,
  PostPhysics = 200,
  BeforeMatricesUpdate = 300,
  BeforeRender = 400,
  AfterRender = 500
}

export type CoreSystemKeyT = keyof AScene["systems"];
export type HubsSystemKeyT = keyof HubsSystems;
export type SystemKeyT = CoreSystemKeyT | HubsSystemKeyT;

export enum SystemsE {
  PhysicsSystem = "physicsSystem",
  AudioSystem = "audioSystem",
  SoundEffectsSystem = "soundEffectsSystem",
  CameraSystem = "cameraSystem",
  CharacterControllerSystem = "characterController",
  WaypointSystem = "waypointSystem",
  UserInputSystem = "userinput",
  NavMesh = "nav"
}

export interface SystemT {
  (app: App): void;
}

export type ComponentDataT = {
  [key: string]: any;
};

export interface InflatorT {
  (world: HubsWorld, eid: EntityID, componentProps?: ComponentDataT): EntityID;
}

export interface InflatorParamT {
  id: string;
  inflator: InflatorT;
}

export type InflatorConfigT = {
  common?: InflatorParamT;
  jsx?: InflatorParamT;
  gltf?: InflatorParamT;
};

export enum PermissionE {
  SPAWN_CAMERA = "spawn_camera",
  SPAWN_AND_MOVE_MEDIA = "spawn_and_move_media",
  UPDATE_HUB = "update_hub",
  PIN_OBJECTS = "pin_objects",
  SPAWN_EMOJI = "spawn_emoji",
  AMPLIFY_AUDIO = "amplify_audio",
  FLY = "fly",
  VOICE_CHAT = "voice_chat",
  SPAWN_DRAWING = "spawn_drawing",
  TWEET = "tweet",
  KICK_USERS = "kick_users",
  MUTE_USERS = "mute_users"
}

export type PrefabTemplateFn = (params: ComponentDataT) => EntityDef;
export type PermissionT = Permission;
export type PrefabNameT = string;
export type PrefabDefinitionT = {
  permission: Permission;
  template: PrefabTemplateFn;
};
export interface PrefabConfigT {
  id: PrefabNameT;
  config: PrefabDefinitionT;
}

export type NetworkSchemaT = NetworkSchema;
export interface NetworkSchemaConfigT {
  component: IComponent;
  schema: NetworkSchemaT;
}
export type SystemConfigT = { system: SystemT; order: number };

export type ChatCommandCallbackFn = (app: App, args: string[]) => void;
export interface ChatCommandConfigT {
  id: string;
  command: ChatCommandCallbackFn;
}

export type SoundDefT = {
  id: number;
  url: string;
};

export enum InputSetsE {
  global = "global",
  inputFocused = "inputFocused",
  rightCursorHoveringOnPen = "rightCursorHoveringOnPen",
  rightCursorHoveringOnCamera = "rightCursorHoveringOnCamera",
  rightCursorHoveringOnInteractable = "rightCursorHoveringOnInteractable",
  rightCursorHoveringOnUI = "rightCursorHoveringOnUI",
  rightCursorHoveringOnVideo = "rightCursorHoveringOnVideo",
  rightCursorHoveringOnNothing = "rightCursorHoveringOnNothing",
  rightCursorHoldingPen = "rightCursorHoldingPen",
  rightCursorHoldingCamera = "rightCursorHoldingCamera",
  rightCursorHoldingInteractable = "rightCursorHoldingInteractable",
  rightCursorHoldingUI = "rightCursorHoldingUI",
  rightCursorHoldingNothing = "rightCursorHoldingNothing",
  leftCursorHoveringOnPen = "leftCursorHoveringOnPen",
  leftCursorHoveringOnCamera = "leftCursorHoveringOnCamera",
  leftCursorHoveringOnInteractable = "leftCursorHoveringOnInteractable",
  leftCursorHoveringOnUI = "leftCursorHoveringOnUI",
  leftCursorHoveringOnVideo = "leftCursorHoveringOnVideo",
  leftCursorHoveringOnNothing = "leftCursorHoveringOnNothing",
  leftCursorHoldingPen = "leftCursorHoldingPen",
  leftCursorHoldingCamera = "leftCursorHoldingCamera",
  leftCursorHoldingInteractable = "leftCursorHoldingInteractable",
  leftCursorHoldingUI = "leftCursorHoldingUI",
  leftCursorHoldingNothing = "leftCursorHoldingNothing",
  rightHandTeleporting = "rightHandTeleporting",
  rightHandHoveringOnPen = "rightHandHoveringOnPen",
  rightHandHoveringOnCamera = "rightHandHoveringOnCamera",
  rightHandHoveringOnInteractable = "rightHandHoveringOnInteractable",
  rightHandHoveringOnNothing = "rightHandHoveringOnNothing",
  rightHandHoldingPen = "rightHandHoldingPen",
  rightHandHoldingCamera = "rightHandHoldingCamera",
  rightHandHoldingInteractable = "rightHandHoldingInteractable",
  leftHandTeleporting = "leftHandTeleporting",
  leftHandHoveringOnPen = "leftHandHoveringOnPen",
  leftHandHoveringOnCamera = "leftHandHoveringOnCamera",
  leftHandHoveringOnInteractable = "leftHandHoveringOnInteractable",
  leftHandHoldingPen = "leftHandHoldingPen",
  leftHandHoldingCamera = "leftHandHoldingCamera",
  leftHandHoldingInteractable = "leftHandHoldingInteractable",
  leftHandHoveringOnNothing = "leftHandHoveringOnNothing",
  debugUserInput = "debugUserInput",
  inspecting = "inspecting"
}

export enum InputPathsE {
  noop = "noop",
  actions = "actions",
  haptics = "haptics",
  device = "device"
}

export enum InputDeviceE {
  Cardboard,
  Daydream,
  Gamepad,
  KeyboardMouse,
  OculusGo,
  OculusTouch,
  TouchScreen,
  Vive,
  WebXR,
  WindowsMixedReality,
  XboxController,
  GearVR,
  ViveCosmos,
  ViveFocusPlus,
  ViveWand,
  ValveIndex
}
