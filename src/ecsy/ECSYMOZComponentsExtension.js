import {
  SceneEntity,
  BoneEntity,
  GroupEntity,
  Object3DEntity,
  SkinnedMeshEntity,
  MeshEntity,
  LineSegmentsEntity,
  LineEntity,
  LineLoopEntity,
  PointsEntity,
  PerspectiveCameraEntity,
  OrthographicCameraEntity,
  AmbientLightEntity,
  DirectionalLightEntity,
  HemisphereLightEntity,
  PointLightEntity,
  SpotLightEntity
} from "ecsy-three";

const WebGLDrawMode = {
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6
};

function getComponents(gltfDef) {
  return gltfDef.extensions && gltfDef.extensions.MOZ_hubs_components;
}

function getComponent(gltfDef, componentName) {
  const components = getComponents(gltfDef);
  return components && components[componentName];
}

function ambientLightInflator(world, componentName, props) {
  return new AmbientLightEntity(world, props.color, props.intensity);
}

function directionalLightInflator(world, componentName, props) {
  const light = new DirectionalLightEntity(world, props.color, props.intensity);
  light.castShadow = props.castShadow;
  light.shadow.bias = props.shadowBias;
  light.shadow.radius = props.shadowRadius;
  light.shadow.mapSize.fromArray(props.shadowMapResolution);
  light.position.set(0, 0, 0);
  light.target.position.set(0, 0, 1);
  light.shadow.camera.matrixNeedsUpdate = true;
  light.add(light.target);
  return light;
}

function hemisphereLightInflator(world, componentName, props) {
  const light = new HemisphereLightEntity(world, props.skyColor, props.groundColor, props.intensity);
  light.position.set(0, 0, 0);
  light.matrixNeedsUpdate = true;
  return light;
}

function pointLightInflator(world, componentName, props) {
  const light = new PointLightEntity(world, props.color, props.intensity, props.range, 2);
  light.castShadow = props.castShadow;
  light.shadow.bias = props.shadowBias;
  light.shadow.radius = props.shadowRadius;
  light.shadow.mapSize.fromArray(props.shadowMapResolution);
  light.shadow.camera.matrixAutoUpdate = true;
  return light;
}

function spotLightInflator(world, componentName, props) {
  const light = new SpotLightEntity(world, props.color, props.intensity, props.range);
  light.position.set(0, 0, 0);
  light.target.position.set(0, 0, 1);
  light.add(light.target);
  light.matrixNeedsUpdate = true;
  light.target.matrixNeedsUpdate = true;
  light.angle = props.outerConeAngle;
  light.penumbra = 1.0 - props.innerConeAngle / props.outerConeAngle;
  light.castShadow = props.castShadow;
  light.shadow.bias = props.shadowBias;
  light.shadow.radius = props.shadowRadius;
  light.shadow.mapSize.fromArray(props.shadowMapResolution);
  light.shadow.camera.matrixAutoUpdate = true;
  return light;
}

export default class ECSYMOZComponentsExtension {
  constructor(world, parser) {
    this.world = world;
    this.parser = parser;
    this.name = "MOZ_hubs_components";
    this.entityInflators = {};
    this.componentInflators = {};

    this.registerEntityInflator("ambient-light", ambientLightInflator);
    this.registerEntityInflator("directional-light", directionalLightInflator);
    this.registerEntityInflator("hemisphere-light", hemisphereLightInflator);
    this.registerEntityInflator("point-light", pointLightInflator);
    this.registerEntityInflator("spot-light", spotLightInflator);

    for (const componentName in world.componentTypes) {
      const componentType = world.componentTypes[componentName];

      if (componentType.mozComponentName) {
        const inflator =
          componentType.mozComponentInflator ||
          ((w, node, n, props) => {
            node.addComponent(componentType, props);
          });

        this.registerComponentInflator(componentType.mozComponentName, inflator);
      }
    }
  }

  registerEntityInflator(componentName, inflator) {
    this.entityInflators[componentName] = inflator;
  }

