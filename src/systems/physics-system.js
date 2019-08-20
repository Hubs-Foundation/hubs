import { World } from "three-ammo";
import { TYPE } from "three-ammo/constants";

const WORLD_CONFIG = {
  debugDrawMode: THREE.AmmoDebugConstants.DrawWireframe,
  gravity: { x: 0, y: -9.8, z: 0 }
};

export class PhysicsSystem {
  constructor(scene) {
    const Ammo = require("ammo.js/builds/ammo.wasm.js");
    const AmmoWasm = require("ammo.js/builds/ammo.wasm.wasm");
    const AmmoModule = Ammo.bind(undefined, {
      locateFile(path) {
        if (path.endsWith(".wasm")) {
          return AmmoWasm;
        }
        return path;
      }
    });

    this.bodies = [];
    this.bodyHelpers = [];
    this.shapeHelpers = [];

    this.debugRequested = false;
    this.debugEnabled = false;
    this.scene = scene;
    this.stepDuration = 0;

    AmmoModule().then(() => {
      this.world = new World(WORLD_CONFIG);

      for (const bodyHelper of this.bodyHelpers) {
        if (bodyHelper.alive) bodyHelper.init2();
      }
      for (const shapeHelper of this.shapeHelpers) {
        if (shapeHelper.alive) shapeHelper.init2();
      }
      this.shapeHelpers.length = 0;
      this.bodyHelpers.length = 0;
    });
  }

  setDebug(debug) {
    this.debugRequested = debug;
  }

  tick(dt) {
    if (this.world) {
      if (this.debugRequested !== this.debugEnabled) {
        this.debugEnabled = this.debugRequested;
        if (this.debugEnabled) {
          this.world.getDebugDrawer(this.scene).enable();
        } else {
          this.world.getDebugDrawer(this.scene).disable();
        }
      }

      for (let i = 0; i < this.bodies.length; i++) {
        this.bodies[i].updateShapes();
        if (this.bodies[i].type !== TYPE.DYNAMIC) {
          this.bodies[i].syncToPhysics();
        }
      }
      const time = performance.now();
      this.world.step(dt / 1000);
      this.stepDuration = performance.now() - time;
      for (let i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].type === TYPE.DYNAMIC) {
          this.bodies[i].syncFromPhysics();
        }
      }
    }
  }

  addBody(body) {
    this.bodies.push(body);
  }

  removeBody(body) {
    const idx = this.bodies.indexOf(body);
    if (idx !== -1) {
      this.bodies.splice(idx, 1);
    }
  }

  registerBodyHelper(bodyHelper) {
    if (this.world) {
      bodyHelper.init2();
    } else {
      this.bodyHelpers.push(bodyHelper);
    }
  }

  registerShapeHelper(shapeHelper) {
    if (this.world) {
      shapeHelper.init2();
    } else {
      this.shapeHelpers.push(shapeHelper);
    }
  }
}
