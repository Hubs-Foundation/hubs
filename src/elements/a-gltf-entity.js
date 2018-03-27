const GLTFCache = {};

AFRAME.AGLTFEntity = {
  defaultInflator(el, componentName, componentData) {
    if (AFRAME.components[componentName].multiple && Array.isArray(componentData)) {
      for (let i = 0; i < componentData.length; i++) {
        el.setAttribute(componentName + "__" + i, componentData[i]);
      }
    } else {
      el.setAttribute(componentName, componentData);
    }
  },
  registerComponent(componentKey, componentName, inflator) {
    AFRAME.AGLTFEntity.components[componentKey] = {
      inflator: inflator || AFRAME.AGLTFEntity.defaultInflator,
      componentName
    };
  },
  components: {}
};

// From https://gist.github.com/cdata/f2d7a6ccdec071839bc1954c32595e87
// Tracking glTF cloning here: https://github.com/mrdoob/three.js/issues/11573
function cloneGltf(gltf) {
  const skinnedMeshes = {};
  gltf.scene.traverse(node => {
    if (!node.name) {
      node.name = node.uuid;
    }
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true)
  };

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

const inflateEntities = function(parentEl, node) {
  // setObject3D mutates the node's parent, so we have to copy
  const children = node.children.slice(0);

  const el = document.createElement("a-entity");

  // Remove invalid CSS class name characters.
  const className = (node.name || node.uuid).replace(/[^\w-]/g, "");
  el.classList.add(className);
  parentEl.appendChild(el);

  // AFRAME rotation component expects rotations in YXZ, convert it
  if (node.rotation.order !== "YXZ") {
    node.rotation.setFromQuaternion(node.quaternion, "YXZ");
  }

  // Copy over the object's transform to the THREE.Group and reset the actual transform of the Object3D
  // all updates to the object should be done through the THREE.Group wrapper
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
  node.matrixAutoUpdate = false;
  node.matrix.identity();

  el.setObject3D(node.type.toLowerCase(), node);

  // Set the name of the `THREE.Group` to match the name of the node,
  // so that `THREE.PropertyBinding` will find (and later animate)
  // the group. See `PropertyBinding.findNode`:
  // https://github.com/mrdoob/three.js/blob/dev/src/animation/PropertyBinding.js#L211
  el.object3D.name = node.name;
  if (node.animations) {
    // Pass animations up to the group object so that when we can pass the group as
    // the optional root in `THREE.AnimationMixer.clipAction` and use the hierarchy
    // preserved under the group (but not the node). Otherwise `clipArray` will be
    // `null` in `THREE.AnimationClip.findByName`.
    node.parent.animations = node.animations;
  }

  const entityComponents = node.userData.components;
  if (entityComponents) {
    for (const prop in entityComponents) {
      if (entityComponents.hasOwnProperty(prop)) {
        const { inflator, componentName } = AFRAME.AGLTFEntity.components[prop];

        if (inflator) {
          inflator(el, componentName, entityComponents[prop]);
        }
      }
    }
  }

  children.forEach(childNode => {
    inflateEntities(el, childNode);
  });

  return el;
};

function attachTemplate(root, { selector, templateRoot }) {
  const targetEls = root.querySelectorAll(selector);
  for (const el of targetEls) {
    const root = templateRoot.cloneNode(true);
    // Merge root element attributes with the target element
    for (const { name, value } of root.attributes) {
      el.setAttribute(name, value);
    }

    // Append all child elements
    for (const child of root.children) {
      el.appendChild(child);
    }
  }
}

function nextTick() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

function cachedLoadGLTF(src, onProgress) {
  return new Promise((resolve, reject) => {
    // Load the gltf model from the cache if it exists.
    if (GLTFCache[src]) {
      // Use a cloned copy of the cached model.
      resolve(cloneGltf(GLTFCache[src]));
    } else {
      // Otherwise load the new gltf model.
      new THREE.GLTFLoader().load(
        src,
        model => {
          if (!GLTFCache[src]) {
            // Store a cloned copy of the gltf model.
            GLTFCache[src] = cloneGltf(model);
          }
          resolve(model);
        },
        onProgress,
        reject
      );
    }
  });
}

AFRAME.registerElement("a-gltf-entity", {
  prototype: Object.create(AFRAME.AEntity.prototype, {
    load: {
      async value() {
        if (this.hasLoaded || !this.parentEl) {
          return;
        }

        // The code above and below this are from AEntity.prototype.load, we need to monkeypatch in gltf loading mid function
        this.loadTemplates();
        await this.applySrc(this.getAttribute("src"));
        //

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
      }
    },

    loadTemplates: {
      value() {
        this.templates = [];
        this.querySelectorAll(":scope > template").forEach(templateEl =>
          this.templates.push({
            selector: templateEl.getAttribute("data-selector"),
            templateRoot: document.importNode(templateEl.content.firstElementChild, true)
          })
        );
      }
    },

    applySrc: {
      async value(src) {
        try {
          // If the src attribute is a selector, get the url from the asset item.
          if (src && src.charAt(0) === "#") {
            const assetEl = document.getElementById(src.substring(1));

            const fallbackSrc = assetEl.getAttribute("src");
            const highSrc = assetEl.getAttribute("high-src");
            const lowSrc = assetEl.getAttribute("low-src");

            if (highSrc && window.APP.quality === "high") {
              src = highSrc;
            } else if (lowSrc && window.APP.quality === "low") {
              src = lowSrc;
            } else {
              src = fallbackSrc;
            }
          }

          if (src === this.lastSrc) return;
          this.lastSrc = src;

          if (!src) {
            if (this.inflatedEl) {
              console.warn("gltf-entity set to an empty source, unloading inflated model.");
              this.removeInflatedEl();
            }
            return;
          }

          const model = await cachedLoadGLTF(src);

          // If we started loading something else already
          // TODO: there should be a way to cancel loading instead
          if (src != this.lastSrc) return;

          // If we had inflated something already before, clean that up
          this.removeInflatedEl();

          this.model = model.scene || model.scenes[0];
          this.model.animations = model.animations;

          this.setObject3D("mesh", this.model);

          if (this.getAttribute("inflate")) {
            this.inflatedEl = inflateEntities(this, this.model);
            // TODO: Still don't fully understand the lifecycle here and how it differs between browsers, we should dig in more
            // Wait one tick for the appended custom elements to be connected before attaching templates
            await nextTick();
            if (src != this.lastSrc) return; // TODO: there must be a nicer pattern for this
            this.templates.forEach(attachTemplate.bind(null, this));
          }

          this.emit("model-loaded", { format: "gltf", model: this.model });
        } catch (e) {
          const message = (e && e.message) || "Failed to load glTF model";
          console.error(message);
          this.emit("model-error", { format: "gltf", src });
        }
      }
    },

    removeInflatedEl: {
      value() {
        if (this.inflatedEl) {
          this.inflatedEl.parentNode.removeChild(this.inflatedEl);
          delete this.inflatedEl;
        }
      }
    },

    attributeChangedCallback: {
      value(attr, oldVal, newVal) {
        if (attr === "src") {
          this.applySrc(newVal);
        }
        AFRAME.AEntity.prototype.attributeChangedCallback.call(this, attr, oldVal, newVal);
      }
    },

    setAttribute: {
      value(attr, arg1, arg2) {
        if (attr === "src") {
          this.applySrc(arg1);
        }
        AFRAME.AEntity.prototype.setAttribute.call(this, attr, arg1, arg2);
      }
    }
  })
});
