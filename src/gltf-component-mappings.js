import { sanitizeUrl } from "@braintree/sanitize-url";
import "./components/gltf-model-plus";
import { getSanitizedComponentMapping } from "./utils/component-mappings";
import { TYPE, SHAPE, FIT } from "three-ammo/constants";
const COLLISION_LAYERS = require("./constants").COLLISION_LAYERS;
import { AudioType, DistanceModelType, SourceType } from "./components/audio-params";
import { updateAudioSettings } from "./update-audio-settings";

AFRAME.GLTFModelPlus.registerComponent("duck", "duck", el => {
  el.setAttribute("duck", "");
  el.setAttribute("quack", { quackPercentage: 0.1 });
});
AFRAME.GLTFModelPlus.registerComponent("quack", "quack");
AFRAME.GLTFModelPlus.registerComponent("sound", "sound");
AFRAME.GLTFModelPlus.registerComponent("css-class", "css-class");
AFRAME.GLTFModelPlus.registerComponent("interactable", "css-class", (el, componentName) => {
  el.setAttribute(componentName, "interactable");
});
AFRAME.GLTFModelPlus.registerComponent("super-spawner", "super-spawner", (el, componentName, componentData) => {
  //TODO: Do not automatically add these components
  el.setAttribute("is-remote-hover-target", "");
  el.setAttribute("tags", { isHandCollisionTarget: true });
  el.setAttribute("hoverable-visuals", "");
  el.setAttribute(componentName, componentData);
});
AFRAME.GLTFModelPlus.registerComponent("gltf-model-plus", "gltf-model-plus");
AFRAME.GLTFModelPlus.registerComponent("media-loader", "media-loader");
AFRAME.GLTFModelPlus.registerComponent("body", "body-helper", el => {
  //This is only required for migration of old environments with super-spawners
  //will no longer be needed when spawners are added via Spoke instead.
  el.setAttribute("body-helper", {
    mass: 0,
    type: TYPE.STATIC,
    collisionFilterGroup: COLLISION_LAYERS.INTERACTABLES,
    collisionFilterMask: COLLISION_LAYERS.DEFAULT_SPAWNER
  });
});
AFRAME.GLTFModelPlus.registerComponent("ammo-shape", "shape-helper");
AFRAME.GLTFModelPlus.registerComponent("hide-when-quality", "hide-when-quality");
AFRAME.GLTFModelPlus.registerComponent("light", "light", (el, componentName, componentData) => {
  if (componentData.distance === 0) {
    componentData.decay = 0;
  }
  el.setAttribute(componentName, componentData);
  if (componentData.castShadow) {
    // HACK: component.light isn't set until one frame after setArrtibute
    setTimeout(() => {
      el.components.light.light.shadow.camera.matrixNeedsUpdate = true;
    }, 0);
  }
});
AFRAME.GLTFModelPlus.registerComponent("ambient-light", "ambient-light");
AFRAME.GLTFModelPlus.registerComponent("directional-light", "directional-light");
AFRAME.GLTFModelPlus.registerComponent("hemisphere-light", "hemisphere-light");
AFRAME.GLTFModelPlus.registerComponent("point-light", "point-light");
AFRAME.GLTFModelPlus.registerComponent("spot-light", "spot-light");
AFRAME.GLTFModelPlus.registerComponent("billboard", "billboard");
AFRAME.GLTFModelPlus.registerComponent("simple-water", "simple-water");
AFRAME.GLTFModelPlus.registerComponent("skybox", "skybox");
AFRAME.GLTFModelPlus.registerComponent("layers", "layers");
AFRAME.GLTFModelPlus.registerComponent("shadow", "shadow");
AFRAME.GLTFModelPlus.registerComponent("water", "water");
AFRAME.GLTFModelPlus.registerComponent("scale-audio-feedback", "scale-audio-feedback");
AFRAME.GLTFModelPlus.registerComponent("morph-audio-feedback", "morph-audio-feedback");
AFRAME.GLTFModelPlus.registerComponent("animation-mixer", "animation-mixer");
AFRAME.GLTFModelPlus.registerComponent("loop-animation", "loop-animation");
AFRAME.GLTFModelPlus.registerComponent("uv-scroll", "uv-scroll");
AFRAME.GLTFModelPlus.registerComponent("frustrum", "frustrum");
AFRAME.GLTFModelPlus.registerComponent("mirror", "mirror");
AFRAME.GLTFModelPlus.registerComponent(
  "box-collider",
  "shape-helper",
  (() => {
    const euler = new THREE.Euler();
    return (el, componentName, componentData) => {
      const { scale, rotation } = componentData;
      euler.set(rotation.x, rotation.y, rotation.z);
      const orientation = new THREE.Quaternion().setFromEuler(euler);
      el.setAttribute(componentName, {
        type: SHAPE.BOX,
        fit: FIT.MANUAL,
        offset: componentData.position,
        halfExtents: { x: scale.x / 2, y: scale.y / 2, z: scale.z / 2 },
        orientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w }
      });
    };
  })()
);
AFRAME.GLTFModelPlus.registerComponent("visible", "visible", (el, componentName, componentData) => {
  if (typeof componentData === "object") {
    el.setAttribute(componentName, componentData.visible);
  } else {
    el.setAttribute(componentName, componentData);
  }
});
AFRAME.GLTFModelPlus.registerComponent("spawn-point", "spawn-point", el => {
  el.setAttribute("waypoint", {
    canBeSpawnPoint: true,
    canBeOccupied: false,
    canBeClicked: false,
    willDisableMotion: false,
    willDisableTeleporting: false,
    willMaintainWorldUp: true
  });
});

