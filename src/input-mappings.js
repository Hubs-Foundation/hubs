export default function registerInputMappings() {
  AFRAME.registerInputMappings({
    mappings: {
      default: {
        common: {
          // @TODO these dpad events are emmited by an axis-dpad component. This should probalby move into either tracked-controller or input-mapping
        },
        "vive-controls": {
          menudown: "action_mute",
          left_touchpad_pressed_axismove_x: "translateX",
          left_touchpad_pressed_axismove_y: "translateZ",
          touchpadbuttonup: "stop_moving",
          rightdpadleftdown: "action_snap_rotate_left",
          rightdpadrightdown: "action_snap_rotate_right",
          rightdpadcenterdown: "action_teleport_down", // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_aim"
          rightdpadcenterup: "action_teleport_up" // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_teleport"
        },
        "oculus-touch-controls": {
          xbuttondown: "action_mute",
          gripdown: "middle_ring_pinky_down",
          gripup: "middle_ring_pinky_up",
          thumbsticktouchstart: "thumb_down",
          thumbsticktouchend: "thumb_up",
          triggerdown: "index_down",
          triggerup: "index_up",
          left_axismove: "move",
          right_dpad_east: "action_snap_rotate_right",
          right_dpad_west: "action_snap_rotate_left",
          abuttondown: "action_teleport_down",
          abuttonup: "action_teleport_up"
        },
        daydream: {
          menudown: "action_mute"
        },
        keyboard: {
          m_press: "action_mute",
          q_press: "action_snap_rotate_left",
          e_press: "action_snap_rotate_right",
          v_press: "action_share_screen",
          w_down: "action_move_forward",
          w_up: "action_dont_move_forward",
          a_down: "action_move_left",
          a_up: "action_dont_move_left",
          s_down: "action_move_backward",
          s_up: "action_dont_move_backward",
          d_down: "action_move_right",
          d_up: "action_dont_move_right",
          dpad_axes: "move" // Why is the character controller not able to receive this one?
        }
      }
    }
  });
}
