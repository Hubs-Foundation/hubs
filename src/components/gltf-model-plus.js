import GLBRangeRequests from "three-gltf-extensions/loaders/GLB_range_requests/GLB_range_requests";
import GLTFLodExtension from "three-gltf-extensions/loaders/MSFT_lod/MSFT_lod";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { BasisTextureLoader } from "three/examples/jsm/loaders/BasisTextureLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import HubsTextureLoader from "../loaders/HubsTextureLoader";
import { convertStandardMaterial, mapMaterials, updateMaterials } from "../utils/material-utils";
import { getCustomGLTFParserURLResolver } from "../utils/media-url-utils";
import nextTick from "../utils/next-tick";
import { promisifyWorker } from "../utils/promisify-worker.js";
import qsTruthy from "../utils/qs_truthy";
import { cloneObject3D, disposeMaterial } from "../utils/three-utils";
import SketchfabZipWorker from "../workers/sketchfab-zip.worker.js";
import { shouldUseNewLoader } from "../utils/bit-utils";

THREE.Mesh.prototype.raycast = acceleratedRaycast;

class GLTFCache {
  cache = new Map();

  set(src, gltf) {
    gltf.scene.userData.gltfCacheKey = src;
    this.cache.set(src, {
      gltf,
      count: 0
    });
    return this.retain(src);
  }

  has(src) {
    return this.cache.has(src);
  }

  get(src) {
    return this.cache.get(src);
  }

  retain(src) {
    const cacheItem = this.cache.get(src);
    cacheItem.count++;
    return cacheItem;
  }

  release(src) {
    const cacheItem = this.cache.get(src);

    if (!cacheItem) {
      console.error(`Releasing uncached gltf ${src}`);
      return;
    }

    cacheItem.count--;
    if (cacheItem.count <= 0) {
      cacheItem.gltf.scene.dispose();
      this.cache.delete(src);
    }
  }
}

export const gltfCache = new GLTFCache();
const inflightGltfs = new Map();

const extractZipFile = promisifyWorker(new SketchfabZipWorker());

function defaultInflator(el, componentName, componentData) {
  if (!AFRAME.components[componentName]) {
    console.warn(`Inflator failed. "${componentName}" component does not exist.`);
    return;
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
    inflator = inflator || defaultInflator;
    AFRAME.GLTFModelPlus.components[componentKey] = { inflator, componentName };
  }
};

function generateMeshBVH(object3D) {
  object3D.traverse(obj => {
    // note that we might already have a bounds tree if this was a clone of an object with one
    const hasBufferGeometry = obj.isMesh && obj.geometry.isBufferGeometry;
    const hasBoundsTree = hasBufferGeometry && obj.geometry.boundsTree;
    if (hasBufferGeometry && !hasBoundsTree && obj.geometry.attributes.position) {
      const geo = obj.geometry;

      if (
        geo.attributes.position.isInterleavedBufferAttribute ||
        (geo.index && geo.index.isInterleavedBufferAttribute)
      ) {
        console.warn("Skipping generaton of MeshBVH for interleaved geoemtry as it is not supported");
        return;
      }

      const triCount = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
      // only bother using memory and time making a BVH if there are a reasonable number of tris,
      // and if there are too many it's too painful and large to tolerate doing it (at least until
      // we put this in a web worker)

      if (triCount > 1000 && triCount < 1000000) {
        // note that bounds tree construction creates an index as a side effect if one doesn't already exist
        geo.boundsTree = new MeshBVH(obj.geometry, { strategy: 0, maxDepth: 30 });
      }
    }
  });
}

function cloneGltf(gltf) {
  const scene = cloneObject3D(gltf.scene);
  return {
    animations: scene.animations,
    scene
  };
}

function getHubsComponents(node) {
  const hubsComponents =
    node.userData.gltfExtensions &&
    (node.userData.gltfExtensions.MOZ_hubs_components || node.userData.gltfExtensions.HUBS_components);

  // We can remove support for legacy components when our environment, avatar and interactable models are
  // updated to match Spoke output.
  const legacyComponents = node.userData.components;

  return hubsComponents || legacyComponents;
}

function getHubsComponentsFromMaterial(node) {
  const material = node.material;

  if (!material) {
    return null;
  }

  return getHubsComponents(material);
}

