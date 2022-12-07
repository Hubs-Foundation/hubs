import { addComponent, addEntity, Component, ComponentType, hasComponent } from "bitecs";
import { preloadFont } from "troika-three-text";
import {
  $isStringType,
  CameraTool,
  ObjectMenu,
  CursorRaycastable,
  DestroyAtExtremeDistance,
  FloatyObject,
  HandCollisionTarget,
  Holdable,
  HoldableButton,
  HoverButton,
  MakeKinematicOnRelease,
  AnimationMixer,
  Networked,
  NetworkedTransform,
  Object3DTag,
  OffersHandConstraint,
  OffersRemoteConstraint,
  PhysicsShape,
  RemoteHoverTarget,
  Rigidbody,
  SingleActionButton,
  TextButton,
  NetworkedVideo,
  VideoMenu,
  VideoMenuItem,
  NotRemoteHoverTarget,
  Deletable,
  SceneLoader,
  NavMesh,
  SceneRoot,
  NetworkDebug
} from "../bit-components";
import { inflateMediaLoader } from "../inflators/media-loader";
import { inflateMediaFrame } from "../inflators/media-frame";
import { GrabbableParams, inflateGrabbable } from "../inflators/grabbable";
import { inflateImage } from "../inflators/image";
import { inflateVideo } from "../inflators/video";
import { inflateVideoLoader, VideoLoaderParams } from "../inflators/video-loader";
import { inflateImageLoader, ImageLoaderParams } from "../inflators/image-loader";
import { inflateModel, ModelParams } from "../inflators/model";
import { inflateSlice9 } from "../inflators/slice9";
import { inflateText } from "../inflators/text";
import { inflateEnvironmentSettings } from "../inflators/environment-settings";
import { inflateReflectionProbe, ReflectionProbeParams } from "../inflators/reflection-probe";
import { HubsWorld } from "../app";
import { Group, Object3D, Texture, VideoTexture } from "three";
import { AlphaMode } from "./create-image-mesh";
import { MediaLoaderParams } from "../inflators/media-loader";
import { preload } from "./preload";
import { DirectionalLightParams, inflateDirectionalLight } from "../inflators/directional-light";
import { ProjectionMode } from "./projection-mode";

