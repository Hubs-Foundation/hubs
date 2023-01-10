import { addComponent } from "bitecs";
import { FloatyObject } from "../bit-components";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";

AFRAME.registerComponent("floaty-object", {
  schema: {
    // On release, modify the gravity based upon gravitySpeedLimit. If less than this, let the object float
    // otherwise apply releaseGravity.
    modifyGravityOnRelease: { default: false },

    // Gravity to apply if object is thrown at a speed greated than speed limit.
    releaseGravity: { default: -2 },

    // If true, the degree to which angular rotation is allowed when floating is reduced (useful for 2d media)
    reduceAngularFloat: { default: false },

    // If true, the object will behave the same regardless of how fast it was moving when released
    unthrowable: { default: false }
  },

  init() {
    addComponent(APP.world, FloatyObject, this.el.object3D.eid);
  },

  update() {
    FloatyObject.flags[this.el.eid] =
      (this.data.modifyGravityOnRelease && FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE) |
      (this.data.reduceAngularFloat && FLOATY_OBJECT_FLAGS.REDUCE_ANGULAR_FLOAT) |
      (this.data.unthrowable && FLOATY_OBJECT_FLAGS.UNTHROWABLE);
    FloatyObject.releaseGravity[this.el.eid] = this.data.releaseGravity;
  }
});
