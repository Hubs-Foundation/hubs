const GLTFCache = {};

// From https://gist.github.com/cdata/f2d7a6ccdec071839bc1954c32595e87
// Tracking glTF cloning here: https://github.com/mrdoob/three.js/issues/11573
function cloneGltf(gltf) {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true)
  };

  const skinnedMeshes = {};

  gltf.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.scene.traverse(node => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }

    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses), cloneSkinnedMesh.matrixWorld);

    cloneSkinnedMesh.material = skinnedMesh.material.clone();
  }

  return clone;
}

AFRAME.registerComponent("rotator", {
  schema: {
    speed: { type: "number" },
    axis: { type: "vec3" }
  },

  init() {
    console.log("Init rotator", this.data);
  },

  tick(t, dt) {
    this.el.object3D.rotateOnAxis(this.data.axis, this.data.speed * THREE.Math.DEG2RAD * dt);
  }
});

// parses (specific) component values from GLTF to aframe properties
const parseComponent = function(mapping, data, el) {
  const schema = AFRAME.components[mapping.aframeComponent].schema;
  const props = {};

  for (let i = 0; i < mapping.aframeProperties.length; i++) {
    const property = mapping.aframeProperties[i];
    const type = schema[property].type;
    switch (type) {
      case "array":
      case "number":
      case "boolean":
      case "string":
        props[property] = data[i];
        break;
      case "int":
        props[property] = Math.floor(data[i]);
      case "vec2":
        props[property] = { x: data[i][0], y: data[i][1] };
        break;
      case "vec3":
        props[property] = { x: data[i][0], y: data[i][1], z: data[i][2] };
        break;
      case "vec4":
        props[property] = { x: data[i][0], y: data[i][1], z: data[i][2], w: data[i][2] };
        break;
      // TODO: handle colortypes
      // case "color":
      //   props[property] = rgbToHex(data[i])
      //   break;
      // TODO: handle noderef types
      // case "selector":
      //   break;
      // case "selectorAll":
      //   break;
      default:
        console.warn("Invalid property type:", type);
    }
  }
  return props;
};

// serializes (specific) aframe properties to GLTF component values
const serializeComponent = function(mapping, el) {
  const schema = AFRAME.components[mapping.aframeComponent].schema;
  const data = el.components[mapping.aframeComponent].data;
  return mapping.aframeProperties.map(property => {
    const type = schema[property].type;
    const val = data[property];
    switch (type) {
      case "array":
      case "number":
      case "boolean":
      case "string":
      case "int":
        return val;
      case "vec2":
        return [val.x, val.y];
      case "vec3":
        return [val.x, val.y, val.z];
      case "vec4":
        return [val.x, val.y, val.z, val.w];
      // TODO: handle colortypes
      // case "color":
      //   return hexToRgb(val)
      // TODO: handle noderef types
      // case "selector":
      //   return;
      // case "selectorAll":
      //   return;
      default:
        console.warn("Invalid property type:", type);
    }
  });
};

const componentMappings = {
  rotator: {
    aframeComponent: "rotator",
    aframeProperties: ["speed", "axis"]
  }
};

// AFRAME.registerGLTFComponentMapping("rotator", "aframe-rotator", ["spped", "axis"]);
// AFRAME.registerGLTFComponentMapping("rotator", ["spped", "axis"]);
// AFRAME.registerGLTFComponentMapping("aframe-rotator", {
//   gltfName: "rotator", // optional, otherwise assume the same as aframe name
//   properties: ["speed", "axis"] // determines which properties are encoded/decoded, and in what order
// });

const inflateEntities = function(classPrefix, parentEl, node) {
  // setObject3D mutates the node's parent, so we have to copy
  const children = node.children.slice(0);

  const el = document.createElement("a-entity");

  // Remove invalid CSS class name characters.
  const className = node.name.replace(/[^\w-]/g, "");
  if (className && className.length) {
    el.classList.add(classPrefix + className);
  }
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

  if (node.userData.components) {
    console.log("Node with components", node.userData);
    const components = node.userData.components;
    for (let i = 0; i < components.length; i++) {
      const { type, data } = components[i];
      if (componentMappings[type]) {
        el.setAttribute(componentMappings[type].aframeComponent, parseComponent(componentMappings[type], data, el));
      }
    }
  }

  el.setObject3D(node.type.toLowerCase(), node);

  children.forEach(childNode => {
    inflateEntities(classPrefix, el, childNode);
  });
};

function attachTemplate(templateEl) {
  const selector = templateEl.getAttribute("data-selector");
  const targetEls = templateEl.parentNode.querySelectorAll(selector);
  const clone = document.importNode(templateEl.content, true);
  const templateRoot = clone.firstElementChild;
  const templateRootAttrs = templateRoot.attributes;

  for (var i = 0; i < targetEls.length; i++) {
    const targetEl = targetEls[i];

    // Merge root element attributes with the target element
    for (var i = 0; i < templateRootAttrs.length; i++) {
      targetEl.setAttribute(templateRootAttrs[i].name, templateRootAttrs[i].value);
    }

    // Append all child elements
    for (var i = 0; i < templateRoot.children.length; i++) {
      targetEl.appendChild(document.importNode(templateRoot.children[i], true));
    }
  }
}

AFRAME.registerElement("a-gltf-entity", {
  prototype: Object.create(AFRAME.AEntity.prototype, {
    load: {
      value() {
        if (this.hasLoaded || !this.parentEl) {
          return;
        }

        // Get the src url.
        let src = this.getAttribute("src");

        // If the src attribute is a selector, get the url from the asset item.
        if (src.charAt(0) === "#") {
          const assetEl = document.getElementById(src.substring(1));
          src = assetEl.getAttribute("src");
        }

        // Load the gltf model from the cache if it exists.
        const gltf = GLTFCache[src];

        if (gltf) {
          // Use a cloned copy of the cached model.
          const clonedGltf = cloneGltf(gltf);
          this.onLoad(clonedGltf);
          return;
        }

        const finalizeLoad = () => {
          AFRAME.ANode.prototype.load.call(this, () => {
            // Check if entity was detached while it was waiting to load.
            if (!this.parentEl) {
              return;
            }

            this.updateComponents();
            if (this.isScene || this.parentEl.isPlaying) {
              this.play();
            }
          });
        };

        const inflate = (model, callback) => {
          inflateEntities("", this, model);
          this.querySelectorAll(":scope > template").forEach(attachTemplate);
          setTimeout(callback, 0);
        };

        const onLoad = gltfModel => {
          if (!GLTFCache[this.data]) {
            // Store a cloned copy of the gltf model.
            GLTFCache[this.data] = cloneGltf(gltfModel);
          }

          this.model = gltfModel.scene || gltfModel.scenes[0];
          this.model.animations = gltfModel.animations;

          this.setObject3D("mesh", this.model);
          this.emit("model-loaded", { format: "gltf", model: this.model });

          if (this.getAttribute("inflate")) {
            inflate(this.model, finalizeLoad);
          } else {
            finalizeLoad();
          }
        };

        const onError = error => {
          const message = error && error.message ? error.message : "Failed to load glTF model";
          console.warn(message);
          this.emit("model-error", { format: "gltf", src: this.data });
        };

        // Otherwise load the new gltf model.
        new THREE.GLTFLoader().load(src, onLoad, undefined /* onProgress */, onError);
      }
    }
  })
});