/// Walks the tree of three.js objects starting at the given node, using the GLTF data
/// and template data to construct A-Frame entities and components when necessary.
/// (It's unnecessary to construct entities for subtrees that have no component data
/// or templates associated with any of their nodes.)
///
/// Returns the A-Frame entity associated with the given node, if one was constructed.
const inflateEntities = function (indexToEntityMap, node, templates, isRoot, modelToWorldScale = 1) {
  // TODO: Remove this once we update the legacy avatars to the new node names
  if (node.name === "Chest") {
    node.name = "Spine";
  } else if (node.name === "Root Scene") {
    node.name = "AvatarRoot";
  } else if (node.name === "Bot_Skinned") {
    node.name = "AvatarMesh";
  }

  // inflate subtrees first so that we can determine whether or not this node needs to be inflated
  const childEntities = [];
  const children = node.children.slice(0); // setObject3D mutates the node's parent, so we have to copy
  for (const child of children) {
    const el = inflateEntities(indexToEntityMap, child, templates);
    if (el) {
      childEntities.push(el);
    }
  }

  const entityComponents = getHubsComponents(node);
  const materialComponents = getHubsComponentsFromMaterial(node);

  const nodeHasBehavior = !!entityComponents || !!materialComponents || node.name in templates;
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
  el.object3D.position.copy(node.position);
  el.object3D.rotation.copy(node.rotation);
  el.object3D.scale.copy(node.scale).multiplyScalar(modelToWorldScale);
  el.object3D.matrixNeedsUpdate = true;

  node.matrixAutoUpdate = false;
  node.matrix.identity();
  node.matrix.decompose(node.position, node.rotation, node.scale);

  el.setObject3D(node.type.toLowerCase(), node);
  if (entityComponents && "nav-mesh" in entityComponents) {
    el.setObject3D("mesh", node);
  }

  // Set the name of the `THREE.Group` to match the name of the node,
  // so that templates can be attached to the correct AFrame entity.
  el.object3D.name = node.name;

  // Set the uuid of the `THREE.Group` to match the uuid of the node,
  // so that `THREE.PropertyBinding` will find (and later animate)
  // the group. See `PropertyBinding.findNode`:
  // https://github.com/mrdoob/three.js/blob/dev/src/animation/PropertyBinding.js#L211
  el.object3D.uuid = node.uuid;
  node.uuid = THREE.MathUtils.generateUUID();

  if (node.animations) {
    // Pass animations up to the group object so that when we can pass the group as
    // the optional root in `THREE.AnimationMixer.clipAction` and use the hierarchy
    // preserved under the group (but not the node). Otherwise `clipArray` will be
    // `null` in `THREE.AnimationClip.findByName`.
    node.parent.animations = node.animations;
  }

  if (node.morphTargetInfluences) {
    node.parent.morphTargetInfluences = node.morphTargetInfluences;
  }

  const gltfIndex = node.userData.gltfIndex;
  if (gltfIndex !== undefined) {
    indexToEntityMap[gltfIndex] = el;
  }

  return el;
};

async function inflateComponents(inflatedEntity, indexToEntityMap) {
  let isFirstInflation = true;
  const objectInflations = [];

  inflatedEntity.object3D.traverse(async object3D => {
    const objectInflation = {};
    objectInflation.promise = new Promise(resolve => (objectInflation.resolve = resolve));
    objectInflations.push(objectInflation);

    if (!isFirstInflation) {
      await objectInflations.shift().promise;
    }
    isFirstInflation = false;

    const entityComponents = getHubsComponents(object3D);
    const el = object3D.el;

    function resolveNodeRefs(componentData) {
      for (const propName in componentData) {
        const value = componentData[propName];
        const type = value?.__mhc_link_type;
        if (type === "node" && value.index !== undefined) {
          if (indexToEntityMap[value.index]) {
            componentData[propName] = indexToEntityMap[value.index].object3D;
          } else {
            console.warn("inflateComponents: invalid node reference", propName);
            componentData[propName] = null;
          }
        }
      }
      return componentData;
    }

    if (entityComponents && el) {
      for (const prop in entityComponents) {
        if (
          Object.prototype.hasOwnProperty.call(entityComponents, prop) &&
          Object.prototype.hasOwnProperty.call(AFRAME.GLTFModelPlus.components, prop)
        ) {
          const { componentName, inflator } = AFRAME.GLTFModelPlus.components[prop];
          await inflator(
            el,
            componentName,
            resolveNodeRefs(entityComponents[prop]),
            entityComponents,
            indexToEntityMap
          );
        }
      }
    }

    const materialComponents = getHubsComponentsFromMaterial(object3D);

    if (materialComponents && el) {
      for (const prop in materialComponents) {
        if (
          Object.prototype.hasOwnProperty.call(materialComponents, prop) &&
          Object.prototype.hasOwnProperty.call(AFRAME.GLTFModelPlus.components, prop)
        ) {
          const { componentName, inflator } = AFRAME.GLTFModelPlus.components[prop];
          await inflator(
            el,
            componentName,
            resolveNodeRefs(materialComponents[prop]),
            materialComponents,
            indexToEntityMap
          );
        }
      }
    }

    objectInflation.resolve();
  });

  await objectInflations.shift().promise;
}

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

