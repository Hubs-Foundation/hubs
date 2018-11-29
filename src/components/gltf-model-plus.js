import nextTick from "../utils/next-tick";
import SketchfabZipWorker from "../workers/sketchfab-zip.worker.js";
import MobileStandardMaterial from "../materials/MobileStandardMaterial";
import cubeMapPosX from "../assets/images/cubemap/posx.jpg";
import cubeMapNegX from "../assets/images/cubemap/negx.jpg";
import cubeMapPosY from "../assets/images/cubemap/posy.jpg";
import cubeMapNegY from "../assets/images/cubemap/negy.jpg";
import cubeMapPosZ from "../assets/images/cubemap/posz.jpg";
import cubeMapNegZ from "../assets/images/cubemap/negz.jpg";

const GLTFCache = {};
let CachedEnvMapTexture = null;

function inflateComponent(el, componentName, componentData) {
  if (!AFRAME.components[componentName]) {
    throw new Error(`Inflator failed. "${componentName}" component does not exist.`);
  }
  if (AFRAME.components[componentName].multiple && Array.isArray(componentData)) {
    for (let i = 0; i < componentData.length; i++) {
      el.setAttribute(componentName + "__" + i, componentData[i]);
    }
  } else {
    el.setAttribute(componentName, componentData);
  }
}

AFRAME.GLTFModelPlus = {
  // eslint-disable-next-line no-unused-vars
  components: {},
  registerComponent(componentKey, componentName, inflator) {
    inflator = inflator || inflateComponent;
    AFRAME.GLTFModelPlus.components[componentKey] = { inflator, componentName };
  }
};

function parallelTraverse(a, b, callback) {
  callback(a, b);

  for (let i = 0; i < a.children.length; i++) {
    parallelTraverse(a.children[i], b.children[i], callback);
  }
}

// Modified version of Don McCurdy's AnimationUtils.clone
// https://github.com/mrdoob/three.js/pull/14494
function cloneSkinnedMesh(source) {
  const cloneLookup = new Map();

  const clone = source.clone();

  parallelTraverse(source, clone, function(sourceNode, clonedNode) {
    cloneLookup.set(sourceNode, clonedNode);
  });

  source.traverse(function(sourceMesh) {
    if (!sourceMesh.isSkinnedMesh) return;

    const sourceBones = sourceMesh.skeleton.bones;
    const clonedMesh = cloneLookup.get(sourceMesh);

    clonedMesh.skeleton = sourceMesh.skeleton.clone();

    clonedMesh.skeleton.bones = sourceBones.map(function(sourceBone) {
      if (!cloneLookup.has(sourceBone)) {
        throw new Error("Required bones are not descendants of the given object.");
      }

      return cloneLookup.get(sourceBone);
    });

    clonedMesh.bind(clonedMesh.skeleton, sourceMesh.bindMatrix);
  });

  return clone;
}

function cloneGltf(gltf) {
  return {
    animations: gltf.animations,
    scene: cloneSkinnedMesh(gltf.scene)
  };
}

/// Walks the tree of three.js objects starting at the given node, using the GLTF data
/// and template data to construct A-Frame entities and components when necessary.
/// (It's unnecessary to construct entities for subtrees that have no component data
/// or templates associated with any of their nodes.)
///
/// Returns the A-Frame entity associated with the given node, if one was constructed.
const inflateEntities = function(node, templates, isRoot, modelToWorldScale) {
  // inflate subtrees first so that we can determine whether or not this node needs to be inflated
  const childEntities = [];
  const children = node.children.slice(0); // setObject3D mutates the node's parent, so we have to copy
  for (const child of children) {
    const el = inflateEntities(child, templates);
    if (el) {
      childEntities.push(el);
    }
  }

  const hubsComponents = node.userData.gltfExtensions && node.userData.gltfExtensions.HUBS_components;

  // We can remove support for legacy components when our environment, avatar and interactable models are
  // updated to match Spoke output.
  const legacyComponents = node.userData.components;

  const entityComponents = hubsComponents || legacyComponents;

  const nodeHasBehavior = !!entityComponents || node.name in templates;
  if (!nodeHasBehavior && !childEntities.length && !isRoot) {
    return null; // we don't need an entity for this node
  }

  const el = document.createElement("a-entity");
  el.append.apply(el, childEntities);

  // Remove invalid CSS class name characters.
  const className = (node.name || node.uuid).replace(/[^\w-]/g, "");
  el.classList.add(className);

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
    x: node.scale.x * (modelToWorldScale !== undefined ? modelToWorldScale : 1),
    y: node.scale.y * (modelToWorldScale !== undefined ? modelToWorldScale : 1),
    z: node.scale.z * (modelToWorldScale !== undefined ? modelToWorldScale : 1)
  });

  node.matrixAutoUpdate = false;
  node.matrix.identity();
  node.matrix.decompose(node.position, node.rotation, node.scale);
  el.object3D.matrixNeedsUpdate = true;

  el.setObject3D(node.type.toLowerCase(), node);
  if (entityComponents && "nav-mesh" in entityComponents) {
    el.setObject3D("mesh", node);
  }

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

  if (entityComponents) {
    for (const prop in entityComponents) {
      if (entityComponents.hasOwnProperty(prop) && AFRAME.GLTFModelPlus.components.hasOwnProperty(prop)) {
        const { componentName, inflator } = AFRAME.GLTFModelPlus.components[prop];
        inflator(el, componentName, entityComponents[prop]);
      }
    }
  }

  return el;
};

