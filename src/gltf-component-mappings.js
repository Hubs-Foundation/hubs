import "./components/gltf-model-plus";
import { getSanitizedComponentMapping } from "./utils/component-mappings";

AFRAME.GLTFModelPlus.registerComponent("duck", "duck");
AFRAME.GLTFModelPlus.registerComponent("quack", "quack");
AFRAME.GLTFModelPlus.registerComponent("sound", "sound");
AFRAME.GLTFModelPlus.registerComponent("css-class", "css-class");
AFRAME.GLTFModelPlus.registerComponent("interactable", "css-class", (el, componentName) => {
  el.setAttribute(componentName, "interactable");
});
AFRAME.GLTFModelPlus.registerComponent("super-spawner", "super-spawner");
AFRAME.GLTFModelPlus.registerComponent("gltf-model-plus", "gltf-model-plus");
AFRAME.GLTFModelPlus.registerComponent("media-loader", "media-loader");
AFRAME.GLTFModelPlus.registerComponent("body", "ammo-body", el => {
  //This is only required for migration of old environments with super-spawners
  //will no longer be needed when spawners are added via Spoke instead.
  el.setAttribute("ammo-body", {
    mass: 0,
    type: "static",
    collisionFlags: 4
  });
});
AFRAME.GLTFModelPlus.registerComponent("ammo-shape", "ammo-loader");
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
function decayMigration(el, componentName, componentData) {
  if (componentData.range === 0) {
    componentData.decay = 0;
  }
  el.setAttribute(componentName, componentData);
}
AFRAME.GLTFModelPlus.registerComponent("point-light", "point-light", decayMigration);
AFRAME.GLTFModelPlus.registerComponent("spot-light", "spot-light", decayMigration);

AFRAME.GLTFModelPlus.registerComponent("skybox", "skybox");
AFRAME.GLTFModelPlus.registerComponent("layers", "layers");
AFRAME.GLTFModelPlus.registerComponent("shadow", "shadow");
AFRAME.GLTFModelPlus.registerComponent("water", "water");
AFRAME.GLTFModelPlus.registerComponent("scale-audio-feedback", "scale-audio-feedback");
AFRAME.GLTFModelPlus.registerComponent("animation-mixer", "animation-mixer");
AFRAME.GLTFModelPlus.registerComponent("loop-animation", "loop-animation");
AFRAME.GLTFModelPlus.registerComponent("heightfield", "heightfield");
AFRAME.GLTFModelPlus.registerComponent(
  "box-collider",
  "ammo-shape",
  (() => {
    const euler = new THREE.Euler();
    return (el, componentName, componentData) => {
      const { scale, rotation } = componentData;
      euler.set(rotation.x, rotation.y, rotation.z);
      const orientation = new THREE.Quaternion().setFromEuler(euler);
      el.setAttribute(componentName, {
        type: "box",
        autoGenerateShape: false,
        mergeGeometry: false,
        offset: componentData.position,
        halfExtents: { x: scale.x / 2, y: scale.y / 2, z: scale.z / 2 },
        orientation
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
AFRAME.GLTFModelPlus.registerComponent("spawn-point", "spawn-point");
AFRAME.GLTFModelPlus.registerComponent("hoverable", "hoverable");
AFRAME.GLTFModelPlus.registerComponent("sticky-zone", "sticky-zone");
AFRAME.GLTFModelPlus.registerComponent("nav-mesh", "nav-mesh", (el, _componentName, componentData) => {
  const nav = AFRAME.scenes[0].systems.nav;
  const zone = componentData.zone || "character";
  let found = false;
  el.object3D.traverse(node => {
    if (node.isMesh && !found) {
      found = true;
      nav.loadMesh(node, zone);
    }
  });
  // There isn't actually an a-frame nav-mesh component, but we want to tag this el as a nav-mesh since
  // nav-mesh-helper will query for it later.
  el.setAttribute("nav-mesh");
});

AFRAME.GLTFModelPlus.registerComponent("pinnable", "pinnable");

AFRAME.GLTFModelPlus.registerComponent("media", "media", (el, componentName, componentData) => {
  if (componentData.id) {
    el.setAttribute("networked", {
      template: "#interactable-media",
      owner: "scene",
      persistent: true,
      networkId: componentData.id
    });
  }

  el.setAttribute("media-loader", { src: componentData.src, resize: true, resolve: true, fileIsOwned: true });

  if (componentData.pageIndex) {
    el.setAttribute("media-pager", { index: componentData.pageIndex });
  }

  if (componentData.paused !== undefined) {
    el.setAttribute("media-video", { videoPaused: componentData.paused });
  }

  if (componentData.time) {
    el.setAttribute("media-video", { time: componentData.time });
  }
});

function mediaInflator(el, componentName, componentData, components) {
  if (components.networked) {
    el.setAttribute("networked", {
      template: componentData.controls ? "#static-controlled-media" : "#static-media",
      owner: "scene",
      persistent: true,
      networkId: components.networked.id
    });
  }

  const mediaOptions = {
    projection: componentData.projection
  };

  if (componentName === "video") {
    mediaOptions.videoPaused = !componentData.autoPlay;
    mediaOptions.volume = componentData.volume;
    mediaOptions.loop = componentData.loop;
    mediaOptions.audioType = componentData.audioType;

    if (componentData.audioType === "pannernode") {
      mediaOptions.distanceModel = componentData.distanceModel;
      mediaOptions.rolloffFactor = componentData.rolloffFactor;
      mediaOptions.refDistance = componentData.refDistance;
      mediaOptions.maxDistance = componentData.maxDistance;
      mediaOptions.coneInnerAngle = componentData.coneInnerAngle;
      mediaOptions.coneOuterAngle = componentData.coneOuterAngle;
      mediaOptions.coneOuterGain = componentData.coneOuterGain;
    }

    el.setAttribute("video-pause-state", { paused: mediaOptions.videoPaused });
  }

  el.setAttribute("media-loader", {
    src: componentData.src,
    resize: true,
    resolve: true,
    fileIsOwned: true,
    mediaOptions
  });
}

AFRAME.GLTFModelPlus.registerComponent("image", "image", mediaInflator);
AFRAME.GLTFModelPlus.registerComponent("video", "video", mediaInflator, (name, property, value) => {
  if (property === "paused") {
    return { name: "video-pause-state", property, value };
  } else {
    return null;
  }
});

AFRAME.GLTFModelPlus.registerComponent("spawner", "spawner", (el, componentName, componentData) => {
  el.setAttribute("media-loader", {
    src: componentData.src,
    resolve: true,
    fileIsOwned: true
  });
  el.setAttribute("css-class", "interactable");
  el.setAttribute("super-spawner", {
    src: componentData.src,
    resolve: true,
    template: "#interactable-media"
  });
  el.setAttribute("ammo-body", {
    mass: 0,
    type: "static",
    collisionFlags: 4
  });
  el.setAttribute("ammo-shape", {
    type: "hull",
    recenter: true
  });
  el.setAttribute("hoverable", "");
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

      targetEntity = indexToEntityMap[target];

      if (!targetEntity) {
        throw new Error(`Couldn't find target entity with index: ${target}.`);
      }
    } catch (e) {
      console.warn(`Error inflating gltf component "trigger-volume": ${e.message}`);
      return;
    }

    // Filter out scope and colliders properties.
    el.setAttribute("trigger-volume", {
      colliders: "#player-camera",
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