function getHubsComponentsExtension(node) {
  if (node.extensions && node.extensions.MOZ_hubs_components) {
    return node.extensions.MOZ_hubs_components;
  } else if (node.extensions && node.extensions.HUBS_components) {
    return node.extensions.HUBS_components;
  } else if (node.extras && node.extras.gltfExtensions && node.extras.gltfExtensions.MOZ_hubs_components) {
    return node.extras.gltfExtensions.MOZ_hubs_components;
  }
}

// Versions are documented here: https://github.com/Hubs-Foundation/hubs/wiki/MOZ_hubs_components-Changelog
// Make sure to update the wiki and Spoke when bumping a version
function runMigration(version, json) {
  if (version < 2) {
    //old heightfields will be on the same node as the nav-mesh, delete those
    const oldHeightfieldNode = json.nodes.find(node => {
      const components = getHubsComponentsExtension(node);
      return components && components.heightfield && components["nav-mesh"];
    });
    if (oldHeightfieldNode) {
      if (oldHeightfieldNode.extensions && oldHeightfieldNode.extensions.MOZ_hubs_components) {
        delete oldHeightfieldNode.extensions.MOZ_hubs_components.heightfield;
      } else if (oldHeightfieldNode.extensions && oldHeightfieldNode.extensions.HUBS_components) {
        delete oldHeightfieldNode.extensions.HUBS_components.heightfield;
      } else if (
        oldHeightfieldNode.extras &&
        oldHeightfieldNode.extras.gltfExtensions &&
        oldHeightfieldNode.extras.gltfExtensions.MOZ_hubs_components
      ) {
        delete oldHeightfieldNode.extras.gltfExtensions.MOZ_hubs_components;
      }
    }
  }

  if (version < 4) {
    // Lights prior to version 4 should treat range === 0 as if it has zero decay
    if (json.nodes) {
      for (const node of json.nodes) {
        const components = getHubsComponentsExtension(node);

        if (!components) {
          continue;
        }

        const light = components["spot-light"] || components["point-light"];

        if (light && light.range === 0) {
          light.decay = 0;
        }
      }
    }
  }
}

const convertStandardMaterialsIfNeeded = object => {
  const materialQuality = window.APP.store.state.preferences.materialQualitySetting;
  updateMaterials(object, material => convertStandardMaterial(material, materialQuality));
  return object;
};

let ktxLoader;
let dracoLoader;

const OBJECT3D_EXT = new Set([
  "ambient-light",
  "audio",
  "directional-light",
  "hemisphere-light",
  "image",
  "link",
  "model",
  "particle-emitter",
  "pdf",
  "point-light",
  "reflection-probe",
  "simple-water",
  "skybox",
  "spot-light",
  "text",
  "video",
  "waypoint"
]);

class GLTFHubsPlugin {
  constructor(parser, jsonPreprocessor) {
    this.parser = parser;
    this.jsonPreprocessor = jsonPreprocessor;
    this.name = "MOZ_hubs_plugin";

    // We override glTF parser textureLoader with our HubsTextureLoader for
    // 1. Clean up the texture image related resources after it is uploaded to WebGL texture
    // 2. Use ImageBitmapLoader if it is available. The latest official Three.js (r128) glTF loader
    //    attempts to use ImageBitmapLoader if it is avaiable except for Firefox.
    //    But we want to use ImageBitmapLoader even for Firefox so we need this overriding hack.
    // But overriding the textureLoader is hacky and it can cause future potential problems
    // especially in upstraming Three.js. So ideally we should replace this hack
    // with the one using more proper APIs like plugin system at some point.
    // Note: Be careful when replacing our Three.js fork with the official upstraming one that
    //       the latest ImageBitmapLoader passes the second argument to createImageBitmap()
    //       but currently createImageBitmap() on Firefox fails if the second argument is defined.
    //       https://bugzilla.mozilla.org/show_bug.cgi?id=1367251
    //       and this is the reason why the official glTF loader doesn't use ImageBitmapLoader
    //       for Firefox. We will need a workaround for that.
    parser.textureLoader = new HubsTextureLoader(parser.options.manager);
  }

