import Store from "./storage/store";
import MediaSearchStore from "./storage/media-search-store";
import qsTruthy from "./utils/qs_truthy";
import { addEntity, createWorld, defineQuery, enterQuery, exitQuery, hasComponent, pipe } from "bitecs";

import {
  Spin,
  Object3DTag,
  Networked,
  NETWORK_FLAGS,
  RemoteHoverTarget,
  CursorRaycastable,
  Holdable,
  OffersRemoteConstraint,
  Rigidbody,
  FloatyObject,
  Held
} from "./utils/jsx-entity";
import cubeSchema from "./network-schemas/interactable-cube";
import { ACTIVATION_STATE, FIT, SHAPE } from "three-ammo/constants";
import { COLLISION_LAYERS } from "./constants";

Object.defineProperties(THREE.Object3D.prototype, {
  components: {
    get: function() {
      // console.warn("Accessing 'components' on an Object3D");
      return {};
    }
  },
  classList: {
    get: function() {
      // console.warn("Accessing 'classlist' on an Object3D");
      return {
        contains() {
          return false;
        }
      };
    }
  }
});

const timeSystem = world => {
  const { time } = world;
  const now = performance.now();
  const delta = now - time.then;
  time.delta = delta;
  time.elapsed += delta;
  time.then = now;
  return world;
};

const spinQuery = defineQuery([Spin, Object3DTag]);
const spinSystem = world => {
  const ents = spinQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const obj = world.eid2obj.get(eid);
    const deltaSeconds = world.time.delta / 1000;
    obj.rotation.x += Spin.x[eid] * deltaSeconds;
    obj.rotation.y += Spin.y[eid] * deltaSeconds;
    obj.rotation.z += Spin.z[eid] * deltaSeconds;
    obj.matrixNeedsUpdate = true;
  }

  return world;
};

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const physicsCompatSystem = world => {
  const eids = rigidbodyEnteredQuery(world);
  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    // TODO this is weird, handling the fact that body-helper sets this up already...
    if (Rigidbody.bodyId[eid]) {
      console.log("Skipping", eid, "since it already has a body");
      continue;
    }

    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
    const obj = world.eid2obj.get(eid);
    const bodyId = physicsSystem.addBody(obj, {
      mass: 1,
      gravity: { x: 0, y: 0, z: 0 },
      linearDamping: 0.01,
      angularDamping: 0.01,
      linearSleepingThreshold: 1.6,
      angularSleepingThreshold: 2.5,
      angularFactor: { x: 1, y: 1, z: 1 },
      activationState: ACTIVATION_STATE.ACTIVE_TAG,
      type: "kinematic",
      emitCollisionEvents: false,
      disableCollision: false,
      collisionFilterGroup: 1,
      collisionFilterMask: 15,
      scaleAutoUpdate: false
    });
    Rigidbody.bodyId[eid] = bodyId;
    const shapeId = physicsSystem.addShapes(bodyId, obj, {
      type: SHAPE.BOX,
      fit: FIT.MANUAL,
      halfExtents: { x: 0.5, y: 0.5, z: 0.25 },
      margin: 0.01,
      offset: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 }
    });
    console.log("added body", eid, bodyId, shapeId);
  }

  return world;
};

const pendingNetworkData = [];
NAF.connection.subscribeToDataChannel("test", function(_, _dataType, data) {
  pendingNetworkData.push(data);
});

let lasteNetworkTick = 0;
const networkedQuery = defineQuery([Networked]);
const networkSystem = world => {
  if (world.time.elapsed - lasteNetworkTick < 1000) {
    return world;
  }
  lasteNetworkTick = world.time.elapsed;

  // for (let i = 0; i < pendingNetworkData.length; i++) {
  //   const deserializedEids = world.networkSchemas[0].deserialize(pendingNetworkData[i]);
  //   for (let j = 0; j < deserializedEids.length; j++) {
  //     const eid = deserializedEids[j];
  //     if (hasComponent(world, Networked, eid) && !Networked.flags[eid] & NETWORK_FLAGS.INFLATED) {
  //       const eid = world.networkSchemas[Networked.templateId[eid]].addEntity(world, eid);
  //       const obj = world.eid2obj.get(eid);
  //       world.scene.add(obj);
  //       Networked.flags[eid] &= NETWORK_FLAGS.INFLATED & NETWORK_FLAGS.IS_REMOTE_ENTITY;
  //       console.log("inflated", Networked.flags[eid], obj);
  //     }
  //   }
  // }
  // pendingNetworkData.length = 0;

  for (let i = 0; i < pendingNetworkData.length; i++) {
    const templateDatas = pendingNetworkData[i];
    const schema = world.networkSchemas[i];
    for (let j = 0; j < templateDatas.length; j++) {
      const entityDatas = templateDatas[j];
      if (entityDatas) {
        const netIds = Object.keys(entityDatas);
        for (let k = 0; k < netIds.length; k++) {
          const netId = netIds[k];
          const entityData = entityDatas[netId];
          let eid = world.netIdToEid.get(netId);
          if (eid === undefined) {
            eid = schema.addEntity(world);
            world.scene.add(world.eid2obj.get(eid));
            world.netIdToEid.set(netId, eid);
            console.log(`New network entity ${netId} -> ${eid}`);
          }
          console.log(`Got data for ${netId} -> ${eid}`, entityData);
          schema.deserialize(world, eid, entityData);
        }
      }
    }
  }
  pendingNetworkData.length = 0;

  const entities = networkedQuery(world);

  const data = [];
  let haveData = false;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const netId = Networked.networkId[eid];
    const schemaId = Networked.templateId[eid];
    const schema = world.networkSchemas[schemaId];
    const schemaData = data[schemaId] || {};
    schemaData[netId] = schema.serialize(world, eid);
    data[schemaId] = schemaData;
    haveData = true;
  }
  if (haveData) {
    NAF.connection.broadcastData("test", data);
    console.log(data);
  }

  return world;
};

