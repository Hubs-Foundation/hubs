import { Pose } from "../pose";
import { angleTo4Direction } from "../../../utils/dpad";

const zeroVec2 = [0, 0];
export const xforms = {
  noop: function() {},
  copy: function(frame, src, dest) {
    frame[dest.value] = frame[src.value];
  },
  scale: function(scalar) {
    return function scale(frame, src, dest) {
      if (frame[src.value] !== undefined) {
        frame[dest.value] = frame[src.value] * scalar;
      }
    };
  },
  split_vec2: function(frame, src, dest) {
    if (frame[src.value] !== undefined) {
      frame[dest.x] = frame[src.value][0];
      frame[dest.y] = frame[src.value][1];
    }
  },
  compose_vec2: function(frame, src, dest) {
    if (frame[src.x] !== undefined && frame[src.y] !== undefined) {
      frame[dest.value] = [frame[src.x], frame[src.y]];
    }
  },
  negate: function(frame, src, dest) {
    frame[dest.value] = -frame[src.value];
  },
  copyIfFalse: function(frame, src, dest) {
    frame[dest.value] = frame[src.bool] ? undefined : frame[src.value];
  },
  copyIfTrue: function(frame, src, dest) {
    frame[dest.value] = frame[src.bool] ? frame[src.value] : undefined;
  },
  zeroIfDefined: function(frame, src, dest) {
    frame[dest.value] = frame[src.bool] !== undefined ? 0 : frame[src.value];
  },
  true: function(frame, src, dest) {
    frame[dest.value] = true;
  },
  rising: function rising(frame, src, dest, prevState) {
    frame[dest.value] = frame[src.value] && prevState === false;
    return !!frame[src.value];
  },
  risingWithFrameDelay: function(n) {
    return function risingWithFrameDelay(frame, src, dest, state = { values: new Array(n) }) {
      frame[dest.value] = state.values.shift();
      state.values.push(frame[src.value] && !state.prev);
      state.prev = frame[src.value];
      return state;
    };
  },
  falling: function falling(frame, src, dest, prevState) {
    frame[dest.value] = !frame[src.value] && prevState;
    return !!frame[src.value];
  },
  vec2Zero: function(frame, _, dest) {
    frame[dest.value] = zeroVec2;
  },
  poseFromCameraProjection: function() {
    let camera;
    const pose = new Pose();
    return function poseFromCameraProjection(frame, src, dest) {
      if (!camera) {
        camera = document.querySelector("#player-camera").components.camera.camera;
      }
      frame[dest.value] = pose.fromCameraProjection(camera, frame[src.value][0], frame[src.value][1]);
    };
  },
  vec2dpad: function(deadzoneRadius) {
    const deadzoneRadiusSquared = deadzoneRadius * deadzoneRadius;
    return function vec2dpad(frame, { value }, dest) {
      const [x, y] = frame[value];
      const inCenter = x * x + y * y < deadzoneRadiusSquared;
      const direction = inCenter ? "center" : angleTo4Direction(Math.atan2(x, -y));
      frame[dest[direction]] = true;
    };
  },
  always: function(constValue) {
    return function always(frame, _, dest) {
      frame[dest.value] = constValue;
    };
  }
};
