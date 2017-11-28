export default function registerInputMappings() {
  AFRAME.registerInputMappings({
    mappings: {
      default: {
        common: {
          keyboard_dpad_axes: "move" // This won't get received by the character controller if it is in the "keyboard" section, but this dpad is powered by wasd.
        },
        "vive-controls": {
          menudown: "action_mute",
          left_trackpad_pressed_axismove: "move",
          right_trackpad_dpad_pressed_west: "action_snap_rotate_left",
          right_trackpad_dpad_pressed_east: "action_snap_rotate_right",
          right_trackpad_center_down: "action_teleport_down", // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_aim"
          right_trackpad_center_up: "action_teleport_up", // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_teleport"
          right_trackpad_up: "action_teleport_up"
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
          v_press: "action_share_screen"
        }
      }
    }
  });
}