AFRAME.GLTFModelPlus.registerComponent("nav-mesh", "nav-mesh");

AFRAME.GLTFModelPlus.registerComponent("pinnable", "pinnable");

AFRAME.GLTFModelPlus.registerComponent("waypoint", "waypoint", (el, componentName, componentData, components) => {
  if (componentData.canBeOccupied) {
    el.setAttribute("networked", {
      template: "#template-waypoint-avatar",
      attachTemplateToLocal: false,
      owner: "scene",
      persistent: true,
      networkId: components.networked.id
    });
  }
  el.setAttribute("waypoint", componentData);
});

AFRAME.GLTFModelPlus.registerComponent("media-frame", "media-frame", (el, componentName, componentData, components) => {
  el.setAttribute("networked", {
    template: "#interactable-media-frame",
    owner: "scene",
    persistent: true,
    networkId: components.networked.id
  });
  el.setAttribute("shape-helper", {
    type: "box",
    fit: "manual",
    halfExtents: {
      x: componentData.bounds.x / 2,
      y: componentData.bounds.y / 2,
      z: componentData.bounds.z / 2
    }
  });
  el.setAttribute("media-frame", componentData);
});

AFRAME.GLTFModelPlus.registerComponent("media", "media", (el, componentName, componentData) => {
  if (componentData.id) {
    el.setAttribute("networked", {
      template: "#interactable-media",
      owner: "scene",
      persistent: true,
      networkId: componentData.id
    });
  }

  const mediaLoaderAttributes = {
    src: sanitizeUrl(componentData.src),
    fitToBox: componentData.contentSubtype ? false : true,
    resolve: true,
    fileIsOwned: true,
    animate: false,
    contentSubtype: componentData.contentSubtype
  };

  if (componentData.version) {
    mediaLoaderAttributes.version = componentData.version;
  }

  el.setAttribute("media-loader", mediaLoaderAttributes);

  if (componentData.pageIndex) {
    el.setAttribute("media-pdf", { index: componentData.pageIndex });
    el.setAttribute("media-pager", { index: componentData.pageIndex });
  }

  if (componentData.paused !== undefined) {
    el.setAttribute("media-video", { videoPaused: componentData.paused });
  }

  if (componentData.time) {
    el.setAttribute("media-video", { time: componentData.time });
  }
});

