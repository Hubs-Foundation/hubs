import { inflateMirror } from "../inflate-mirror";
import { inflateMediaFrame } from "../inflate-media-frame";
import { THREE_SIDES } from "../components/troika-text";
import { Layers } from "../components/layers";
import {
  CursorRaycastable,
  Holdable,
  HoldableButton,
  Logger,
  Networked,
  NetworkedTransform,
  Object3DTag,
  OffersRemoteConstraint,
  RemoteHoverTarget,
  Rigidbody,
  SingleActionButton,
  Slice9,
  Spin,
  Text
} from "../bit-components";
import { Text as TroikaText } from "troika-three-text";
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

const vecAttrs = ["position", "scale", "rotation"];
function parseVecAttr(attr, value) {
  if (typeof value === "string") {
    value = value.split(" ").map(parseFloat);
    console.warn(`${attr} attribute was a string, it should be an array. -> scale={${JSON.stringify(value)}}`);
  }
  return value;
}

const reservedAttrs = ["id", "className", "visible", ...vecAttrs];

// this is not just a simple object to trick aframes caching stuff
class Ref {
  constructor() {
    this.current = null;
  }
}
export function createRef() {
  return new Ref();
}

export const refSchema = {
  parse: v => v.current
};

export function createElementEntity(tag, attrs, ...children) {
  attrs = attrs || {};
  if (typeof tag === "function") {
    if (tag.prototype instanceof THREE.Object3D) {
      let ref;
      if (attrs.ref) {
        ref = attrs.ref;
        delete attrs.ref;
      }
      return {
        type: "Object3D",
        func: tag,
        props: attrs,
        children: children.filter(isValidChild),
        ref
      };
    } else {
      return tag(attrs);
    }
  }
  if (tag === "entity" || tag === "a-entity") {
    const outputAttrs = {};
    const components = [];
    let ref = null;

    for (let attr in attrs) {
      if (vecAttrs.includes(attr)) {
        outputAttrs[attr] = parseVecAttr(attr, attrs[attr]);
      } else if (reservedAttrs.includes(attr)) {
        outputAttrs[attr] = attrs[attr];
      } else if (attr === "mixin") {
        console.warn(`Mixins are not supported, consider creating a custom component for ${attrs.mixin}`);
      } else if (attr === "ref") {
        ref = attrs[attr];
      } else {
        // if jsx transformed the attr into attr: true, change it to attr: {}.
        components[attr] = attrs[attr] === true ? {} : attrs[attr];
      }
    }

    return {
      type: tag === "a-entity" ? "a-entity" : "entity",
      attrs: outputAttrs,
      components,
      children: children.flat().filter(isValidChild),
      ref
    };
  }
}

import { hasComponent, addComponent, addEntity, removeEntity } from "bitecs";

export function addObject3DComponent(world, eid, obj) {
  if (hasComponent(APP.world, Object3DTag, eid)) {
    throw new Error("Tried to an object3D tag to an entity that already has one");
  }
  addComponent(APP.world, Object3DTag, eid);
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  // obj.addEventListener("removed", function() {
  //   removeEntity(world, eid);
  //   // TODO should probably happen in a system that looks for Object3DTag component removal
  //   world.eid2obj.delete(eid);

  //   obj.eid = null;
  // });
  return eid;
}

const createDefaultInflator = Component => {
  return (world, eid, componentProps) => {
    addComponent(world, Component, eid, true);
    Object.keys(componentProps).forEach(propName => {
      Component[propName][eid] = componentProps[propName];
    });
  };
};

function inflateText(world, eid, componentProps) {
  addComponent(world, Text, eid);
  const text = new TroikaText();
  Object.entries(componentProps).forEach(([name, value]) => {
    switch (name) {
      case "value":
        text.text = value;
        break;
      case "side":
        text.material.side = THREE_SIDES[value];
        break;
      case "opacity":
        text.material.side = value;
        break;
      case "fontUrl":
        text.font = value;
        break;
      default:
        text[name] = value;
    }
  });
  text.sync();
  addObject3DComponent(world, eid, text);
}

import { updateSlice9Geometry } from "../update-slice9-geometry";

function inflateSlice9(world, eid, { size, insets, texture }) {
  const geometry = (this.geometry = new THREE.PlaneBufferGeometry(1, 1, 3, 3));
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  console.log(material);
  const obj = new THREE.Mesh(geometry, material);
  addObject3DComponent(world, eid, obj);

  addComponent(world, Slice9, eid);
  Slice9.insets[eid].set(insets);
  Slice9.size[eid].set(size);
  updateSlice9Geometry(world, eid);
}

// TODO: Remove this component. Only used for debugging
function inflateLogger(world, eid, data) {
  addComponent(world, Logger, eid);
  world.eid2loggerdata = world.eid2loggerdata || new Map();
  world.eid2loggerdata.set(eid, data);
}