  beforeRoot() {
    const parser = this.parser;
    const jsonPreprocessor = this.jsonPreprocessor;

    //
    if (jsonPreprocessor) {
      parser.json = jsonPreprocessor(parser.json);
    }

    // Ideally Hubs components stuffs should be handled in MozHubsComponents plugin?
    let version = 0;
    if (
      parser.json.extensions &&
      parser.json.extensions.MOZ_hubs_components &&
      Object.prototype.hasOwnProperty.call(parser.json.extensions.MOZ_hubs_components, "version")
    ) {
      version = parser.json.extensions.MOZ_hubs_components.version;
    }
    runMigration(version, parser.json);

    // Note: Here may be rewritten with the one with parser.associations
    const nodes = parser.json.nodes;
    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!node.extras) {
          node.extras = {};
        }

        node.extras.gltfIndex = i;

        if (shouldUseNewLoader()) {
          /**
           * This guarantees that components that add Object3Ds (ie. through addObject3DComponent) are not attached to non-Object3D
           * entities as it's not supported in the BitECS loader.
           * This was supported by the AFrame loader so this extension ensures backwards compatibility with all the existing scenes.
           * For more context about this see: https://github.com/Hubs-Foundation/hubs/pull/6121
           */
          if (
            node.mesh !== undefined ||
            node.camera !== undefined ||
            (node.extensions && node.extensions["KHR_lights_punctual"]?.light !== undefined)
          ) {
            const exts = node.extensions?.MOZ_hubs_components;
            if (exts) {
              const children = [];
              for (const [key, value] of Object.entries(exts)) {
                if (OBJECT3D_EXT.has(key)) {
                  const newNode = {
                    name: `${node.name}_${key}`,
                    extensions: {
                      MOZ_hubs_components: { [key]: value }
                    }
                  };
                  delete exts[key];
                  children.push(newNode);
                }
              }
              node.children = node.children || [];
              children.forEach(child => {
                const idx = nodes.push(child) - 1;
                node.children.push(idx);
              });
            }
          }
        }
      }
    }
  }

  afterRoot(gltf) {
    gltf.scene.traverse(object => {
      // GLTFLoader sets matrixAutoUpdate on animated objects, we want to keep the defaults
      // @TODO: Should this be fixed in the gltf loader?
      object.matrixAutoUpdate = THREE.Object3D.DefaultMatrixAutoUpdate;
      convertStandardMaterialsIfNeeded(object);
    });

    // Replace animation target node name with the node uuid.
    // I assume track name is 'nodename.property'.
    if (gltf.animations) {
      for (const animation of gltf.animations) {
        for (const track of animation.tracks) {
          const parsedPath = THREE.PropertyBinding.parseTrackName(track.name);
          for (const scene of gltf.scenes) {
            const node = THREE.PropertyBinding.findNode(scene, parsedPath.nodeName);
            if (node) {
              track.name = track.name.replace(/^[^.]*\./, node.uuid + ".");
              break;
            }
          }
        }
      }
    }

    gltf.scene.animations = gltf.animations;
  }
}

class GLTFHubsComponentsExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = "MOZ_hubs_components";
  }

  afterRoot({ scenes, parser }) {
    const deps = [];

    const resolveComponents = (gltfRootType, obj) => {
      const idx = parser.associations.get(obj)?.[gltfRootType];
      if (idx === undefined) return;
      const ext = parser.json[gltfRootType][idx].extensions?.[this.name];
      if (!ext) return;

      // TODO putting this into userData is a bit silly, we should just inflate here, but entities need to be inflated first...
      obj.userData.gltfExtensions = Object.assign(obj.userData.gltfExtensions || {}, {
        MOZ_hubs_components: ext
      });

      for (const componentName in ext) {
        const props = ext[componentName];
        for (const propName in props) {
          // These components had a variant before mhc_link_type existed that just directly pointed at the node index, fix them
          if (
            ((componentName === "video-texture-target" && propName === "srcNode") ||
              (componentName === "audio-target" && propName === "srcNode")) &&
            typeof props[propName] === "number"
          ) {
            console.warn(
              `Found an outdated ${componentName} 'srcNode' property, fixing. Make sure you are using the latest exporter.`
            );
            props[propName] = {
              __mhc_link_type: "node",
              index: props[propName]
            };
          }

          // It seems to be a pretty common use case to add a link to a media to show a link when hovering.
          // That was supported in the previous loader but in the new loader it loads as two different entities.
          // This hack adds support for linked media using the new loader.
          // Note: For some reason this was not supported for PDFs. Not sure if it's random or if there is a reason.
          if (shouldUseNewLoader()) {
            if (Object.prototype.hasOwnProperty.call(ext, "link")) {
              if (["image", "video", "model"].includes(componentName)) {
                ext["media-link"] = {
                  src: ext.link.href
                };
                delete ext.link;
              }
            }
          }

          const value = props[propName];
          const type = value?.__mhc_link_type;
          if (type && value.index !== undefined) {
            deps.push(
              parser.getDependency(type, value.index).then(loadedDep => {
                // TODO similar to above, this logic being spread out in multiple places is not great...
                // Node references are assumed to always be in the scene graph. These references are late-resolved in inflateComponents
                // otherwise they will need to be updated when cloning (which happens as part of caching).
                if (type === "node") return;

                if (type === "texture" && !parser.json.textures[value.index].extensions?.MOZ_texture_rgbe) {
                  // For now assume all non HDR textures linked in hubs components are sRGB.
                  // We can allow this to be overriden later if needed
                  loadedDep.encoding = THREE.sRGBEncoding;
                }

                props[propName] = loadedDep;

                return loadedDep;
              })
            );
          }
        }
      }
    };

    for (let i = 0; i < scenes.length; i++) {
      // TODO this should be done by GLTLoader
      parser.associations.set(scenes[i], { scenes: i });
      scenes[i].traverse(obj => {
        resolveComponents("scenes", obj);
        resolveComponents("nodes", obj);
        mapMaterials(obj, resolveComponents.bind(this, "materials"));
      });
    }

    return Promise.all(deps);
  }
}

class GLTFHubsLightMapExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = "MOZ_lightmap";
  }

  // @TODO: Ideally we should use extendMaterialParams hook.
  //        But the current official glTF loader doesn't fire extendMaterialParams
  //        hook for unlit and specular-glossiness materials.
  //        So using loadMaterial hook as workaround so far.
  //        Cons is loadMaterial hook is fired as _invokeOne so
  //        if other plugins defining loadMaterial is registered
  //        there is a chance that this light map extension handler isn't called.
  //        The glTF loader should be updated to remove the limitation.
  loadMaterial(materialIndex) {
    const parser = this.parser;
    const json = parser.json;
    const materialDef = json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return null;
    }

    const extensionDef = materialDef.extensions[this.name];

    const pending = [];

    pending.push(parser.loadMaterial(materialIndex));
    pending.push(parser.getDependency("texture", extensionDef.index));

    return Promise.all(pending).then(results => {
      const material = results[0];
      const lightMap = results[1];
      material.lightMap = lightMap;
      material.lightMapIntensity = extensionDef.intensity !== undefined ? extensionDef.intensity : 1;

      // See https://github.com/mrdoob/three.js/pull/23613
      if (material.isMeshBasicMaterial) {
        material.lightMapIntensity *= Math.PI;
      }

      return material;
    });
  }
}

class GLTFHubsTextureBasisExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = "MOZ_HUBS_texture_basis";
    this.basisLoader = null;
  }

  loadTexture(textureIndex) {
    const parser = this.parser;
    const json = parser.json;
    const textureDef = json.textures[textureIndex];

    if (!textureDef.extensions || !textureDef.extensions[this.name]) {
      return null;
    }

    if (this.basisLoader === null) {
      this.basisLoader = new BasisTextureLoader(parser.options.manager).detectSupport(AFRAME.scenes[0].renderer);
    }

    if (!this.basisLoader) {
      // @TODO: Display warning (only if the extension is in extensionsRequired)?
      return null;
    }

    console.warn(`The ${this.name} extension is deprecated, you should use KHR_texture_basisu instead.`);

    const extensionDef = textureDef.extensions[this.name];
    const source = extensionDef.source;

    return parser.loadTextureImage(textureIndex, source, this.basisLoader);
  }
}

class GLTFMozTextureRGBE {
  constructor(parser, loader) {
    this.parser = parser;
    this.loader = loader;
    this.name = "MOZ_texture_rgbe";
  }

  loadTexture(textureIndex) {
    const parser = this.parser;
    const json = parser.json;
    const textureDef = json.textures[textureIndex];

    if (!textureDef.extensions || !textureDef.extensions[this.name]) {
      return null;
    }

    const extensionDef = textureDef.extensions[this.name];
    const source = extensionDef.source;
    return parser.loadTextureImage(textureIndex, source, this.loader).then(t => {
      // TODO pretty severe artifacting when using mipmaps, disable for now
      if (t.minFilter == THREE.NearestMipmapNearestFilter || t.minFilter == THREE.NearestMipmapLinearFilter) {
        t.minFilter = THREE.NearestFilter;
      } else if (t.minFilter == THREE.LinearMipmapNearestFilter || t.minFilter == THREE.LinearMipmapLinearFilter) {
        t.minFilter = THREE.LinearFilter;
      }
      return t;
    });
  }
}

