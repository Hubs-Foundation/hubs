import { Pose } from "../pose";
import { angleTo4Direction } from "../../../utils/dpad";

export const xforms = {
  noop: function () {},
  copy: function (frame, src, dest) {
    frame.setValueType(dest.value, frame.get(src.value));
  },
  scale: function (scalar) {
    return function scale(frame, src, dest) {
      if (frame.get(src.value) !== undefined) {
        frame.setValueType(dest.value, frame.get(src.value) * scalar);
      }
    };
  },
  scaleExp: function (scalar, exp = 1) {
    return function scale(frame, src, dest) {
      if (frame.get(src.value) !== undefined) {
        if (exp === 1) {
          frame.setValueType(dest.value, frame.get(src.value) * scalar);
        } else {
          frame.setValueType(dest.value, Math.pow(frame.get(src.value), exp) * scalar);
        }
      }
    };
  },
  deadzone: function (deadzoneSize) {
    return function deadzone(frame, src, dest) {
      frame.setValueType(dest.value, Math.abs(frame.get(src.value)) < deadzoneSize ? 0 : frame.get(src.value));
    };
  },
  split_vec2: function (frame, src, dest) {
    const value = frame.get(src.value);
    if (value !== undefined) {
      frame.setValueType(dest.x, value[0]);
      frame.setValueType(dest.y, value[1]);
    }
  },
  compose_vec2: function (frame, src, dest) {
    const x = frame.get(src.x);
    const y = frame.get(src.y);
    if (x !== undefined && y !== undefined) {
      frame.setVector2(dest.value, x, y);
    }
  },
  negate: function (frame, src, dest) {
    frame.setValueType(dest.value, -frame.get(src.value));
  },
  copyIfFalse: function (frame, src, dest) {
    frame.setValueType(dest.value, frame.get(src.bool) ? undefined : frame.get(src.value));
  },
  copyIfTrue: function (frame, src, dest) {
    frame.setValueType(dest.value, frame.get(src.bool) ? frame.get(src.value) : undefined);
  },
  copyVec2IfTrue: function (frame, src, dest) {
    if (frame.get(src.bool)) {
      const v2 = frame.get(src.value);
      frame.setVector2(dest.value, v2[0], v2[1]);
    }
  },
  zeroIfDefined: function (frame, src, dest) {
    frame.setValueType(dest.value, frame.get(src.bool) !== undefined ? 0 : frame.get(src.value));
  },
  true: function (frame, src, dest) {
    frame.setValueType(dest.value, true);
  },
  rising: function rising(frame, src, dest, prevState) {
    frame.setValueType(dest.value, frame.get(src.value) && prevState === false);
    return !!frame.get(src.value);
  },
  clickAndHold: function (grabDelayMs = 160) {
    return function (frame, src, dest, state = {}) {
      let click = false;
      let grab = false;
      let drop = false;

      if (frame.get(src.rising)) {
        state.buttonDownTime = performance.now();
      } else if (state.buttonDownTime && frame.get(src.falling)) {
        state.buttonDownTime = 0;
        if (state.grabbed) {
          state.grabbed = false;
          drop = true;
        } else {
          click = true;
        }
      } else if (state.buttonDownTime && !state.grabbed && performance.now() - state.buttonDownTime > grabDelayMs) {
        state.grabbed = true;
        grab = true;
      }

      frame.setValueType(dest.click, click);
      frame.setValueType(dest.grab, grab);
      frame.setValueType(dest.drop, drop);
      return state;
    };
  },
  risingWithFrameDelay: function (n) {
    return function risingWithFrameDelay(frame, src, dest, state = { values: new Array(n) }) {
      frame.setValueType(dest.value, state.values.shift());
      state.values.push(frame.get(src.value) && !state.prev);
      state.prev = frame.get(src.value);
      return state;
    };
  },
  falling: function falling(frame, src, dest, prevState) {
    frame.setValueType(dest.value, !frame.get(src.value) && prevState);
    return !!frame.get(src.value);
  },
  vec2Zero: function (frame, _, dest) {
    frame.setVector2(dest.value, 0, 0);
  },
  poseFromCameraProjection: function () {
    const pose = new Pose();
    return function poseFromCameraProjection(frame, src, dest) {
      const camera = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.viewingCamera;
      const value = frame.get(src.value);
      frame.setPose(dest.value, pose.fromCameraProjection(camera, value[0], value[1]));
    };
  },
  vec2dpad: function (deadzoneRadius, invertX = false, invertY = false) {
    const deadzoneRadiusSquared = deadzoneRadius * deadzoneRadius;

    return function vec2dpad(frame, src, dest) {
      if (!frame.get(src.value)) return;
      const [x, y] = frame.get(src.value);
      const inCenter = x * x + y * y < deadzoneRadiusSquared;
      const direction = inCenter ? "center" : angleTo4Direction(Math.atan2(invertX ? -x : x, invertY ? -y : y));
      if (!dest[direction]) return;
      frame.setValueType(dest[direction], true);
    };
  },
  always: function (constValue) {
    return function always(frame, _, dest) {
      frame.setValueType(dest.value, constValue);
    };
  },
  wasd_to_vec2: function (frame, { w, a, s, d }, { vec2 }) {
    let x = 0;
    let y = 0;
    if (frame.get(a)) x -= 1;
    if (frame.get(d)) x += 1;
    if (frame.get(w)) y += 1;
    if (frame.get(s)) y -= 1;
    frame.setVector2(vec2, x, y);
  },
  add_vec2: function (frame, src, dest) {
    const first = frame.get(src.first);
    const second = frame.get(src.second);
    if (first && second) {
      frame.setVector2(dest.value, first[0] + second[0], first[1] + second[1]);
    } else if (second) {
      frame.setVector2(dest.value, second[0], second[1]);
    } else if (first) {
      frame.setVector2(dest.value, first[0], first[1]);
    }
  },
  max_vec2: function (frame, src, dest) {
    const first = frame.get(src.first);
    const second = frame.get(src.second);
    if (first && second) {
      const max =
        first[0] * first[0] + first[1] * first[1] > second[0] * second[0] + second[1] * second[1] ? first : second;
      frame.setVector2(dest.value, max[0], max[1]);
    } else if (second) {
      frame.setVector2(dest.value, second[0], second[1]);
    } else if (first) {
      frame.setVector2(dest.value, first[0], first[1]);
    }
  },
  normalize_vec2: function (frame, src, dest) {
    const vec2 = frame.get(src.value);
    if (vec2) {
      if (vec2[0] === 0 && vec2[0] === 0) {
        frame.setVector2(dest.value, vec2[0], vec2[1]);
      } else {
        const l = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
        frame.setVector2(dest.value, vec2[0] / l, vec2[1] / l);
      }
    }
  },
  all: function (frame, src, dest) {
    for (let i = 0, l = src.length; i < l; i++) {
      const path = src[i];
      if (!frame.get(path)) {
        frame.setValueType(dest.value, false);
        return;
      }
    }
    frame.setValueType(dest.value, true);
  },
  any: function (frame, src, dest) {
    for (let i = 0, l = src.length; i < l; i++) {
      const path = src[i];
      if (frame.get(path)) {
        frame.setValueType(dest.value, true);
        return;
      }
    }
    frame.setValueType(dest.value, false);
  },
  touch_axis_scroll(scale = 1, snap_to) {
    return function touch_axis_scroll(frame, src, dest, state = { value: 0, touching: false }) {
      if (snap_to === undefined || Math.abs(frame.get(src.value) - state.value) >= snap_to) {
        frame.setValueType(
          dest.value,
          state.touching && frame.get(src.touching) ? scale * (frame.get(src.value) - state.value) : 0
        );
      }

      state.value = frame.get(src.value);
      state.touching = frame.get(src.touching);

      return state;
    };
  },
  diff_vec2: function diff_vec2(frame, src, dest, state = [0, 0]) {
    const v2 = frame.get(src.value);
    if (v2) {
      frame.setVector2(dest.value, v2[0] - state[0], v2[1] - state[1]);
      state[0] = v2[0];
      state[1] = v2[1];
    }
    return state;
  },
  invert_vec2_if_preference(preference) {
    return function invert_vec2_if_preference(frame, src, dest) {
      const vec2 = frame.get(src.value);
      if (vec2) {
        const invert =
          window.APP &&
          window.APP.store &&
          window.APP.store.state &&
          window.APP.store.state.preferences &&
          (window.APP.store.state.preferences[preference] ||
            window.APP.store.state.preferences[preference] === undefined);
        const oneOrMinusOne = invert ? -1 : 1;
        frame.setVector2(dest.value, vec2[0] * oneOrMinusOne, vec2[1] * oneOrMinusOne);
      }
    };
  }
};
