const GLTFCache = {};

AFRAME.AGLTFEntity = {
  defaultSerializer(el, componentName, componentData) {
    el.setAttribute(componentName, componentData);
  },
  registerComponent(componentName, serializer) {
    AFRAME.AGLTFEntity.components[componentName] = serializer || AFRAME.AGLTFEntity.defaultSerializer;
  },
  components: {}
};

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

  const entityComponents = node.userData;

  if (entityComponents) {
    for (const prop in entityComponents) {
      if (entityComponents.hasOwnProperty(prop)) {
        const serializer = AFRAME.AGLTFEntity.components[prop];

        if (serializer) {
          serializer(el, prop, entityComponents[prop]);
        }
      }
    }
  }

  children.forEach(childNode => {
    inflateEntities(classPrefix, el, childNode);
  });
};

function attachTemplate(templateEl) {
  const selector = templateEl.getAttribute("data-selector");
  const targetEls = templateEl.parentNode.querySelectorAll(selector);
  const clone = document.importNode(templateEl.content, true);
  const templateRoot = clone.firstElementChild;

  for (const el of targetEls) {
    // Merge root element attributes with the target element
    for (const { name, value } of templateRoot.attributes) {
      el.setAttribute(name, value);
    }

    // Append all child elements
    for (const child of templateRoot.children) {
      el.appendChild(document.importNode(child, true));
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

        const onLoad = gltfModel => {
          if (!GLTFCache[src]) {
            // Store a cloned copy of the gltf model.
            GLTFCache[src] = cloneGltf(gltfModel);
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

        const inflate = (model, callback) => {
          inflateEntities("", this, model);
          this.querySelectorAll(":scope > template").forEach(attachTemplate);

          // Wait one tick for the appended custom elements to be connected before calling finalizeLoad
          setTimeout(callback, 0);
        };

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

        // Load the gltf model from the cache if it exists.
        const gltf = GLTFCache[src];

        if (gltf) {
          // Use a cloned copy of the cached model.
          const clonedGltf = cloneGltf(gltf);
          onLoad(clonedGltf);
          return;
        }

        // Otherwise load the new gltf model.
        new THREE.GLTFLoader().load(src, onLoad, undefined /* onProgress */, error => {
          // On glTF load error

          const message = error && error.message ? error.message : "Failed to load glTF model";
          console.warn(message);
          this.emit("model-error", { format: "gltf", src });
        });
      }
    }
  })
});