async function mediaInflator(el, componentName, componentData, components) {
  let isControlled = true;

  if (componentName === "link" && (components.video || components.image)) {
    // video/image component will set link url specified in link component.
    return;
  }

  if (components.networked) {
    isControlled = componentData.controls || componentName === "link";

    const hasVolume = componentName === "video" || componentName === "audio";
    const templateName =
      componentName === "model" || isControlled || hasVolume ? "#static-controlled-media" : "#static-media";

    el.setAttribute("networked", {
      template: templateName,
      owner: "scene",
      persistent: true,
      networkId: components.networked.id
    });
  }

  const mediaOptions = {};

  if (componentName === "video" || componentName === "image") {
    mediaOptions.projection = componentData.projection;
    mediaOptions.alphaMode = componentData.alphaMode;
    mediaOptions.alphaCutoff = componentData.alphaCutoff;
  }

  if (componentName === "video" || componentName === "audio") {
    mediaOptions.videoPaused = !componentData.autoPlay;
    mediaOptions.loop = componentData.loop;
    mediaOptions.hidePlaybackControls = !isControlled;

    if (componentData.audioType) {
      // This is an old version of this component, which had built-in audio parameters.
      // The way we are handling it is wrong. If a user created a scene with this old version
      // of the component, all of these parameters will be present whether the user explicitly set
      // the values for them or not. But really, they should only count as "overrides" if the user
      // meant for them to take precendence over the app and scene defaults.
      // TODO: Fix this issue. One option is to just ignore this component data, which might break old scenes
      //       but simplifying the handling. Another option is to compare the component data here with
      //       the "defaults" and only save the values that are different from the defaults. However,
      //       this loses information if the user changed the scene settings but wanted this specific
      //       node to use the "defaults".
      //       I don't see a perfect solution here and would prefer not to handle the "legacy" components.
      //
      // For legacy components we don't want artificial distance based attenuation to be applied to stereo audios
      // so we set the distanceModel and rolloffFactor so the attenuation is always 1. The artificial distance based
      // attenuation is calculated in the gain system for stereo audios.
      APP.audioOverrides.set(el, {
        audioType: componentData.audioType,
        distanceModel:
          componentData.audioType === AudioType.Stereo ? DistanceModelType.Linear : componentData.distanceModel,
        rolloffFactor: componentData.audioType === AudioType.Stereo ? 0 : componentData.rolloffFactor,
        refDistance: componentData.refDistance,
        maxDistance: componentData.maxDistance,
        coneInnerAngle: componentData.coneInnerAngle,
        coneOuterAngle: componentData.coneOuterAngle,
        coneOuterGain: componentData.coneOuterGain,
        gain: componentData.volume
      });
      APP.sourceType.set(el, SourceType.MEDIA_VIDEO);

      const audio = APP.audios.get(el);
      if (audio) {
        updateAudioSettings(el, audio);
      }
    }

    el.setAttribute("video-pause-state", { paused: mediaOptions.videoPaused });
  }

  if ((componentName === "video" || componentName === "image") && components.link) {
    mediaOptions.href = sanitizeUrl(components.link.href);
  }

  const src = componentName === "link" ? componentData.href : componentData.src;

  el.setAttribute("media-loader", {
    src: sanitizeUrl(src),
    fitToBox: true,
    resolve: true,
    fileIsOwned: true,
    animate: false,
    mediaOptions,
    moveTheParentNotTheMesh: true
  });
}

AFRAME.GLTFModelPlus.registerComponent("model", "model", mediaInflator);
AFRAME.GLTFModelPlus.registerComponent("image", "image", mediaInflator);
AFRAME.GLTFModelPlus.registerComponent("audio", "audio", mediaInflator, (name, property, value) => {
  if (property === "paused") {
    return { name: "video-pause-state", property, value };
  } else {
    return null;
  }
});
AFRAME.GLTFModelPlus.registerComponent("video", "video", mediaInflator, (name, property, value) => {
  if (property === "paused") {
    return { name: "video-pause-state", property, value };
  } else {
    return null;
  }
});
AFRAME.GLTFModelPlus.registerComponent("link", "link", mediaInflator);

