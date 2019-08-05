import { World } from "three-ammo";
import { TYPE } from "three-ammo/src/constants";

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

    this.debug = false;
    this.scene = scene;
    this.stepDuration = 0;

    AmmoModule().then(() => {
      this.world = new World({
        debugDrawMode: THREE.AmmoDebugConstants.DrawWireframe,
        gravity: { x: 0, y: -9.8, z: 0 }
      });
    });
  }

  setDebug(debug) {
    this.debug = debug;
    if (this.debug) {
      this.world.getDebugDrawer(this.scene).enable();
    } else {
      this.world.getDebugDrawer(this.scene).disable();
    }
  }

  tick(dt) {
    if (this.world) {
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
}
