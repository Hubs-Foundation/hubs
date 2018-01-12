const inflateEntities = function(idPrefix, componentMappings, parentEl, node) {
  // setObject3D mutates the node's parent, so we have to copy
  const children = node.children.slice(0);

  const el = document.createElement("a-entity");
  el.id = idPrefix + node.name;
  parentEl.appendChild(el);

  // // Copy over transform to the THREE.Group and reset the actual transform of the Object3D
  el.setAttribute("position", {
    x: node.position.x,
    y: node.position.y,
    z: node.position.z
  });
  el.setAttribute("rotation", {
    x: node.rotation.x * THREE.Math.RAD2DEG,
    y: node.rotation.y * THREE.Math.RAD2DEG,
    z: node.rotation.z * THREE.Math.RAD2DEG
  });
  el.setAttribute("scale", {
    x: node.scale.x,
    y: node.scale.y,
    z: node.scale.z
  });

  node.position.set(0, 0, 0);
  node.rotation.set(0, 0, 0);
  node.scale.set(1, 1, 1);

  el.setObject3D(node.type.toLowerCase(), node);

  if (componentMappings && componentMappings[node.name]) {
    const components = componentMappings[node.name];
    for (const componentName of Object.keys(components)) {
      el.setAttribute(componentName, components[componentName]);
    }
  }

  children.forEach(childNode => {
    inflateEntities(idPrefix, componentMappings, el, childNode);
  });
};

AFRAME.registerComponent("model-inflator", {
  schema: {
    idPrefix: { type: "string" }
  },
  init: function() {
    const componentMappings = {
      RightHand: {
        spin: "speed: 1;"
      }
    };

    this.el.addEventListener("model-loaded", e => {
      inflateEntities(
        `${this.data.idPrefix}_`,
        componentMappings,
        this.el,
        e.detail.model
      );
    });
  }
});