// Hubs loop-animation component has a problem in the spec.
// The loop-animation component can refer to glTF.animations with
// animation names but the glTF specification allows non-unique names
// in glTF.animations so if there are multiple glTF.animations that
// have the same name no one can know what glTF.animations a
// loop-component using that names refers to.
// This plugin converts animation names in the component to
// animation indices to avoid the problem.
// The old loop-animation component handler (without bitECS) seems
// to assume that multiple glTF.animations that have the same name
// have the same animation data and loop-component refers to the
// first glTF.animation of the ones having the same name. This
// plugin follows the assumption for the compatibility.
// Refer to https://github.com/Hubs-Foundation/hubs/pull/6153 for details.
// TODO: Deprecate the loop-animation animation reference with name
class GLTFHubsLoopAnimationComponent {
  constructor(parser) {
    this.parser = parser;
    this.name = "MOZ_hubs_components.loop-animation";
  }

  beforeRoot() {
    const json = this.parser.json;

    if (json.animations === undefined) {
      return;
    }

    // TODO: Optimize if needed
    const findAnimation = name => {
      for (let animationIndex = 0; animationIndex < json.animations.length; animationIndex++) {
        const animationDef = json.animations[animationIndex];
        if (animationDef.name === name) {
          return animationIndex;
        }
      }
      return null;
    };

    // TODO: Optimize if needed
    const collectNodeIndices = (nodeIndex, nodeIndices) => {
      nodeIndices.add(nodeIndex);
      const nodeDef = json.nodes[nodeIndex];

      if (nodeDef.children !== undefined) {
        for (const child of nodeDef.children) {
          collectNodeIndices(child, nodeIndices);
        }
      }

      return nodeIndices;
    };

    const clonedAnimations = [];

    for (let nodeIndex = 0; nodeIndex < json.nodes.length; nodeIndex++) {
      const nodeDef = json.nodes[nodeIndex];

      if (nodeDef.extensions?.MOZ_hubs_components?.["loop-animation"] !== undefined) {
        const extensionDef = nodeDef.extensions.MOZ_hubs_components["loop-animation"];

        if (extensionDef.clip === undefined || extensionDef.clip === "") {
          continue;
        }

        // Converts .clip (name based) to .activeClipIndices (index based).
        // Assumes that .activeClipIndices is undefined
        // if .clip is defined

        const clipNames = extensionDef.clip.split(",");
        const activeClipIndices = [];
        const nodeIndices = collectNodeIndices(nodeIndex, new Set());

        for (const clipName of clipNames) {
          const animationIndex = findAnimation(clipName);

          if (animationIndex === null) {
            continue;
          }

          const clonedAnimation = structuredClone(json.animations[animationIndex]);
          let updated = false;

          for (const channel of clonedAnimation.channels) {
            if (channel.target.node !== undefined && !nodeIndices.has(channel.target.node)) {
              // The old loop-animation handler (without bitECS) seems to retarget
              // the loop-animation component root node if traget node is unfound
              // under the loop-animation component root node.
              // Here follows it for the compatibility, not sure if it's the best approach.
              // Another approach may be to find a glTF.animation that is likely for
              // this node. It may be guessed with target node.
              channel.target.node = nodeIndex;
              updated = true;
            }
          }

          if (updated) {
            // Retargetted so need to add a new glTF.animation.
            activeClipIndices.push(json.animations.length + clonedAnimations.length);
            clonedAnimations.push(clonedAnimation);
          } else {
            activeClipIndices.push(animationIndex);
          }
        }

        extensionDef.activeClipIndices = activeClipIndices;
        delete extensionDef.clip;
      }
    }

    for (const animation of clonedAnimations) {
      json.animations.push(animation);
    }
  }
}

