const inflateEntities = function(classPrefix, parentEl, node) {
  // setObject3D mutates the node's parent, so we have to copy
  const children = node.children.slice(0);

  const el = document.createElement("a-entity");

  // Remove invalid CSS class name characters.
  const className = node.name.replace(/[^\w-]/g, "");
  el.classList.add(classPrefix + className);
  parentEl.appendChild(el);

  // Copy over transform to the THREE.Group and reset the actual transform of the Object3D
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

  children.forEach(childNode => {
    inflateEntities(classPrefix, el, childNode);
  });
};

AFRAME.registerComponent("model-inflator", {
  schema: {
    classPrefix: { type: "string", default: "" }
  },
  init: function() {
    this.el.addEventListener("model-loaded", e => {
      inflateEntities(this.data.classPrefix, this.el, e.detail.model);
    });
  }
});
