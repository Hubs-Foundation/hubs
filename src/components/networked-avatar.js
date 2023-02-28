import { addComponent, removeComponent } from "bitecs";
import { NetworkedAvatar } from "../bit-components";
import qsTruthy from "../utils/qs_truthy";

/**
 * Stores networked avatar state.
 * @namespace avatar
 * @component networked-avatar
 */
AFRAME.registerComponent("networked-avatar", {
  schema: {
    left_hand_pose: { default: 0 },
    right_hand_pose: { default: 0 }
  },
  init() {
    if (qsTruthy("newLoader")) {
      addComponent(APP.world, NetworkedAvatar, this.el.eid);
    }
  },
  end() {
    if (qsTruthy("newLoader")) {
      removeComponent(APP.world, NetworkedAvatar, this.el.eid);
    }
  }
});
