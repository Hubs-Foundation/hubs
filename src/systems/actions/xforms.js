export const xforms = {
  noop: function() {},
  copy: function(frame, src, dest) {
    frame[dest.value] = frame[src.value];
  },
  scale: function(scalar) {
    return function scale(frame, src, dest) {
      if (frame[src.value]) {
        frame[dest.value] = frame[src.value] * scalar;
      }
    };
  },
  split_vec2: function(frame, src, dest) {
    if (frame[src.value]) {
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
    frame[dest.value] = frame[src.bool] ? 0 : frame[src.value];
  },
  copyIfTrue: function(frame, src, dest) {
    frame[dest.value] = frame[src.bool] ? frame[src.value] : 0;
  },
  true: function(frame, src, dest) {
    frame[dest.value] = true;
  },
  rising: function() {
    let prev = false;
    return function rising(frame, src, dest) {
      frame[dest.value] = frame[src.value] && !prev;
      prev = frame[src.value];
    };
  },
  risingWithFrameDelay: function(n) {
    let values = [];
    for (var i = 0; i < n; i++) {
      values[i] = undefined;
    }
    let valueForThisFrame;
    let prev = false;
    return function risingWithFrameDelay(frame, src, dest) {
      frame[dest.value] = values.splice(0, 1)[0];
      values.push(frame[src.value] && !prev);
      prev = frame[src.value];
    };
  },
  falling: function() {
    let prev = false;
    return function falling(frame, src, dest) {
      frame[dest.value] = !frame[src.value] && prev;
      prev = frame[src.value];
    };
  },
  throttleDecrement: function(max, step) {
    let ceiling = max;
    let i = max;
    return function throttleDecrement(frame, src, dest) {
      if (frame[src.value]) {
        i = i - 1;
        if (i < 0) {
          ceiling = ceiling - step;
          i = ceiling;
          frame[dest.value] = frame[src.value];
        }
      } else {
        ceiling = max;
        i = -1;
      }
    };
  },
  throttleIncrement: function(n) {
    let i = 0;
    let max = 0;
    return function throttleIncrement(frame, src, dest) {
      if (frame[src.value]) {
        i = i + 1;
        if (i > max) {
          i = 0;
          max = max + n;
          frame[dest.value] = frame[src.value];
          console.log(dest.value, frame[dest.value]);
        }
      } else {
        i = 0;
        max = 0;
      }
    };
  }
};