preload(
  new Promise(resolve => {
    preloadFont(
      { characters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_<()>[]|0123456789" },
      resolve as () => void
    );
  })
);

const reservedAttrs = ["position", "rotation", "scale", "visible", "name", "layers"];

export class Ref {
  current: number | null;
  constructor() {
    this.current = null;
  }
}
export function createRef() {
  return new Ref();
}

export function resolveRef(world: HubsWorld, ref: Ref) {
  if (ref.current === null) {
    ref.current = addEntity(world);
  }
  return ref.current;
}

export type ArrayVec3 = [x: number, y: number, z: number];
export type Attrs = {
  position?: ArrayVec3;
  rotation?: ArrayVec3;
  scale?: ArrayVec3;
  visible?: boolean;
  name?: string;
  layers?: number;
  ref?: Ref;
};

export type EntityDef = {
  components: JSXComponentData;
  attrs: Attrs;
  children: EntityDef[];
  ref?: Ref;
};

function isReservedAttr(attr: string): attr is keyof Attrs {
  return reservedAttrs.includes(attr);
}

type ComponentFn = string | ((attrs: Attrs & JSXComponentData, children?: EntityDef[]) => EntityDef);
export function createElementEntity(
  tag: "entity" | ComponentFn,
  attrs: Attrs & JSXComponentData,
  ...children: EntityDef[]
): EntityDef {
  attrs = attrs || {};
  if (typeof tag === "function") {
    return tag(attrs, children);
  } else if (tag === "entity") {
    const outputAttrs: Attrs = {};
    const components: JSXComponentData & Attrs = {};
    let ref = undefined;

    for (const attr in attrs) {
      if (isReservedAttr(attr)) {
        outputAttrs[attr] = attrs[attr] as any;
      } else if (attr === "ref") {
        ref = attrs[attr];
      } else {
        // if jsx transformed the attr into attr: true, change it to attr: {}.
        const c = attr as keyof JSXComponentData;
        components[c] = attrs[c] === true ? {} : attrs[c];
      }
    }

    return {
      attrs: outputAttrs,
      components,
      children: children.flat(),
      ref
    };
  } else {
    throw new Error(`invalid tag "${tag}"`);
  }
}

export function addObject3DComponent(world: HubsWorld, eid: number, obj: Object3D) {
  if (hasComponent(world, Object3DTag, eid)) {
    throw new Error("Tried to add an object3D tag to an entity that already has one");
  }
  addComponent(world, Object3DTag, eid);
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  return eid;
}

export function swapObject3DComponent(world: HubsWorld, eid: number, obj: Object3D) {
  if (!hasComponent(world, Object3DTag, eid)) {
    throw new Error("Tried to swap Object3D aon an entity that does not have the object3D tag");
  }
  const oldObj = world.eid2obj.get(eid)!;
  oldObj.eid = 0;
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  return eid;
}

// TODO HACK gettting internal bitecs symbol, should expose an API to check a properties type
const $isEidType = Object.getOwnPropertySymbols(CameraTool.screenRef).find(s => s.description === "isEidType");

const createDefaultInflator = (C: Component, defaults = {}): InflatorFn => {
  return (world, eid, componentProps) => {
    componentProps = Object.assign({}, defaults, componentProps);
    addComponent(world, C, eid, true);
    Object.keys(componentProps).forEach(propName => {
      const prop = C[propName as keyof Component] as any;
      if (!prop) {
        console.error(`${propName} is not a valid property of`, C);
        return;
      }
      const value = componentProps[propName];
      if (prop[$isStringType]) {
        if (value && typeof value !== "string") {
          throw new TypeError(`Expected ${propName} to be a string, got an ${typeof value} (${value})`);
        }
        prop[eid] = APP.getSid(value);
      } else if (prop[$isEidType!]) {
        prop[eid] = resolveRef(world, value);
      } else {
        prop[eid] = value;
      }
    });
  };
};

interface InflatorFn {
  (world: HubsWorld, eid: number, componentProps: any): void;
}

// @TODO these properties should import types from their inflators
export interface ComponentData {
  directionalLight?: DirectionalLightParams;
  grabbable?: GrabbableParams;
}

export interface JSXComponentData extends ComponentData {
  slice9?: {
    size: [width: number, height: number];
    insets: [top: number, buttom: number, left: number, right: number];
    texture: Texture;
  };
  image?: {
    texture: Texture;
    ratio: number;
    projection: ProjectionMode;
    alphaMode: typeof AlphaMode.Blend | typeof AlphaMode.Mask | typeof AlphaMode.Opaque;
    cacheKey: string;
  };
  video?: {
    texture: VideoTexture;
    ratio: number;
    projection: ProjectionMode;
    autoPlay: boolean;
  };
  networkedVideo?: true;
  videoMenu?: {
    timeLabelRef: Ref;
    trackRef: Ref;
    headRef: Ref;
    playIndicatorRef: Ref;
    pauseIndicatorRef: Ref;
  };
  videoMenuItem?: true;
  cursorRaycastable?: true;
  remoteHoverTarget?: true;
  isNotRemoteHoverTarget?: true;
  handCollisionTarget?: true;
  offersRemoteConstraint?: true;
  offersHandConstraint?: true;
  singleActionButton?: true;
  holdableButton?: true;
  holdable?: true;
  deletable?: true;
  makeKinematicOnRelease?: true;
  destroyAtExtremeDistance?: true;

  // @TODO Define all the anys
  networked?: any;
  textButton?: any;
  hoverButton?: any;
  rigidbody?: any;
  physicsShape?: any;
  floatyObject?: any;
  networkedTransform?: any;
  objectMenu?: {
    pinButtonRef: Ref;
    cameraFocusButtonRef: Ref;
    cameraTrackButtonRef: Ref;
    removeButtonRef: Ref;
    dropButtonRef: Ref;
    inspectButtonRef: Ref;
    deserializeDrawingButtonRef: Ref;
    openLinkButtonRef: Ref;
    refreshButtonRef: Ref;
    cloneButtonRef: Ref;
    rotateButtonRef: Ref;
    mirrorButtonRef: Ref;
    scaleButtonRef: Ref;
  };
  cameraTool?: {
    snapMenuRef: Ref;
    nextButtonRef: Ref;
    prevButtonRef: Ref;
    snapRef: Ref;
    cancelRef: Ref;
    recVideoRef: Ref;
    screenRef: Ref;
    selfieScreenRef: Ref;
    cameraRef: Ref;
    countdownLblRef: Ref;
    captureDurLblRef: Ref;
    sndToggleRef: Ref;
  };
  animationMixer?: any;
  mediaLoader?: MediaLoaderParams;
  sceneRoot?: boolean;
  sceneLoader?: { src: string };
  mediaFrame?: any;
  object3D?: any;
  text?: any;
  model?: ModelParams;
  networkDebug?: boolean;
}

export interface GLTFComponentData extends ComponentData {
  video?: VideoLoaderParams;
  image?: ImageLoaderParams;
  environmentSettings?: any;
  reflectionProbe?: ReflectionProbeParams;
  navMesh?: boolean;
}

declare global {
  namespace createElementEntity.JSX {
    interface IntrinsicElements {
      entity: JSXComponentData &
        Attrs & {
          children?: IntrinsicElements[];
        };
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export const commonInflators: Required<{ [K in keyof ComponentData]: InflatorFn }> = {
  grabbable: inflateGrabbable,

  // inflators that create Object3Ds
  directionalLight: inflateDirectionalLight
};

const jsxInflators: Required<{ [K in keyof JSXComponentData]: InflatorFn }> = {
  ...commonInflators,
  cursorRaycastable: createDefaultInflator(CursorRaycastable),
  remoteHoverTarget: createDefaultInflator(RemoteHoverTarget),
  isNotRemoteHoverTarget: createDefaultInflator(NotRemoteHoverTarget),
  handCollisionTarget: createDefaultInflator(HandCollisionTarget),
  offersRemoteConstraint: createDefaultInflator(OffersRemoteConstraint),
  offersHandConstraint: createDefaultInflator(OffersHandConstraint),
  singleActionButton: createDefaultInflator(SingleActionButton),
  holdableButton: createDefaultInflator(HoldableButton),
  textButton: createDefaultInflator(TextButton),
  hoverButton: createDefaultInflator(HoverButton),
  holdable: createDefaultInflator(Holdable),
  deletable: createDefaultInflator(Deletable),
  rigidbody: createDefaultInflator(Rigidbody),
  physicsShape: createDefaultInflator(PhysicsShape),
  floatyObject: createDefaultInflator(FloatyObject),
  makeKinematicOnRelease: createDefaultInflator(MakeKinematicOnRelease),
  destroyAtExtremeDistance: createDefaultInflator(DestroyAtExtremeDistance),
  networkedTransform: createDefaultInflator(NetworkedTransform),
  networked: createDefaultInflator(Networked),
  objectMenu: createDefaultInflator(ObjectMenu),
  cameraTool: createDefaultInflator(CameraTool, { captureDurIdx: 1 }),
  animationMixer: createDefaultInflator(AnimationMixer),
  networkedVideo: createDefaultInflator(NetworkedVideo),
  videoMenu: createDefaultInflator(VideoMenu),
  videoMenuItem: createDefaultInflator(VideoMenuItem),
  sceneRoot: createDefaultInflator(SceneRoot),
  sceneLoader: createDefaultInflator(SceneLoader),
  networkDebug: createDefaultInflator(NetworkDebug),
  mediaLoader: inflateMediaLoader,

  // inflators that create Object3Ds
  mediaFrame: inflateMediaFrame,
  object3D: addObject3DComponent,
  slice9: inflateSlice9,
  text: inflateText,
  model: inflateModel,
  image: inflateImage,
  video: inflateVideo
};

export const gltfInflators: Required<{ [K in keyof GLTFComponentData]: InflatorFn }> = {
  ...commonInflators,
  video: inflateVideoLoader,
  image: inflateImageLoader,
  reflectionProbe: inflateReflectionProbe,
  navMesh: createDefaultInflator(NavMesh),
  environmentSettings: inflateEnvironmentSettings
};

function jsxInflatorExists(name: string): name is keyof JSXComponentData {
  return Object.prototype.hasOwnProperty.call(jsxInflators, name);
}

export function gltfInflatorExists(name: string): name is keyof GLTFComponentData {
  return Object.prototype.hasOwnProperty.call(gltfInflators, name);
}

export function renderAsEntity(world: HubsWorld, entityDef: EntityDef) {
  const eid = entityDef.ref ? resolveRef(world, entityDef.ref) : addEntity(world);
  Object.keys(entityDef.components).forEach(name => {
    if (!jsxInflatorExists(name)) {
      throw new Error(`Failed to inflate unknown component called ${name}`);
    }
    jsxInflators[name](world, eid, entityDef.components[name]);
  });

  let obj = world.eid2obj.get(eid);
  if (!obj) {
    obj = new Group();
    addObject3DComponent(world, eid, obj);
  }

  if (entityDef.attrs.position) {
    obj.position.fromArray(entityDef.attrs.position);
  }
  if (entityDef.attrs.rotation) {
    obj.rotation.fromArray(entityDef.attrs.rotation);
  }
  if (entityDef.attrs.scale) {
    obj.scale.fromArray(entityDef.attrs.scale);
  }
  if (entityDef.attrs.name) {
    obj.name = entityDef.attrs.name;
  }
  if (entityDef.attrs.layers !== undefined) {
    obj.layers.mask = entityDef.attrs.layers;
  }
  if (entityDef.attrs.visible !== undefined) {
    obj.visible = entityDef.attrs.visible;
  }
  entityDef.children.forEach(child => {
    const childEid = renderAsEntity(world, child);
    obj!.add(world.eid2obj.get(childEid)!);
  });
  return eid;
}