const inflators = {
  spin: createDefaultInflator(Spin),
  "cursor-raycastable": createDefaultInflator(CursorRaycastable),
  "remote-hover-target": createDefaultInflator(RemoteHoverTarget),
  "offers-remote-constraint": createDefaultInflator(OffersRemoteConstraint),
  "single-action-button": createDefaultInflator(SingleActionButton),
  "holdable-button": createDefaultInflator(HoldableButton),
  holdable: createDefaultInflator(Holdable),
  rigidbody: createDefaultInflator(Rigidbody),
  "networked-transform": createDefaultInflator(NetworkedTransform),
  networked: createDefaultInflator(Networked),
  logger: inflateLogger,
  "media-frame": inflateMediaFrame,
  object3D: addObject3DComponent,
  slice9: inflateSlice9,
  water: () => {},
  text: inflateText,
  waypoint: () => {},
  mirror: inflateMirror
};

export function renderAsAframeEntity(entityDef, world) {
  if (entityDef.type === "a-entity") {
    const el = document.createElement("a-entity");
    if (entityDef.attrs.className) {
      el.className = entityDef.attrs.className;
    }
    if (entityDef.attrs.id) {
      el.id = entityDef.attrs.id;
    }
    if (entityDef.attrs.position) {
      el.object3D.position.fromArray(entityDef.attrs.position);
    }
    if (entityDef.attrs.rotation) {
      el.object3D.rotation.fromArray(entityDef.attrs.rotation);
    }
    if (entityDef.attrs.scale) {
      el.object3D.scale.fromArray(entityDef.attrs.scale);
    }
    if (entityDef.attrs.visible !== undefined) {
      el.object3D.visible = entityDef.attrs.visible;
    }
    if (entityDef.ref) {
      console.log("setting ref", entityDef, el);
      entityDef.ref.current = el;
    }
    entityDef.children.forEach(child => {
      if (child.type === "a-entity") {
        el.appendChild(renderAsAframeEntity(child, world));
      } else {
        el.object3D.add(renderAsAframeEntity(child, world));
      }
    });
    Object.keys(entityDef.components).forEach(name => {
      const componentProps = entityDef.components[name];
      el.setAttribute(name, componentProps === true ? "" : componentProps);
    });
    return el;
  } else if (entityDef.type === "entity") {
    const eid = addEntity(world);

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
    if (entityDef.ref) {
      entityDef.ref.current = eid;
    }
    entityDef.children.forEach(child => {
      if (child.type === "a-entity") {
        throw new Error("a-entity can only be children of a-entity");
      } else {
        obj.add(renderAsAframeEntity(child, world));
      }
    });
    return obj;
  } else if (entityDef.type === "Object3D") {
    const obj = new entityDef.func();
    for (const prop in entityDef.props) {
      if (Array.isArray(entityDef.props[prop]) && obj[prop] && obj[prop].fromArray) {
        obj[prop].fromArray(entityDef.props[prop]);
      } else {
        obj[prop] = entityDef.props[prop];
      }
    }
    if (entityDef.ref) {
      entityDef.ref.current = obj;
    }
    entityDef.children.forEach(child => {
      if (child.type === "Object3D") {
        obj.add(renderAsAframeEntity(child, world));
      } else {
        throw "entities can only be children of entities";
      }
    });
    return obj;
  } else {
    throw "unknown entity type " + entityDef.type;
  }
}

export function renderAsEntity(world, entityDef) {
  const obj = renderAsAframeEntity(entityDef, world);
  return obj.eid;
}

function reduceNodes([siblingIndicies, prevNodes], entity) {
  const [childIndicies, nodes] = entity.children.reduce(reduceNodes, [[], prevNodes]);
  return [
    [...siblingIndicies, nodes.length],
    [
      ...nodes,
      {
        name: entity.attrs.id,
        position: entity.attrs.position,
        scale: entity.attrs.scale,
        rotation: entity.attrs.rotation,
        extensions: Object.keys(entity.components).length && {
          MOZ_hubs_components: entity.components
        },
        children: childIndicies
      }
    ]
  ];
}

export function renderAsGLTF(rootEntity) {
  const nodes = reduceNodes([[], []], rootEntity)[1];
  return {
    asset: {
      generator: "Hubs JSX",
      version: "2.0"
    },
    extensionsUsed: ["MOZ_hubs_components"],
    nodes,
    scene: nodes.length
  };
}

/** @jsx createElementEntity */
const gltfTest = (
  <entity id="A">
    <entity id="B" />
    <entity id="C">
      <entity id="Child A" />
      <entity id="Child B" />
    </entity>
    <entity id="D" />
  </entity>
);