export async function loadGLTF(src, contentType, onProgress, jsonPreprocessor) {
  let gltfUrl = src;
  let fileMap;

  if (contentType && (contentType.includes("model/gltf+zip") || contentType.includes("application/x-zip-compressed"))) {
    fileMap = await extractZipFile(gltfUrl);
    gltfUrl = fileMap["scene.gtlf"];
  }

  const useRangeRequests = qsTruthy("rangerequests");
  const loadingManager = new THREE.LoadingManager();
  loadingManager.setURLModifier(getCustomGLTFParserURLResolver(gltfUrl));
  const gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader
    .register(parser => new GLTFHubsComponentsExtension(parser))
    .register(parser => new GLTFHubsPlugin(parser, jsonPreprocessor))
    .register(parser => new GLTFHubsLightMapExtension(parser))
    .register(parser => new GLTFHubsTextureBasisExtension(parser))
    .register(parser => new GLTFMozTextureRGBE(parser, new RGBELoader().setDataType(THREE.HalfFloatType)))
    .register(parser => new GLTFHubsLoopAnimationComponent(parser))
    .register(
      parser =>
        new GLTFLodExtension(parser, {
          loadingMode: useRangeRequests ? "progressive" : "all",
          onLoadMesh: (lod, mesh, level, lowestLevel) => {
            // Nothing to do for "all" mode
            if (!useRangeRequests) {
              return mesh;
            }

            // Higher levels are progressively loaded on demand.
            // So some post-loading processings done in gltf-model-plus and media-loader
            // need to be done here now.

            // Nothing to do if this is the lowest level mesh.
            if (level === lowestLevel || lod.levels.length === 0) {
              return mesh;
            }

            let lowestMeshLevel = null;
            for (let index = lowestLevel; index > level; index--) {
              if (lod.levels[index].object.type !== "Object3D") {
                lowestMeshLevel = index;
                break;
              }
            }

            if (lowestMeshLevel === null) {
              return mesh;
            }

            // Create a mesh clone. Otherwise if an lod instance is cloned before higher
            // levels are loaded the lods instance can refer to the same mesh instance,
            // therefore the lods can be broken because an object can't be placed
            // at multiple places in a Three.js scene tree.
            mesh = mesh.clone();

            convertStandardMaterialsIfNeeded(mesh);

            // A hacky solution. media-loader and media-utils make a material clone
            // and inject shader code chunk for hover effects on before compile hook
            // as a post-loading process. Here simulates them.
            // @TODO: Check if this always works. Replace with a better and simpler solution.
            const currentOnBeforeRender = mesh.material.onBeforeRender;
            mesh.material = mesh.material.clone();
            mesh.material.onBeforeRender = currentOnBeforeRender;

            // onBeforeCompile of the material of the lowest level mesh should be
            // already set up because the lowest level should be loaded first.
            mesh.material.onBeforeCompile = lod.levels[lowestMeshLevel].object.material.onBeforeCompile;

            return mesh;
          }
        })
    );

  // TODO some models are loaded before the renderer exists. This is likely things like the camera tool and loading cube.
  // They don't currently use KTX textures but if they did this would be an issue. Fixing this is hard but is part of
  // "taking control of the render loop" which is something we want to tackle for many reasons.
  if (!ktxLoader && AFRAME && AFRAME.scenes && AFRAME.scenes[0]) {
    ktxLoader = new KTX2Loader(loadingManager).detectSupport(AFRAME.scenes[0].renderer);
  }
  if (!dracoLoader && AFRAME && AFRAME.scenes && AFRAME.scenes[0]) {
    dracoLoader = new DRACOLoader(loadingManager);
  }

  if (ktxLoader) {
    gltfLoader.setKTX2Loader(ktxLoader);
  }
  if (dracoLoader) {
    gltfLoader.setDRACOLoader(dracoLoader);
  }

  return new Promise((resolve, reject) => {
    const onLoad = gltf => {
      const disposables = new Set();

      gltf.scenes.forEach(scene => {
        scene.traverse(obj => {
          if (obj.geometry) {
            disposables.add(obj.geometry);
          }

          mapMaterials(obj, function (m) {
            disposables.add(m);
          });

          const mozHubsComponents = obj.userData.gltfExtensions?.MOZ_hubs_components;
          if (mozHubsComponents) {
            for (const name in mozHubsComponents) {
              const componentData = mozHubsComponents[name];
              for (const propName in componentData) {
                const propValue = componentData[propName];
                if (propValue && (propValue.isTexture || propValue.isGeometry)) {
                  disposables.add(propValue);
                }
              }
            }
          }
        });

        scene.associations = gltf.parser.associations;
        scene.dispose = function dispose() {
          disposables.forEach(disposable => {
            if (disposable.isMaterial) {
              disposeMaterial(disposable);
            } else {
              disposable.dispose();
            }
          });
        };
      });

      resolve(gltf);
    };
    if (useRangeRequests) {
      GLBRangeRequests.load(gltfUrl, gltfLoader, onLoad, onProgress, reject);
    } else {
      gltfLoader.load(gltfUrl, onLoad, onProgress, reject);
    }
  }).finally(() => {
    if (fileMap) {
      // The GLTF is now cached as a THREE object, we can get rid of the original blobs
      Object.keys(fileMap).forEach(URL.revokeObjectURL);
    }
  });
}

export function cloneModelFromCache(src) {
  if (gltfCache.has(src)) {
    gltfCache.retain(src);
    return cloneGltf(gltfCache.get(src).gltf);
  } else {
    throw new Error(`Model not in cache: ${src}`);
  }
}

/**
 * @param {string} src
 * @param {string|null} [contentType]
 * @param {boolean} [useCache]
 * @param {null|(json:any)=>any} [jsonPreprocessor]
 */
