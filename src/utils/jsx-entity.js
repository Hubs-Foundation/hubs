import { inflateMirror } from "../inflate-mirror";
import { inflateMediaFrame } from "../inflate-media-frame";
import { Layers } from "../components/layers";

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
      children: children.filter(isValidChild),
      ref
    };
  }
}

import { hasComponent, addComponent, addEntity, removeEntity, defineComponent, Types } from "bitecs";

export const Object3DTag = defineComponent();
export const Spin = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });
export const CursorRaycastable = defineComponent();
export const TextTag = defineComponent();
export const RemoteHoverTarget = defineComponent();
export const Holdable = defineComponent();
export const RemoveNetworkedEntityButton = defineComponent();
export const Interacted = defineComponent();
export const HoveredRightHand = defineComponent();
export const HoveredLeftHand = defineComponent();
export const HoveredRightRemote = defineComponent();
export const HoveredLeftRemote = defineComponent();
export const HeldRightHand = defineComponent();
export const HeldLeftHand = defineComponent();
export const HeldRightRemote = defineComponent();
export const HeldLeftRemote = defineComponent();
export const Held = defineComponent();
export const Snapped = defineComponent();
export const MediaFramePreviewClone = defineComponent({
  preview: Types.eid
});
export const OffersRemoteConstraint = defineComponent();
export const HandCollisionTarget = defineComponent();
export const OffersHandConstraint = defineComponent();
export const TogglesHoveredActionSet = defineComponent();
export const SingleActionButton = defineComponent();
export const HoldableButton = defineComponent();
export const Pen = defineComponent();
export const HoverMenuChild = defineComponent();
export const Static = defineComponent();
export const Inspectable = defineComponent();
export const PreventAudioBoost = defineComponent();
export const IgnoreSpaceBubble = defineComponent();
export const Rigidbody = defineComponent({ bodyId: Types.ui16 });
export const PhysicsShape = defineComponent({ shapeId: Types.ui16, halfExtents: [Types.f32, 3] });
export const Pinnable = defineComponent();
export const Pinned = defineComponent();
export const FloatyObject = defineComponent();

export const NETWORK_FLAGS = {
  INFLATED: 1,
  IS_REMOTE_ENTITY: 2,
  FLAG_3: 4
};

let networkId = 1;

export function addObject3DComponent(world, eid, obj) {
  if (hasComponent(APP.world, Object3DTag, eid)) {
    throw new Error("Tried to an object3D tag to an entity that already has one");
  }
  addComponent(APP.world, Object3DTag, eid);
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  obj.addEventListener("removed", function() {
    removeEntity(world, eid);
    // TODO should probably happen in a system that looks for Object3DTag component removal
    world.eid2obj.delete(eid);

    obj.eid = null;
  });
  return eid;
}

const createDefaultInflator = Component => {
  return (world, eid, componentProps) => {
    addComponent(world, Component, eid);
    Object.keys(componentProps).forEach(propName => {
      Component[propName][eid] = componentProps[propName];
    });
  };
};

const inflators = {
  spin: createDefaultInflator(Spin),
  "cursor-raycastable": createDefaultInflator(CursorRaycastable),
  "remote-hover-target": createDefaultInflator(RemoteHoverTarget),
  "offers-remote-constraint": createDefaultInflator(OffersRemoteConstraint),
  holdable: createDefaultInflator(Holdable),
  rigidbody: createDefaultInflator(Rigidbody),
  "media-frame": inflateMediaFrame,
  water: () => {},
  text: () => {},
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
