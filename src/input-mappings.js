export default function registerInputMappings() {
  AFRAME.registerInputMappings({
    default: {
      common: {
        // @TODO these dpad events are emmited by an axis-dpad component. This should probalby move into either tracked-controller or input-mapping
        dpadleftdown: "action_snap_rotate_left",
        dpadrightdown: "action_snap_rotate_right",
        dpadcenterdown: "action_teleport_down", // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_aim"
        dpadcenterup: "action_teleport_up", // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_teleport"
        touchpadpressedaxismovex: "translateX",
        touchpadpressedaxismovey: "translateZ",
        touchpadbuttonup: "stop_moving"
      },
      "vive-controls": {
        menudown: "action_mute"
      },
      "oculus-touch-controls": {
        xbuttondown: "action_mute"
      },
      daydream: {
        menudown: "action_mute"
      },
      keyboard: {
        m_press: "action_mute",
        q_press: "action_snap_rotate_left",
        e_press: "action_snap_rotate_right",
        w_down: "action_move_forward",
        w_up: "action_dont_move_forward",
        a_down: "action_move_left",
        a_up: "action_dont_move_left",
        s_down: "action_move_backward",
        s_up: "action_dont_move_backward",
        d_down: "action_move_right",
        d_up: "action_dont_move_right"
      }
    }
  });
}