  registerComponentInflator(componentName, inflator) {
    this.componentInflators[componentName] = inflator;
  }

  createScene() {
    return new SceneEntity(this.world);
  }

  createNode(nodeIndex, objects) {
    const world = this.world;
    const parser = this.parser;
    const json = parser.json;
    const nodeDef = json.nodes[nodeIndex];
    let node;

    // .isBone isn't in glTF spec. See .markDefs
    if (nodeDef.isBone === true) {
      node = new BoneEntity(world);
    } else if (objects.length > 1) {
      node = new GroupEntity(world);
    } else if (objects.length === 1) {
      node = objects[0];
    }

    if (!node) {
      node = this.inflateEntity(nodeIndex, nodeDef);
    }

    if (!node) {
      node = new Object3DEntity(world);
    }

    if (node !== objects[0]) {
      for (let i = 0, il = objects.length; i < il; i++) {
        node.add(objects[i]);
      }
    }

    this.inflateComponents(nodeIndex, nodeDef, node);

    return node;
  }

  inflateEntity(nodeIndex, nodeDef) {
    const components = getComponents(nodeDef);

    for (const componentName in components) {
      const entityInflator = this.entityInflators[componentName];

      if (entityInflator) {
        return entityInflator(
          this.world,
          componentName,
          components[componentName],
          components,
          nodeIndex,
          nodeDef,
          this.parser
        );
      }
    }
  }

  inflateComponents(nodeIndex, nodeDef, node) {
    const components = getComponents(nodeDef);

    for (const componentName in components) {
      const componentInflator = this.componentInflators[componentName];

      if (componentInflator) {
        componentInflator(
          this.world,
          node,
          componentName,
          components[componentName],
          components,
          nodeIndex,
          nodeDef,
          this.parser
        );
      }
    }
  }

  finalizeMesh(meshIndex, primitives) {
    if (primitives.length === 1) {
      return primitives[0];
    }

    const group = new GroupEntity(this.world);

    for (let i = 0, il = primitives.length; i < il; i++) {
      group.add(primitives[i]);
    }

    return group;
  }

  createPrimitive(meshIndex, primitiveIndex, geometry, material) {
    const world = this.world;
    const parser = this.parser;
    const json = parser.json;
    const meshDef = json.meshes[meshIndex];
    const primitiveDef = meshDef.primitives[primitiveIndex];

    let primitive;

    if (
      primitiveDef.mode === WebGLDrawMode.TRIANGLES ||
      primitiveDef.mode === WebGLDrawMode.TRIANGLE_STRIP ||
      primitiveDef.mode === WebGLDrawMode.TRIANGLE_FAN ||
      primitiveDef.mode === undefined
    ) {
      // .isSkinnedMesh isn't in glTF spec. See .markDefs()
      primitive =
        meshDef.isSkinnedMesh === true
          ? new SkinnedMeshEntity(world, geometry, material)
          : new MeshEntity(world, geometry, material);
    } else if (primitiveDef.mode === WebGLDrawMode.LINES) {
      primitive = new LineSegmentsEntity(world, geometry, material);
    } else if (primitiveDef.mode === WebGLDrawMode.LINE_STRIP) {
      primitive = new LineEntity(world, geometry, material);
    } else if (primitiveDef.mode === WebGLDrawMode.LINE_LOOP) {
      primitive = new LineLoopEntity(world, geometry, material);
    } else if (primitiveDef.mode === WebGLDrawMode.POINTS) {
      primitive = new PointsEntity(world, geometry, material);
    } else {
      throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + primitiveDef.mode);
    }

    return primitive;
  }

  createCamera(cameraIndex) {
    const world = this.world;
    const cameraDef = this.parser.json.cameras[cameraIndex];

    let camera;

    if (cameraDef.type === "perspective") {
      camera = new PerspectiveCameraEntity(world);
    } else if (cameraDef.type === "orthographic") {
      camera = new OrthographicCameraEntity(world);
    }

    return camera;
  }
}
