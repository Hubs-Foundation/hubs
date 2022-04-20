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
    let isLegacyEntity = tag === "a-entity";
    if (isLegacyEntity) {
      console.warn("Entity using 'a-entity' tag, it should be 'entity'.");
      // do any special handling to make porting templates easier
    }
    const outputAttrs = {};
    const components = [];
    let ref = null;

    for (let attr in attrs) {
      if (isLegacyEntity && vecAttrs.includes(attr)) {
        outputAttrs[attr] = parseVecAttr(attr, attrs[attr]);
      } else if (reservedAttrs.includes(attr)) {
        outputAttrs[attr] = attrs[attr];
      } else if (attr === "mixin") {
        console.warn(`Mixins are not supported, consider creating a custom component for ${attrs.mixin}`);
      } else if (attr === "ref") {
        ref = attrs[attr];
      } else {
        components[attr] = attrs[attr];
      }
    }

    return {
      type: "entity",
      attrs: outputAttrs,
      components,
      children: children.filter(isValidChild),
      ref
    };
  }
}

export function renderAsAframeEntity(entityDef) {
  if (entityDef.type === "entity") {
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
      if (child.type === "Object3D") {
        el.object3D.add(renderAsAframeEntity(child));
      } else {
        el.appendChild(renderAsAframeEntity(child));
      }
    });
    Object.keys(entityDef.components).forEach(name => {
      const componentProps = entityDef.components[name];
      el.setAttribute(name, componentProps === true ? "" : componentProps);
    });
    return el;
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
        obj.add(renderAsAframeEntity(child));
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