const pipeline = pipe(
  timeSystem,
  networkSystem,
  physicsCompatSystem,
  spinSystem
);

export class App {
  constructor() {
    this.scene = null;
    this.store = new Store();
    this.mediaSearchStore = new MediaSearchStore();
    this.hubChannel = null;
    this.mediaDevicesManager = null;

    // TODO: Remove comments
    // TODO: Rename or reconfigure these as needed
    this.audios = new Map(); //                           el -> (THREE.Audio || THREE.PositionalAudio)
    this.sourceType = new Map(); //                       el -> SourceType
    this.audioOverrides = new Map(); //                   el -> AudioSettings
    this.zoneOverrides = new Map(); //                    el -> AudioSettings
    this.audioDebugPanelOverrides = new Map(); // SourceType -> AudioSettings
    this.sceneAudioDefaults = new Map(); //       SourceType -> AudioSettings
    this.gainMultipliers = new Map(); //                  el -> Number
    this.supplementaryAttenuation = new Map(); //         el -> Number
    this.clippingState = new Set();
    this.mutedState = new Set();
    this.isAudioPaused = new Set();

    this.world = createWorld();
    this.world.eid2obj = new Map(); // eid -> Object3D

    // reserve entity 0 to avoid needing to check for undefined everywhere eid is checked for existance
    addEntity(this.world);

    this.world.netIdToEid = new Map();

    // used for JSX and GLTFs
    this.world.nameToComponent = {
      object3d: Object3DTag,
      spin: Spin,
      networked: Networked,
      "cursor-raycastable": CursorRaycastable,
      "remote-hover-target": RemoteHoverTarget,
      holdable: Holdable,
      "offers-remote-constraint": OffersRemoteConstraint,
      rigidbody: Rigidbody,
      "floaty-object": FloatyObject
    };

    this.world.networkSchemas = [cubeSchema];
  }

  // This gets called by a-scene to setup the renderer, camera, and audio listener
  // TODO ideally the contorl flow here would be inverted, and we would setup this stuff,
  // initialize aframe, and then run our own RAF loop
  setupRenderer(sceneEl) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("a-canvas");
    canvas.dataset.aframeCanvas = true;

    // TODO this comes from aframe and prevents zoom on ipad.
    // This should alreeady be handleed by disable-ios-zoom but it does not appear to work
    canvas.addEventListener("touchmove", function(event) {
      event.preventDefault();
    });

    const renderer = new THREE.WebGLRenderer({
      // TODO we should not be using alpha: false https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#avoid_alphafalse_which_can_be_expensive
      alpha: false,
      antialias: true,
      depth: true,
      stencil: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      logarithmicDepthBuffer: false,
      // TODO we probably want high-performance
      powerPreference: "default",
      canvas
    });

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.debug.checkShaderErrors = qsTruthy("checkShaderErrors");

    // These get overridden by environment-system but setting to the highly expected defaults to avoid any extra work
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;

    sceneEl.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 10000);

    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    const renderClock = new THREE.Clock();

    // TODO NAF currently depends on this, it should not
    sceneEl.clock = renderClock;

    // TODO we should have 1 source of truth for time
    APP.world.time = {
      delta: 0,
      elapsed: 0,
      then: performance.now()
    };

    APP.world.scene = sceneEl.object3D;

    // Main RAF loop
    function mainTick(_rafTime, xrFrame) {
      // TODO we should probably be using time from the raf loop itself
      const delta = renderClock.getDelta() * 1000;
      const time = renderClock.elapsedTime * 1000;

      // TODO pass this into systems that care about it (like input) once they are moved into this loop
      sceneEl.frame = xrFrame;

      pipeline(APP.world);

      // Tick AFrame systems and components
      if (sceneEl.isPlaying) {
        sceneEl.tick(time, delta);
      }

      renderer.render(sceneEl.object3D, camera);
    }

    // This gets called after all system and component init functions
    sceneEl.addEventListener("loaded", () => {
      renderer.setAnimationLoop(mainTick);
      sceneEl.renderStarted = true;
    });

    return {
      renderer,
      camera,
      audioListener
    };
  }
}