function attachTemplate(root, name, templateRoot) {
  const targetEls = root.querySelectorAll("." + name);
  for (const el of targetEls) {
    const root = templateRoot.cloneNode(true);
    // Merge root element attributes with the target element
    for (const { name, value } of root.attributes) {
      el.setAttribute(name, value);
    }

    // Append all child elements
    while (root.children.length > 0) {
      el.appendChild(root.children[0]);
    }
  }
}

function getFilesFromSketchfabZip(src) {
  return new Promise((resolve, reject) => {
    const worker = new SketchfabZipWorker();
    worker.onmessage = e => {
      const [success, fileMapOrError] = e.data;
      (success ? resolve : reject)(fileMapOrError);
    };
    worker.postMessage(src);
  });
}

async function loadEnvMap() {
  const urls = [cubeMapPosX, cubeMapNegX, cubeMapPosY, cubeMapNegY, cubeMapPosZ, cubeMapNegZ];
  const texture = await new THREE.CubeTextureLoader().load(urls);
  texture.format = THREE.RGBFormat;
  return texture;
}

async function loadGLTF(src, contentType, preferredTechnique, onProgress) {
  let gltfUrl = src;
  let fileMap;

  if (contentType.includes("model/gltf+zip") || contentType.includes("application/x-zip-compressed")) {
    fileMap = await getFilesFromSketchfabZip(gltfUrl);
    gltfUrl = fileMap["scene.gtlf"];
  }

  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.setLazy(true);

  const { parser } = await new Promise((resolve, reject) => gltfLoader.load(gltfUrl, resolve, onProgress, reject));

  const materials = parser.json.materials;
  if (materials) {
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];

      if (
        material.extensions &&
        material.extensions.MOZ_alt_materials &&
        material.extensions.MOZ_alt_materials[preferredTechnique] !== undefined
      ) {
        const altMaterialIndex = material.extensions.MOZ_alt_materials[preferredTechnique];
        materials[i] = materials[altMaterialIndex];
      }
    }
  }

  if (!CachedEnvMapTexture) {
    CachedEnvMapTexture = loadEnvMap();
  }

  const gltf = await new Promise((resolve, reject) =>
    parser.parse(
      (scene, scenes, cameras, animations, json) => {
        resolve({ scene, scenes, cameras, animations, json });
      },
      e => {
        reject(e);
      }
    )
  );

  const envMap = await CachedEnvMapTexture;

  gltf.scene.traverse(object => {
    object.matrixAutoUpdate = false;

    if (object.material && object.material.type === "MeshStandardMaterial") {
      if (preferredTechnique === "KHR_materials_unlit") {
        object.material = MobileStandardMaterial.fromStandardMaterial(object.material);
      } else {
        object.material.envMap = envMap;
        object.material.needsUpdate = true;
      }
    }
  });

  if (fileMap) {
    // The GLTF is now cached as a THREE object, we can get rid of the original blobs
    Object.keys(fileMap).forEach(URL.revokeObjectURL);
  }

  return gltf;
}

