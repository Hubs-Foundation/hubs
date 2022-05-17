import Store from "./storage/store";
import MediaSearchStore from "./storage/media-search-store";
import qsTruthy from "./utils/qs_truthy";
import { addEntity, createWorld, defineQuery, enterQuery, exitQuery, hasComponent, pipe } from "bitecs";

import { Networked, Owned } from "./bit-components";
import {
  Spin,
  Object3DTag,
  NETWORK_FLAGS,
  RemoteHoverTarget,
  CursorRaycastable,
  Holdable,
  OffersRemoteConstraint,
  Rigidbody,
  PhysicsShape,
  FloatyObject
} from "./utils/jsx-entity";
import cubeSchema from "./network-schemas/interactable-cube";
import { ACTIVATION_STATE, FIT, SHAPE } from "three-ammo/constants";

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
      emitCollisionEvents: false,
      scaleAutoUpdate: false,
      type: "kinematic",
      disableCollision: true,
      collisionFilterGroup: 16,
      collisionFilterMask: 1
    });

    Rigidbody.bodyId[eid] = bodyId;

    if (hasComponent(world, PhysicsShape, eid)) {
      const halfExtents = PhysicsShape.halfExtents[eid];
      const shapeId = physicsSystem.addShapes(bodyId, obj, {
        type: SHAPE.BOX,
        fit: FIT.MANUAL,
        halfExtents: { x: halfExtents[0], y: halfExtents[1], z: halfExtents[2] },
        margin: 0.01,
        offset: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      });
    }
  }

  return world;
};

let lasteNetworkTick = 0;
const networkedQuery = defineQuery([Networked]);

const pipeline = pipe(
  timeSystem,
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

    // TODO: Create accessor / update methods for these maps / set
    this.world.eid2obj = new Map(); // eid -> Object3D
    this.world.eid2nid = new Map([[0, 0]]);
    this.world.nid2eid = new Map([[0, 0]]);
    // TODO: This does not have to exclusively store strings, so this could "toSid( thing ) -> ui32" and "fromSid( ui32 ) -> thing"
    this.world.str2sid = new Map([[0, 0]]);
    this.world.sid2str = new Map([[0, 0]]);
    this.world.nextSid = 1;
    this.world.deletedNids = new Set();

    window.$o = eid => {
      this.world.eid2obj.get(eid);
    };

    // reserve entity 0 to avoid needing to check for undefined everywhere eid is checked for existance
    addEntity(this.world);

    // used for JSX and GLTFs
    this.world.nameToComponent = {
      object3d: Object3DTag,
      spin: Spin,
      networked: Networked,
      owned: Owned,
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
