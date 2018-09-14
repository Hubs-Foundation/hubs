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
  },
  hud: {
    action_ui_select_down: { label: "Select UI item" },
    action_ui_select_up: { label: "Select UI item" }
  }
};

const config = {
  behaviours: {
    default: {
      "oculus-touch-controls": {
        joystick: "joystick_dpad4"
      },
      "vive-controls": {
        trackpad: "trackpad_dpad4",
        trackpad_scrolling: "trackpad_scrolling"
      },
      "windows-motion-controls": {
        joystick: "joystick_dpad4",
        axisMoveWithDeadzone: "msft_mr_axis_with_deadzone"
      },
      "daydream-controls": {
        trackpad: "trackpad_dpad4",
        axisMoveWithDeadzone: "msft_mr_axis_with_deadzone"
      },
      "gearvr-controls": {
        trackpad: "trackpad_dpad4",
        trackpad_scrolling: "trackpad_scrolling"
      },
    }
  },
  mappings: {
    default: {
      "vive-controls": {
        "trackpad.pressedmove": { left: "move" },
        trackpad_dpad4_pressed_west_down: { right: "snap_rotate_left" },
        trackpad_dpad4_pressed_east_down: { right: "snap_rotate_right" },
        trackpad_dpad4_pressed_center_down: { right: "action_primary_down" },
        trackpad_dpad4_pressed_north_down: { right: "action_primary_down" },
        trackpad_dpad4_pressed_south_down: { right: "action_primary_down" },
        trackpadup: { left: "action_primary_up", right: "action_primary_up" },
        menudown: "thumb_down",
        menuup: "thumb_up",
        gripdown: ["primary_action_grab", "middle_ring_pinky_down"],
        gripup: ["primary_action_release", "middle_ring_pinky_up"],
        trackpadtouchstart: "thumb_down",
        trackpadtouchend: "thumb_up",
        triggerdown: ["secondary_action_grab", "index_down"],
        triggerup: ["secondary_action_release", "index_up"],
        scroll: { left: "scroll_move", right: "scroll_move" }
      },
      "windows-motion-controls": {
        joystick_dpad4_west: {
          right: "snap_rotate_left"
        },
        joystick_dpad4_east: {
          right: "snap_rotate_right"
        },
        "trackpad.pressedmove": { left: "move" },
        joystick_dpad4_pressed_west_down: { right: "snap_rotate_left" },
        joystick_dpad4_pressed_east_down: { right: "snap_rotate_right" },
        trackpaddown: { right: "action_primary_down" },
        trackpadup: { left: "action_primary_up", right: "action_primary_up" },
        menudown: "thumb_down",
        menuup: "thumb_up",
        gripdown: ["primary_action_grab", "middle_ring_pinky_down"],
        gripup: ["primary_action_release", "middle_ring_pinky_up"],
        trackpadtouchstart: "thumb_down",
        trackpadtouchend: "thumb_up",
        triggerdown: ["secondary_action_grab", "index_down"],
        triggerup: ["secondary_action_release", "index_up"],
        axisMoveWithDeadzone: { left: "move", right: "scroll_move" }
      },
      "daydream-controls": {
        trackpad_dpad4_pressed_west_down: "snap_rotate_left",
        trackpad_dpad4_pressed_east_down: "snap_rotate_right",
        trackpad_dpad4_pressed_center_down: ["action_primary_down"],
        trackpad_dpad4_pressed_north_down: ["action_primary_down"],
        trackpad_dpad4_pressed_south_down: ["action_primary_down"],
        trackpadup: ["action_primary_up"],
        axisMoveWithDeadzone: "scroll_move"
      },
      "gearvr-controls": {
        trackpad_dpad4_pressed_west_down: "snap_rotate_left",
        trackpad_dpad4_pressed_east_down: "snap_rotate_right",
        trackpad_dpad4_pressed_center_down: ["action_primary_down"],
        trackpad_dpad4_pressed_north_down: ["action_primary_down"],
        trackpad_dpad4_pressed_south_down: ["action_primary_down"],
        trackpadup: ["action_primary_up"],
        triggerdown: ["action_secondary_down"],
        triggerup: ["action_secondary_up"],
        scroll: "scroll_move"
      },
      "oculus-go-controls": {
        trackpad_dpad4_pressed_west_down: "snap_rotate_left",
        trackpad_dpad4_pressed_east_down: "snap_rotate_right",
        trackpad_dpad4_pressed_center_down: ["action_primary_down"],
        trackpad_dpad4_pressed_north_down: ["action_primary_down"],
        trackpad_dpad4_pressed_south_down: ["action_primary_down"],
        trackpadup: ["action_primary_up"],
        triggerdown: ["action_secondary_down"],
        triggerup: ["action_secondary_up"],
        scroll: "scroll_move"
      },
      keyboard: {
        m_press: "action_mute",
        b_press: "action_share_screen",

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
        arrowup_down: "w_down",
        arrowup_up: "w_up",
        arrowleft_down: "a_down",
        arrowleft_up: "a_up",
        arrowdown_down: "s_down",
        arrowdown_up: "s_up",
        arrowright_down: "d_down",
        arrowright_up: "d_up"
      }
    }
  }
};

export { inGameActions, config };
