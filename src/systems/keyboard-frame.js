let debug = false;

const eventQueue = [];
const capture = function capture(e) {
  this.push(e);
};
document.addEventListener("keydown", capture.bind(eventQueue));
document.addEventListener("keyup", capture.bind(eventQueue));
document.addEventListener("blur", capture.bind(eventQueue));

let prevKeyFrame = {};
let keyFrame = {};
const remember = function remember(keyFrame, prevKeyFrame) {
  for (const key in keyFrame) {
    if (keyFrame[key]) {
      prevKeyFrame[key] = true;
    }
  }
  return prevKeyFrame;
};

const consume = function consume(queue, frame) {
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    const key = event.key.toLowerCase();
    switch (event.type) {
      case "keydown":
        frame[key] = true;
        break;
      case "keyup":
        frame[key] = false;
        break;
      case "blur":
        for (const key in frame) {
          frame[key] = false;
        }
        break;
    }
  }
  return frame;
};

const key4_to_vec2 = function key4_to_vec2() {
  return {
    key4: [false, false, false, false],
    vec2: [0, 0],
    filter: function filter({ keys, filters }, keyFrame, prevKeyFrame) {
      for (let i = 0; i < this.key4.length; i++) {
        const key = keys[i];
        const filter = filters[i];
        switch (filter) {
          case "keydown":
            this.key4[i] = !prevKeyFrame[key] && keyFrame[key];
            break;
          case "keyup":
            this.key4[i] = prevKeyFrame[key] && !keyFrame[key];
            break;
          case "key":
            this.key4[i] = keyFrame[key];
            break;
          case "nokey":
            this.key4[i] = !keyFrame[key];
            break;
        }
      }
      this.vec2[0] = (this.key4[0] ? 1 : 0) + (this.key4[1] ? -1 : 0);
      this.vec2[1] = (this.key4[2] ? 1 : 0) + (this.key4[3] ? -1 : 0);
      return this.vec2;
    }
  };
};

const bindDefn = [
  // This entry in `bindDefn`
  {
    action: "snapRotateLeft",
    set: "snapRotating",
    filter: "keydown",
    key: "q"
  },
  // means that when you run
  //
  //   `AFRAME.scenes[0].systems.keyboardFrame.poll( "snapRotateLeft" )`
  //
  // in the console, it returns `true` on the frame that you press `q`,
  // and `false` otherwise.
  //
  {
    action: "snapRotateRight",
    set: "snapRotating",
    filter: "keydown",
    key: "e"
  },
  {
    action: "toggleMute",
    set: "muteToggling",
    filter: "keydown",
    key: "m"
  },
  {
    action: "toggleScreenShare",
    set: "screenShareToggling",
    filter: "keydown",
    key: "b"
  },

  // This entry in `bindDefn`
  {
    action: "move",
    set: "moving",
    filter: "key4_to_vec2",
    filter_params: {
      keys: ["d", "a", "w", "s"],
      filters: ["key", "key", "key", "key"]
    }
  },
  // means that
  //
  //   `AFRAME.scenes[0].systems.keyboardFrame.poll( "move" )`
  //
  // will return a vector [u,v] where
  //   -1 < u < 1 and
  //   -1 < v < 1,
  // replacing the need for the component, wasd-to-analog2d.
  // TODO: The filter doesn't fully mimick wasd-to-analog2d yet.
  {
    action: "boost",
    set: "moving",
    filter: "key",
    key: "shift"
  }
];

const actionFrame = {};
const activeActionSets = ["muteToggling", "snapRotating", "screenShareToggling", "moving"];
const fillActionFrameFromBinding = function fillActionFrameFromBinding(binding, keyFrame, prevKeyFrame, actionFrame) {
  const setIsActive = activeActionSets.indexOf(binding.set) !== -1;
  if (!setIsActive) return; // leave actionFrame(binding.action) as it is for now.
  let action;
  switch (binding.filter) {
    case "keydown":
      action = !prevKeyFrame[binding.key] && keyFrame[binding.key];
      break;
    case "keyup":
      action = prevKeyFrame[binding.key] && !keyFrame[binding.key];
      break;
    case "key":
      action = keyFrame[binding.key];
      break;
    case "nokey":
      action = !keyFrame[binding.key];
      break;
    case "key4_to_vec2":
      if (!binding.filterFn) {
        binding.filterFn = key4_to_vec2();
      }
      action = binding.filterFn.filter(binding.filter_params, keyFrame, prevKeyFrame);
      break;
  }
  actionFrame[binding.action] = action;
};

const fillActionFrame = function fillActionFrame(bindDefn, keyFrame, prevKeyFrame, actionFrame) {
  for (let i = 0; i < bindDefn.length; i++) {
    const binding = bindDefn[i];
    fillActionFrameFromBinding(binding, keyFrame, prevKeyFrame, actionFrame);
    if (debug && actionFrame[binding.action]) {
      console.log(binding.action);
    }
  }
};

AFRAME.registerSystem("keyboardFrame", {
  init() {},

  tick() {
    prevKeyFrame = {}; // garbage
    prevKeyFrame = remember(keyFrame, prevKeyFrame);
    keyFrame = consume(eventQueue, keyFrame);
    eventQueue.length = 0;
    fillActionFrame(bindDefn, keyFrame, prevKeyFrame, actionFrame);
  },

  poll(action) {
    return actionFrame[action];
  },

  setDebug(d) {
    debug = d;
  }
});

// The code in this file replaces this segment of `input-mappings.js` :
//     keyboard: {
//       m_press: "action_mute",
//       q_press: "snap_rotate_left",
//       e_press: "snap_rotate_right",
//       b_press: "action_share_screen",
//
//       // We can't create a keyboard behaviour with AFIM yet,
//       // so these will get captured by wasd-to-analog2d
//       w_down: "w_down",
//       w_up: "w_up",
//       a_down: "a_down",
//       a_up: "a_up",
//       s_down: "s_down",
//       s_up: "s_up",
//       d_down: "d_down",
//       d_up: "d_up",
//       arrowup_down: "w_down",
//       arrowup_up: "w_up",
//       arrowleft_down: "a_down",
//       arrowleft_up: "a_up",
//       arrowdown_down: "s_down",
//       arrowdown_up: "s_up",
//       arrowright_down: "d_down",
//       arrowright_up: "d_up"
//     }
// TODO: Remove this comment
