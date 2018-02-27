const inGameActions = {
  // Define action sets here.
  // An action set separates "driving" controls from "menu" controls.
  // Only one action set is active at a time.
  default: {
    move: { label: "Move" },
    snap_rotate_left: { label: "Snap Rotate Left" },
    snap_rotate_right: { label: "Snap Rotate Right" },
    action_mute: { label: "Mute" },
    action_teleport_down: { label: "Teleport Aim" },
    action_teleport_up: { label: "Teleport" },
    action_share_screen: { label: "Share Screen" }
  }
};

const config = {
  behaviours: {
    default: {
      "oculus-touch-controls": {
        joystick: "oculus_touch_joystick_dpad4"
      },
      "vive-controls": {
        trackpad: "vive_trackpad_dpad4"
      }
    }
  },
  mappings: {
    default: {
      "vive-controls": {
        menudown: "action_mute",
        "trackpad.pressedmove": { left: "move" },
        trackpad_dpad4_pressed_west_down: { right: "snap_rotate_left" },
        trackpad_dpad4_pressed_east_down: { right: "snap_rotate_right" },
        trackpad_dpad4_pressed_center_down: { right: "action_teleport_down" },
        trackpadup: { right: "action_teleport_up" }
      },
      "oculus-touch-controls": {
        joystick_dpad4_west: {
          right: "snap_rotate_left"
        },
        joystick_dpad4_east: {
          right: "snap_rotate_right"
        },
        xbuttondown: "action_mute",
        gripdown: "middle_ring_pinky_down",
        gripup: "middle_ring_pinky_up",
        thumbsticktouchstart: "thumb_down",
        thumbsticktouchend: "thumb_up",
        // @TODO: How do I map more than one action to triggerdown?
        //        triggerdown: "index_down",
        //        triggerup: "index_up",
        triggerdown: "action_teleport_down",
        triggerup: "action_teleport_up",
        "axismove.reverseY": { left: "move" },
        right_dpad_east: "snap_rotate_right",
        right_dpad_west: "snap_rotate_left",
        abuttondown: "action_teleport_down",
        abuttonup: "action_teleport_up"
      },
      "daydream-controls": {
        menudown: "action_mute",
        trackpaddown: "action_teleport_down",
        trackpadup: "action_teleport_up"
      },
      keyboard: {
        m_press: "action_mute",
        q_press: "snap_rotate_left",
        e_press: "snap_rotate_right",
        v_press: "action_share_screen",
        b_press: "action_select_hud_item",

        // We can't create a keyboard behaviour with AFIM yet,
        // so these will get captured by wasd-to-analog2d
        w_down: "w_down",
        w_up: "w_up",
        a_down: "a_down",
        a_up: "a_up",
        s_down: "s_down",
        s_up: "s_up",
        d_down: "d_down",
        d_up: "d_up",
        W_down: "w_down",
        W_up: "w_up",
        A_down: "a_down",
        A_up: "a_up",
        S_down: "s_down",
        S_up: "s_up",
        D_down: "d_down",
        D_up: "d_up"
      }
    }
  }
};

export { inGameActions, config };
