import { addComponent, addEntity, hasComponent } from "bitecs";
import { preloadFont } from "troika-three-text";
import {
  CameraTool,
  CursorRaycastable,
  DestroyAtExtremeDistance,
  FloatyObject,
  HandCollisionTarget,
  Holdable,
  HoldableButton,
  HoverButton,
  MakeKinematicOnRelease,
  Networked,
  NetworkedTransform,
  Object3DTag,
  OffersHandConstraint,
  OffersRemoteConstraint,
  PhysicsShape,
  RemoteHoverTarget,
  Rigidbody,
  SingleActionButton,
  TextButton
} from "../bit-components";
import { inflateMediaFrame } from "../inflators/media-frame";
import { inflateModel } from "../inflators/model";
import { inflateSlice9 } from "../inflators/slice9";
import { inflateText } from "../inflators/text";

// TODO we should do this in a more explicit spot for "preloading" during the loading screen
preloadFont({ characters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_<()>[]|0123456789" }, function() {});

function isValidChild(child) {
  if (child === undefined) {
    console.warn("found undefined node");
    return false;
  } else if (typeof child === "string") {
    console.warn("found text node", child);
    return false;
  }

  return true;
}

const reservedAttrs = ["position", "rotation", "scale", "visible", "name", "layers"];

class Ref {
  constructor() {
    this.current = null;
  }
}
export function createRef() {
  return new Ref();
}
function resolveRef(world, ref) {
  if (ref.current === null) {
    ref.current = addEntity(world);
  }
  return ref.current;
}

export function createElementEntity(tag, attrs, ...children) {
  attrs = attrs || {};
  if (typeof tag === "function") {
    return tag(attrs, children);
  } else if (tag === "entity") {
    const outputAttrs = {};
    const components = [];
    let ref = null;

    for (const attr in attrs) {
      if (reservedAttrs.includes(attr)) {
        outputAttrs[attr] = attrs[attr];
      } else if (attr === "ref") {
        ref = attrs[attr];
      } else {
        // if jsx transformed the attr into attr: true, change it to attr: {}.
        components[attr] = attrs[attr] === true ? {} : attrs[attr];
      }
    }

    return {
      attrs: outputAttrs,
      components,
      children: children.flat().filter(isValidChild),
      ref
    };
  } else {
    throw new Error("invalid tag", tag);
  }
}

export function addObject3DComponent(world, eid, obj) {
  if (hasComponent(APP.world, Object3DTag, eid)) {
    throw new Error("Tried to an object3D tag to an entity that already has one");
  }
  addComponent(APP.world, Object3DTag, eid);
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  return eid;
}

// TODO HACK gettting internal bitecs symbol, should expose an API to check a properties type
const $isEidType = Object.getOwnPropertySymbols(CameraTool.screenRef).find(s => s.description === "isEidType");
console.log($isEidType);

const createDefaultInflator = (Component, defaults = {}) => {
  return (world, eid, componentProps) => {
    componentProps = Object.assign({}, defaults, componentProps);
    addComponent(world, Component, eid, true);
    Object.keys(componentProps).forEach(propName => {
      const prop = Component[propName];
      if (!prop) {
        console.error(`${propName} is not a valid property of`, Component);
        return;
      }
      const value = componentProps[propName];
      prop[eid] = prop[$isEidType] ? resolveRef(world, value) : value;
    });
  };
};

const inflators = {
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

  // inflators that create Object3Ds
  "media-frame": inflateMediaFrame,
  object3D: addObject3DComponent,
  slice9: inflateSlice9,
  text: inflateText,
  model: inflateModel
};

export function renderAsEntity(world, entityDef) {
  const eid = entityDef.ref ? resolveRef(world, entityDef.ref) : addEntity(world);

  Object.keys(entityDef.components).forEach(name => {
    if (!inflators[name]) {
      throw new Error(`Failed to inflate unknown component called ${name}`);
    }

    inflators[name](world, eid, entityDef.components[name]);
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
    if (child.type === "a-entity") {
      throw new Error("a-entity can only be children of a-entity");
    } else {
      const childEid = renderAsEntity(world, child);
      obj.add(world.eid2obj.get(childEid));
    }
  });
  return eid;
}