export async function loadModel(src, contentType = null, useCache = false, jsonPreprocessor = null) {
  console.log(`Loading model ${src}`);
  if (useCache) {
    if (gltfCache.has(src)) {
      gltfCache.retain(src);
      return cloneGltf(gltfCache.get(src).gltf);
    } else {
      if (inflightGltfs.has(src)) {
        const gltf = await inflightGltfs.get(src);
        gltfCache.retain(src);
        return cloneGltf(gltf);
      } else {
        const promise = loadGLTF(src, contentType, null, jsonPreprocessor);
        inflightGltfs.set(src, promise);
        const gltf = await promise;
        inflightGltfs.delete(src);
        gltfCache.set(src, gltf);
        return cloneGltf(gltf);
      }
    }
  } else {
    return loadGLTF(src, contentType, null, jsonPreprocessor);
  }
}

function resolveAsset(src) {
  // If the src attribute is a selector, get the url from the asset item.
  if (src && src.charAt(0) === "#") {
    const assetEl = document.getElementById(src.substring(1));
    if (assetEl) {
      return assetEl.getAttribute("src");
    }
  }
  return src;
}

/**
 * Loads a GLTF model, optionally recursively "inflates" the child nodes of a model into a-entities and sets
 * allowed components on them if defined in the node's extras.
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
    // This can be set externally if a consumer wants to do some node preprocssing.
    this.jsonPreprocessor = null;

    this.loadTemplates();
  },

  play() {
    this.el.components["listed-media"] && this.el.sceneEl.emit("listed_media_changed");
  },

  update() {
    this.applySrc(resolveAsset(this.data.src), this.data.contentType);
  },

  remove() {
    if (this.data.useCache) {
      const src = resolveAsset(this.data.src);
      if (src) {
        gltfCache.release(src);
      }
    }
  },

  loadTemplates() {
    this.templates = {};
    this.el.querySelectorAll(":scope > template").forEach(templateEl => {
      const root = document.importNode(templateEl.firstElementChild || templateEl.content.firstElementChild, true);
      this.templates[templateEl.getAttribute("data-name")] = root;
    });
  },

  async applySrc(src, contentType) {
    try {
      if (src === this.lastSrc) return;

      const lastSrc = this.lastSrc;
      this.lastSrc = src;

      if (!src) {
        if (this.inflatedEl) {
          console.warn("gltf-model-plus set to an empty source, unloading inflated model.");
          this.disposeLastInflatedEl();
        }
        return;
      }

      this.el.emit("model-loading");
      const gltf = await loadModel(src, contentType, this.data.useCache, this.jsonPreprocessor);

      // If we started loading something else already
      // TODO: there should be a way to cancel loading instead
      if (src != this.lastSrc) return;

      // If we had inflated something already before, clean that up
      this.disposeLastInflatedEl();

      this.model = gltf.scene;

      if (gltf.animations.length > 0) {
        this.el.setAttribute("animation-mixer", {});
        this.el.components["animation-mixer"].initMixer(gltf.animations);
      } else {
        generateMeshBVH(this.model);
      }

      const indexToEntityMap = {};

      let object3DToSet = this.model;
      if (
        this.data.inflate &&
        (this.inflatedEl = inflateEntities(
          indexToEntityMap,
          this.model,
          this.templates,
          true,
          this.data.modelToWorldScale
        ))
      ) {
        this.el.appendChild(this.inflatedEl);

        object3DToSet = this.inflatedEl.object3D;
        object3DToSet.visible = false;

        // TODO: Still don't fully understand the lifecycle here and how it differs between browsers, we should dig in more
        // Wait one tick for the appended custom elements to be connected before attaching templates
        await nextTick();
        if (src != this.lastSrc) return; // TODO: there must be a nicer pattern for this

        await inflateComponents(this.inflatedEl, indexToEntityMap);

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

      if (lastSrc && this.data.useCache) {
        gltfCache.release(lastSrc);
      }
      this.el.setObject3D("mesh", object3DToSet);

      rewires.forEach(f => f());

      object3DToSet.visible = true;
      this.el.emit("model-loaded", { format: "gltf", model: object3DToSet });
    } catch (e) {
      gltfCache.release(src);
      console.error("Failed to load glTF model", e, this);
      this.el.emit("model-error", { format: "gltf", src });
    }
  },

  disposeLastInflatedEl() {
    if (this.inflatedEl) {
      this.inflatedEl.parentNode.removeChild(this.inflatedEl);

      this.inflatedEl.object3D.traverse(x => {
        if (x.material && x.material.dispose) {
          x.material.dispose();
        }

        if (x.geometry) {
          if (x.geometry.dispose) {
            x.geometry.dispose();
          }

          x.geometry.boundsTree = null;
        }
      });

      delete this.inflatedEl;

      this.el.removeAttribute("animation-mixer");
    }
  }
});