AFRAME.GLTFModelPlus.registerComponent("hoverable", "is-remote-hover-target", el => {
  el.setAttribute("is-remote-hover-target", "");
  el.setAttribute("tags", { isHandCollisionTarget: true });
});

AFRAME.GLTFModelPlus.registerComponent("spawner", "spawner", (el, componentName, componentData) => {
  el.setAttribute("media-loader", {
    src: sanitizeUrl(componentData.src),
    resolve: true,
    fileIsOwned: true,
    animate: false,
    moveTheParentNotTheMesh: true
  });
  el.setAttribute("css-class", "interactable");
  el.setAttribute("super-spawner", {
    src: sanitizeUrl(componentData.src),
    resolve: true,
    template: "#interactable-media",
    mediaOptions: componentData.mediaOptions || {}
  });
  el.setAttribute("hoverable-visuals", "");
  el.setAttribute("body-helper", {
    mass: 0,
    type: TYPE.STATIC,
    collisionFilterGroup: COLLISION_LAYERS.INTERACTABLES,
    collisionFilterMask: COLLISION_LAYERS.DEFAULT_SPAWNER
  });
  el.setAttribute("is-remote-hover-target", "");
  el.setAttribute("tags", { isHandCollisionTarget: true });
});

const publicComponents = {
  video: {
    mappedComponent: "video-pause-state",
    publicProperties: {
      paused: {
        mappedProperty: "paused",
        getMappedValue(value) {
          return !!value;
        }
      }
    }
  },
  "loop-animation": {
    mappedComponent: "loop-animation",
    publicProperties: {
      paused: {
        mappedProperty: "paused",
        getMappedValue(value) {
          return !!value;
        }
      }
    }
  }
};

AFRAME.GLTFModelPlus.registerComponent(
  "trigger-volume",
  "trigger-volume",
  (el, componentName, componentData, components, indexToEntityMap) => {
    const {
      size,
      target,
      enterComponent,
      enterProperty,
      enterValue,
      leaveComponent,
      leaveProperty,
      leaveValue
    } = componentData;

    let enterComponentMapping, leaveComponentMapping, targetEntity;

    try {
      enterComponentMapping = getSanitizedComponentMapping(enterComponent, enterProperty, publicComponents);
      leaveComponentMapping = getSanitizedComponentMapping(leaveComponent, leaveProperty, publicComponents);

      // indexToEntityMap should be considered depredcated. These references are now resovled by the GLTFHubsComponentExtension
      if (typeof target === "number") {
        targetEntity = indexToEntityMap[target];
      } else {
        targetEntity = target?.el;
      }

      if (!targetEntity) {
        throw new Error(`Couldn't find target entity with index: ${target}.`);
      }
    } catch (e) {
      console.warn(`Error inflating gltf component "trigger-volume": ${e.message}`);
      return;
    }

    // Filter out scope and colliders properties.
    el.setAttribute("trigger-volume", {
      colliders: "#avatar-pov-node",
      size,
      target: targetEntity,
      enterComponent: enterComponentMapping.mappedComponent,
      enterProperty: enterComponentMapping.mappedProperty,
      enterValue: enterComponentMapping.getMappedValue(enterValue),
      leaveComponent: leaveComponentMapping.mappedComponent,
      leaveProperty: leaveComponentMapping.mappedProperty,
      leaveValue: leaveComponentMapping.getMappedValue(leaveValue)
    });
  }
);

AFRAME.GLTFModelPlus.registerComponent("heightfield", "heightfield", (el, componentName, componentData) => {
  el.setAttribute("shape-helper__heightfield", {
    type: SHAPE.HEIGHTFIELD,
    margin: 0.01,
    fit: FIT.MANUAL,
    heightfieldDistance: componentData.distance,
    offset: componentData.offset,
    heightfieldData: componentData.data
  });
});

