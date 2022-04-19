function parseChildren(children) {
  const components = {};
  const childEntities = [];
  children.forEach(function(c) {
    if (c === undefined) {
      console.warn("found undefined node", c);
    } else if (typeof c === "string") {
      console.warn("found text node", c);
    } else if (c.name) {
      components[c.name] = c.props;
    } else {
      childEntities.push(c);
    }
  });
  return { childEntities, components };
}

export function createElementEntity(tag, attrs, ...children) {
  if (typeof tag === "function") return tag(attrs);
  if (tag === "a-entity") {
    const aframeAttrs = {};
    const { childEntities, components } = parseChildren(children);
    Object.assign(components, attrs);
    if (attrs.className) {
      aframeAttrs.className = attrs.className;
      delete components.className;
    }
    if (attrs.id) {
      aframeAttrs.id = attrs.id;
      delete components.id;
    }
    if (attrs.mixin) {
      aframeAttrs.mixin = attrs.mixin;
      delete components.mixin;
    }
    Object.keys(components).forEach(function(componentName) {
      if (components[componentName] === true) components[componentName] = "";
    });
    return {
      attrs: aframeAttrs,
      components,
      children: childEntities
    };
  } else if (tag === "entity") {
    const { childEntities, components } = parseChildren(children);
    return {
      attrs,
      components,
      children: childEntities
    };
  } else {
    return {
      name: tag,
      props: attrs
    };
  }
}

export function renderAsAframeEntity(entity) {
  const el = document.createElement("a-entity");
  if (entity.attrs.className) {
    el.className = entity.attrs.className;
  }
  if (entity.attrs.id) {
    el.id = entity.attrs.id;
  }
  if (entity.attrs.position) {
    el.object3D.position.copy(entity.attrs.position);
  }
  if (entity.attrs.rotation) {
    el.object3D.rotation.copy(entity.attrs.rotation);
  }
  if (entity.attrs.scale) {
    el.object3D.scale.copy(entity.attrs.scale);
  }
  if (entity.attrs.visible !== undefined) {
    el.object3D.visible = entity.attrs.visible;
  }
  Object.keys(entity.components).forEach(name => el.setAttribute(name, entity.components[name]));
  entity.children.forEach(child => el.appendChild(renderAsAframeEntity(child)));
  return el;
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