/**
 * Loads a GLTF model, optionally recursively "inflates" the child nodes of a model into a-entities and sets
 * whitelisted components on them if defined in the node's extras.
 * @namespace gltf
 * @component gltf-model-plus
 */
AFRAME.registerComponent("gltf-model-plus", {
  schema: {
    src: { type: "string" },
    contentType: { type: "string" },
    useCache: { default: true },
    inflate: { default: false },
    modelToWorldScale: { type: "number", default: 1 }
  },

  init() {
    this.preferredTechnique =
      window.APP && window.APP.quality === "low" ? "KHR_materials_unlit" : "pbrMetallicRoughness";
    this.loadTemplates();
  },

  update() {
    this.applySrc(this.data.src, this.data.contentType);
  },

  loadTemplates() {
    this.templates = {};
    this.el.querySelectorAll(":scope > template").forEach(templateEl => {
      const root = document.importNode(templateEl.firstElementChild || templateEl.content.firstElementChild, true);
      this.templates[templateEl.getAttribute("data-name")] = root;
    });
  },

  async loadModel(src, contentType, technique, useCache) {
    if (useCache) {
      if (!GLTFCache[src]) {
        GLTFCache[src] = await loadGLTF(src, contentType, technique);
      }

      return cloneGltf(GLTFCache[src]);
    } else {
      return await loadGLTF(src, contentType, technique);
    }
  },

  async applySrc(src, contentType) {
    try {
      // If the src attribute is a selector, get the url from the asset item.
      if (src && src.charAt(0) === "#") {
        const assetEl = document.getElementById(src.substring(1));
        src = assetEl.getAttribute("src");
      }

      if (src === this.lastSrc) return;
      this.lastSrc = src;

      if (!src) {
        if (this.inflatedEl) {
          console.warn("gltf-model-plus set to an empty source, unloading inflated model.");
          this.removeInflatedEl();
        }
        return;
      }

      const gltf = await this.loadModel(src, contentType, this.preferredTechnique, this.data.useCache);

      // If we started loading something else already
      // TODO: there should be a way to cancel loading instead
      if (src != this.lastSrc) return;

      // If we had inflated something already before, clean that up
      this.removeInflatedEl();

      this.model = gltf.scene || gltf.scenes[0];
      this.model.animations = gltf.animations;

      if (gltf.animations.length > 0) {
        this.el.setAttribute("animation-mixer", {});
        this.el.components["animation-mixer"].initMixer(gltf.animations);
      }

      let object3DToSet = this.model;
      if (
        this.data.inflate &&
        (this.inflatedEl = inflateEntities(this.model, this.templates, true, this.data.modelToWorldScale))
      ) {
        this.el.appendChild(this.inflatedEl);

        object3DToSet = this.inflatedEl.object3D;
        // TODO: Still don't fully understand the lifecycle here and how it differs between browsers, we should dig in more
        // Wait one tick for the appended custom elements to be connected before attaching templates
        await nextTick();
        if (src != this.lastSrc) return; // TODO: there must be a nicer pattern for this
        for (const name in this.templates) {
          attachTemplate(this.el, name, this.templates[name]);
        }
      }

      // The call to setObject3D below recursively clobbers any `el` backreferences to entities
      // in the entire inflated entity graph to point to `object3DToSet`.
      //
      // We don't want those overwritten, since lots of code assumes `object3d.el` points to the relevant
      // A-Frame entity for that three.js object, so we back them up and re-wire them here. If we didn't do
      // this, all the `el` properties on these object3ds would point to the `object3DToSet` which is either
      // the model or the root GLTF inflated entity.
      const rewires = [];

      object3DToSet.traverse(o => {
        const el = o.el;
        if (el) rewires.push(() => (o.el = el));
      });

      this.el.setObject3D("mesh", object3DToSet);

      rewires.forEach(f => f());

      this.el.emit("model-loaded", { format: "gltf", model: this.model });
    } catch (e) {
      delete GLTFCache[src];
      console.error("Failed to load glTF model", e, this);
      this.el.emit("model-error", { format: "gltf", src });
    }
  },

  removeInflatedEl() {
    if (this.inflatedEl) {
      this.inflatedEl.parentNode.removeChild(this.inflatedEl);
      delete this.inflatedEl;
    }
  }
});