AFRAME.GLTFModelPlus.registerComponent("trimesh", "trimesh", el => {
  el.setAttribute("shape-helper__trimesh", {
    type: SHAPE.MESH,
    margin: 0.01,
    fit: FIT.ALL,
    includeInvisible: true
  });
});

AFRAME.GLTFModelPlus.registerComponent("particle-emitter", "particle-emitter");

AFRAME.GLTFModelPlus.registerComponent("networked-drawing-buffer", "networked-drawing-buffer");

AFRAME.GLTFModelPlus.registerComponent("audio-settings", "audio-settings", (el, _componentName, componentData) => {
  const removeUndefined = obj => {
    return Object.entries(obj).reduce((result, [key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
      return result;
    }, {});
  };
  // TODO: This component should only overwrite the scene audio defaults if this
  //       component is on the scene node. If this component is on some other node
  //       we don't care about it and should ignore it.
  APP.sceneAudioDefaults.set(
    SourceType.MEDIA_VIDEO,
    removeUndefined({
      distanceModel: componentData.mediaDistanceModel,
      rolloffFactor: componentData.mediaRolloffFactor,
      refDistance: componentData.mediaRefDistance,
      maxDistance: componentData.mediaMaxDistance,
      coneInnerAngle: componentData.mediaConeInnerAngle,
      coneOuterAngle: componentData.mediaConeOuterAngle,
      coneOuterGain: componentData.mediaConeOuterGain,
      gain: componentData.mediaVolume
    })
  );
  APP.sceneAudioDefaults.set(
    SourceType.AVATAR_AUDIO_SOURCE,
    removeUndefined({
      distanceModel: componentData.avatarDistanceModel,
      rolloffFactor: componentData.avatarRolloffFactor,
      refDistance: componentData.avatarRefDistance,
      maxDistance: componentData.avatarMaxDistance,
      coneInnerAngle: componentData.avatarConeInnerAngle,
      coneOuterAngle: componentData.avatarConeOuterAngle,
      coneOuterGain: componentData.avatarConeOuterGain,
      gain: componentData.avatarVolume
    })
  );
  for (const [el, audio] of APP.audios.entries()) {
    updateAudioSettings(el, audio);
  }
});

AFRAME.GLTFModelPlus.registerComponent(
  "video-texture-target",
  "video-texture-target",
  (el, componentName, componentData, _components, indexToEntityMap) => {
    const { targetBaseColorMap, targetEmissiveMap, srcNode } = componentData;

    let srcEl;
    if (srcNode !== undefined) {
      // indexToEntityMap should be considered depredcated. These references are now resovled by the GLTFHubsComponentExtension
      if (typeof srcNode === "number") {
        srcEl = indexToEntityMap[srcNode];
      } else {
        srcEl = srcNode?.el;
      }
      if (!srcEl) {
        console.warn(
          `Error inflating gltf component "video-texture-srcEl": Couldn't find srcEl entity with index ${srcNode}`
        );
      }
    }

    el.setAttribute(componentName, {
      src: srcEl ? "el" : "",
      targetBaseColorMap,
      targetEmissiveMap,
      srcEl
    });
  }
);

AFRAME.GLTFModelPlus.registerComponent("video-texture-source", "video-texture-source");

AFRAME.GLTFModelPlus.registerComponent("text", "text");

AFRAME.GLTFModelPlus.registerComponent(
  "audio-target",
  "audio-target",
  (el, componentName, componentData, _components, indexToEntityMap) => {
    const { srcNode } = componentData;

    let srcEl;
    if (srcNode !== undefined) {
      // indexToEntityMap should be considered depredcated. These references are now resovled by the GLTFHubsComponentExtension
      if (typeof srcNode === "number") {
        srcEl = indexToEntityMap[srcNode];
      } else {
        srcEl = srcNode?.el;
      }
      if (!srcEl) {
        console.warn(
          `Error inflating gltf component ${componentName}: Couldn't find srcEl entity with index ${srcNode}`
        );
      }
    }

    if (componentData.positional !== undefined) {
      // This is an old version of the audio-target component, which had built-in audio parameters.
      // The way we are handling it is wrong. If a user created a scene in spoke with this old version
      // of this component, all of these parameters will be present whether the user explicitly set
      // the values for them or not. But really, they should only count as "overrides" if the user
      // meant for them to take precendence over the app and scene defaults.
      // TODO: Fix this issue. One option is to just ignore this component data, which might break old scenes
      //       but simplifying the handling. Another option is to compare the component data here with
      //       the "defaults" and only save the values that are different from the defaults. However,
      //       this loses information if the user changed the scene settings but wanted this specific
      //       node to use the "defaults".
      //       I don't see a perfect solution here and would prefer not to handle the "legacy" components.
      APP.audioOverrides.set(el, {
        audioType: componentData.positional ? AudioType.PannerNode : AudioType.Stereo,
        distanceModel: componentData.distanceModel,
        rolloffFactor: componentData.rolloffFactor,
        refDistance: componentData.refDistance,
        maxDistance: componentData.maxDistance,
        coneInnerAngle: componentData.coneInnerAngle,
        coneOuterAngle: componentData.coneOuterAngle,
        coneOuterGain: componentData.coneOuterGain,
        gain: componentData.gain
      });
      APP.sourceType.set(el, SourceType.AUDIO_TARGET);

      const audio = APP.audios.get(el);
      if (audio) {
        updateAudioSettings(el, audio);
      }
    }

    el.setAttribute(componentName, {
      minDelay: componentData.minDelay,
      maxDelay: componentData.maxDelay,
      debug: componentData.debug,
      srcEl
    });
  }
);
AFRAME.GLTFModelPlus.registerComponent("zone-audio-source", "zone-audio-source");

AFRAME.GLTFModelPlus.registerComponent("audio-params", "audio-params", (el, componentName, componentData) => {
  APP.audioOverrides.set(el, componentData);
  const audio = APP.audios.get(el);
  if (audio) {
    updateAudioSettings(el, audio);
  }
});

AFRAME.GLTFModelPlus.registerComponent("audio-zone", "audio-zone", (el, componentName, componentData) => {
  el.setAttribute(componentName, { ...componentData });
});

AFRAME.GLTFModelPlus.registerComponent("background", "background", (el, _componentName, componentData) => {
  console.warn(
    "The `background` component is deprecated, use `backgroundColor` on the `environment-settings` component instead."
  );
  // This assumes the background component is on the root entity, which it is for spoke, the only thing using this component
  el.setAttribute("environment-settings", { backgroundColor: new THREE.Color(componentData.color) });
});

AFRAME.GLTFModelPlus.registerComponent("fog", "fog", (el, _componentName, componentData) => {
  // TODO need to actually implement this in blender exporter before showing this warning
  // console.warn(
  //   "The `fog` component is deprecated, use the fog properties on the `environment-settings` component instead."
  // );
  // This assumes the fog component is on the root entitycoco
  el.setAttribute("environment-settings", {
    fogType: componentData.type,
    fogColor: new THREE.Color(componentData.color),
    fogNear: componentData.near,
    fogFar: componentData.far,
    fogDensity: componentData.density
  });
});

AFRAME.GLTFModelPlus.registerComponent(
  "environment-settings",
  "environment-settings",
  (el, componentName, componentData) => {
    // TODO a bit silly to be storing this as an aframe component. Use a glboal store of some sort
    el.setAttribute(componentName, {
      ...componentData,
      backgroundColor: new THREE.Color(componentData.backgroundColor)
    });
  }
);

AFRAME.GLTFModelPlus.registerComponent("reflection-probe", "reflection-probe", (el, componentName, componentData) => {
  // TODO PMREMGenerator should be fixed to not assume this
  componentData.envMapTexture.flipY = true;
  // Assume texture is always an equirect for now
  componentData.envMapTexture.mapping = THREE.EquirectangularReflectionMapping;

  el.setAttribute(componentName, componentData);
});
