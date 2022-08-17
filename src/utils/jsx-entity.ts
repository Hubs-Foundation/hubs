import { addComponent, addEntity, Component, ComponentType, hasComponent } from "bitecs";
import { preloadFont } from "troika-three-text";
import {
  $isStringType,
  CameraTool,
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
  VideoMenuItem
} from "../bit-components";
import { inflateMediaLoader } from "../inflators/media-loader";
import { inflateMediaFrame } from "../inflators/media-frame";
import { inflateGrabbable } from "../inflators/grabbable";
import { inflateImage } from "../inflators/image";
import { inflateVideo } from "../inflators/video";
import { inflateModel } from "../inflators/model";
import { inflateSlice9 } from "../inflators/slice9";
import { inflateText } from "../inflators/text";
import { HubsWorld } from "../app";
import { Object3D, Texture, VideoTexture } from "three";

// TODO we should do this in a more explicit spot for "preloading" during the loading screen
preloadFont({ characters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_<()>[]|0123456789" }, function () {});

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

type ArrayVec3 = [x: number, y: number, z: number];
type Attrs = {
  position?: ArrayVec3;
  rotation?: ArrayVec3;
  scale?: ArrayVec3;
  visible?: boolean;
  name?: string;
  layers?: number;
  ref?: Ref;
};

type EntityDef = {
  components: ComponentData;
  attrs: Attrs;
  children: EntityDef[];
  ref?: Ref;
};

function isReservedAttr(attr: string): attr is keyof Attrs {
  return reservedAttrs.includes(attr);
}

export function createElementEntity(
  tag: string | ((arg0: any, arg1: any[]) => EntityDef),
  attrs: Attrs & ComponentData,
  ...children: EntityDef[]
): EntityDef {
  attrs = attrs || {};
  if (typeof tag === "function") {
    return tag(attrs, children);
  } else if (tag === "entity") {
    const outputAttrs: Attrs = {};
    const components: ComponentData & Attrs = {};
    let ref = undefined;

    for (const attr in attrs) {
      if (isReservedAttr(attr)) {
        outputAttrs[attr] = attrs[attr] as any;
      } else if (attr === "ref") {
        ref = attrs[attr];
      } else {
        // if jsx transformed the attr into attr: true, change it to attr: {}.
        const c = attr as keyof ComponentData;
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
    throw new Error("Tried to an object3D tag to an entity that already has one");
  }
  addComponent(world, Object3DTag, eid);
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
  slice9?: {
    size: [width: number, height: number];
    insets: [top: number, buttom: number, left: number, right: number];
  };
  image?: {
    texture: Texture;
    textureSrc: string;
    textureVersion: number;
    ratio: number;
    projection: "flat" | "360-equirectangular";
  };
  video?: {
    texture: VideoTexture;
    textureSrc: string;
    textureVersion: number;
    ratio: number;
    projection: "flat" | "360-equirectangular";
    autoPlay: boolean;
  };
  networked?: any;
  "networked-video"?: true;
  "video-menu"?: {
    playButtonRef: Ref;
    currentTimeRef: Ref;
    durationRef: Ref;
  };
  "cursor-raycastable"?: true;
  "remote-hover-target"?: true;
  "hand-collision-target"?: true;
  "offers-remote-constraint"?: true;
  "offers-hand-constraint"?: true;
  "single-action-button"?: true;
  "holdable-button"?: true;
  holdable?: true;
  "make-kinematic-on-release"?: true;
  "destroy-at-extreme-distance"?: true;
  "video-menu-item"?: true;

  // @TODO
  "text-button"?: any;
  "hover-button"?: any;
  rigidbody?: any;
  "physics-shape"?: any;
  "floaty-object"?: any;
  "networked-transform"?: any;
  "camera-tool"?: any;
  "animation-mixer"?: any;
  "media-loader"?: any;
  "media-frame"?: any;
  object3D?: any;
  text?: any;
  model?: any;
  grabbable?: any;
}

declare global {
  namespace createElementEntity.JSX {
    interface IntrinsicElements {
      entity: ComponentData &
        Attrs & {
          children?: IntrinsicElements[];
        };
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export const inflators: { [K in keyof ComponentData]: InflatorFn } = {
  "cursor-raycastable": createDefaultInflator(CursorRaycastable),
  "remote-hover-target": createDefaultInflator(RemoteHoverTarget),
  "hand-collision-target": createDefaultInflator(HandCollisionTarget),
  "offers-remote-constraint": createDefaultInflator(OffersRemoteConstraint),
  "offers-hand-constraint": createDefaultInflator(OffersHandConstraint),
  "single-action-button": createDefaultInflator(SingleActionButton),
  "holdable-button": createDefaultInflator(HoldableButton),
  "text-button": createDefaultInflator(TextButton),
  "hover-button": createDefaultInflator(HoverButton),
  holdable: createDefaultInflator(Holdable),
  rigidbody: createDefaultInflator(Rigidbody),
  "physics-shape": createDefaultInflator(PhysicsShape),
  "floaty-object": createDefaultInflator(FloatyObject),
  "make-kinematic-on-release": createDefaultInflator(MakeKinematicOnRelease),
  "destroy-at-extreme-distance": createDefaultInflator(DestroyAtExtremeDistance),
  "networked-transform": createDefaultInflator(NetworkedTransform),
  networked: createDefaultInflator(Networked),
  "camera-tool": createDefaultInflator(CameraTool, { captureDurIdx: 1 }),
  "animation-mixer": createDefaultInflator(AnimationMixer),
  "networked-video": createDefaultInflator(NetworkedVideo),
  "video-menu": createDefaultInflator(VideoMenu),
  "video-menu-item": createDefaultInflator(VideoMenuItem),
  "media-loader": inflateMediaLoader,

  // inflators that create Object3Ds
  "media-frame": inflateMediaFrame,
  object3D: addObject3DComponent,
  slice9: inflateSlice9,
  text: inflateText,
  model: inflateModel,
  grabbable: inflateGrabbable,
  image: inflateImage,
  video: inflateVideo
};

function inflatorExists(name: string): name is keyof ComponentData {
  return inflators.hasOwnProperty(name);
}

export function renderAsEntity(world: HubsWorld, entityDef: EntityDef) {
  const eid = entityDef.ref ? resolveRef(world, entityDef.ref) : addEntity(world);
  Object.keys(entityDef.components).forEach(name => {
    if (!inflatorExists(name)) {
      throw new Error(`Failed to inflate unknown component called ${name}`);
    }
    inflators[name]!(world, eid, entityDef.components[name as keyof ComponentData]);
  });

  let obj = world.eid2obj.get(eid);
  if (!obj) {
    obj = new THREE.Group();
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
